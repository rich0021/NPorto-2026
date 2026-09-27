"use client";

import { Mesh, Program, Renderer, RenderTarget, Triangle, Vec2 } from "ogl";
import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
import { halfFloatTargets, type Format } from "@/lib/webgl";

// A Navier–Stokes fluid that the cursor stirs, ported from douglus.site.
// Moving the mouse pushes velocity into a 256² grid; each frame the grid swirls
// (vorticity), stays incompressible (pressure solve) and carries itself along
// (advection). The last pass paints where the fluid is moving as a pale
// lavender shimmer, multiplied over the page so it tints the white and leaves
// the black type alone. Mounted once in the root layout as a fixed layer over
// every page, so it keeps flowing across navigation.

// Bolder than the reference (its values in brackets): a wider brush, harder
// pushes, trails that linger, and a denser, deeper tint.
const SIM_RES = 256;
const PRESSURE_ITERATIONS = 4;
const VELOCITY_DISSIPATION = 0.97; // [0.95] closer to 1 = longer trails
const PRESSURE_DISSIPATION = 0.8;
const CURL = 2; // [1] swirl
const SPLAT_RADIUS = 0.006; // [0.0025] brush size
const VELOCITY_MULTIPLIER = 12; // [8] force per mouse movement
const MIN_SPEED = 0.005;
const INTENSITY = 1.4; // [0.8] opacity of the tint
const TINT = 0.62; // [0.7] lower = deeper tint under the multiply blend
const GLOW = 0.25; // [0.45] white sheen on fast strokes, which lightens them
// Stop simulating once the fluid has been still for this long.
const IDLE_MS = 4000;

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  uniform vec2 texelSize;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 0, 1);
  }
`;

const clearShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const splatShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }
  void main () {
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    gl_FragColor = dissipation * bilerp(uSource, coord, texelSize);
    gl_FragColor.a = 1.0;
  }
`;

const divergenceShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
  }
`;

const pressureShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Turns the velocity field into colour: brighter where it moves fast, edged
// where speed changes, hue drifting between two pale tints with the swirl.
const compositeShader = /* glsl */ `
  precision highp float;
  uniform sampler2D tFluid;
  uniform float uIntensity;
  uniform float uTint;
  uniform float uGlow;
  uniform float uTime;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    vec2 v = texture2D(tFluid, vUv).xy;
    float speed = length(v) * 2.0;

    float c = speed;
    float l = length(texture2D(tFluid, vL).xy);
    float r = length(texture2D(tFluid, vR).xy);
    float t = length(texture2D(tFluid, vT).xy);
    float b = length(texture2D(tFluid, vB).xy);
    float edge = abs((r - c) - (c - l)) + abs((t - c) - (c - b));

    float curlL = texture2D(tFluid, vL).y;
    float curlR = texture2D(tFluid, vR).y;
    float curlT = texture2D(tFluid, vT).x;
    float curlB = texture2D(tFluid, vB).x;
    float curl = (curlR - curlL + curlB - curlT) * 0.5;

    float hueShift = sin(uTime * 2.0 + curl * 10.0) * 0.5 + 0.5;
    vec3 color1 = vec3(0.88, 0.90, 0.94);
    vec3 color2 = vec3(0.82, 0.78, 0.88);
    vec3 baseColor = mix(color1, color2, hueShift);

    float spark = sin(dot(v, vUv) * 100.0 + uTime * 20.0) * 0.5 + 0.5;
    spark = pow(spark, 2.0) * speed * 2.0;

    // The body carries the stroke; edges and sparkle are kept light, since at
    // this strength they turn into jagged ripples.
    float intensity = speed * 0.14 + edge * 0.08 + spark * 0.1;
    intensity = clamp(intensity * uIntensity, 0.0, 1.0);

    vec3 glow = vec3(0.95, 0.96, 1.0) * speed * uGlow;
    gl_FragColor = vec4(baseColor * uTint + glow, intensity);
  }
`;

export function LiquidCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || prefersReducedMotion() || !hasFinePointer()) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 1.5), alpha: true, depth: false });
    } catch {
      return; // no WebGL: the hero just stays still
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const float = halfFloatTargets(renderer);
    if (!float) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }
    const { type: halfFloat, rg, r, linear } = float;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(canvas);

    const target = (fmt: Format, filter: number) =>
      new RenderTarget(gl, {
        width: SIM_RES,
        height: SIM_RES,
        type: halfFloat,
        format: fmt.format,
        internalFormat: fmt.internalFormat,
        minFilter: filter,
        magFilter: filter,
        depth: false,
      });
    const doubleTarget = (fmt: Format, filter: number) => {
      const t = { read: target(fmt, filter), write: target(fmt, filter), swap() { [t.read, t.write] = [t.write, t.read]; } };
      return t;
    };

    const velocity = doubleTarget(rg, linear);
    const pressure = doubleTarget(r, gl.NEAREST);
    const divergence = target(r, gl.NEAREST);
    const curl = target(r, gl.NEAREST);

    const geometry = new Triangle(gl);
    const texelSize = { value: new Vec2(1 / SIM_RES, 1 / SIM_RES) };
    const pass = (fragment: string, uniforms: Record<string, { value: unknown }>, transparent = false) =>
      new Mesh(gl, {
        geometry,
        program: new Program(gl, {
          vertex,
          fragment,
          uniforms: { texelSize, ...uniforms },
          depthTest: false,
          depthWrite: false,
          transparent,
        }),
      });

    const clear = pass(clearShader, { uTexture: { value: null }, value: { value: PRESSURE_DISSIPATION } });
    const splat = pass(splatShader, {
      uTarget: { value: null },
      aspectRatio: { value: 1 },
      color: { value: [0, 0, 0] },
      point: { value: new Vec2() },
      radius: { value: SPLAT_RADIUS },
    });
    const advection = pass(advectionShader, {
      uVelocity: { value: null },
      uSource: { value: null },
      dt: { value: 0.016 },
      dissipation: { value: VELOCITY_DISSIPATION },
    });
    const divergencePass = pass(divergenceShader, { uVelocity: { value: null } });
    const curlPass = pass(curlShader, { uVelocity: { value: null } });
    const vorticity = pass(vorticityShader, {
      uVelocity: { value: null },
      uCurl: { value: null },
      curl: { value: CURL },
      dt: { value: 0.016 },
    });
    const pressurePass = pass(pressureShader, { uPressure: { value: null }, uDivergence: { value: null } });
    const gradientSubtract = pass(gradientSubtractShader, { uPressure: { value: null }, uVelocity: { value: null } });
    const composite = pass(
      compositeShader,
      {
        tFluid: { value: null },
        uIntensity: { value: INTENSITY },
        uTint: { value: TINT },
        uGlow: { value: GLOW },
        uTime: { value: 0 },
      },
      true,
    );

    const run = (mesh: Mesh, to: RenderTarget) => renderer.render({ scene: mesh, target: to, sort: false, update: false });

    // ---- Input: mouse movement over the layer becomes splats of velocity.
    let rect = host.getBoundingClientRect();
    const resize = () => {
      rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
    };
    resize();

    const splats: { x: number; y: number; dx: number; dy: number }[] = [];
    let prev: { x: number; y: number } | null = null;
    let lastInput = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rect = host.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const p = { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
      if (inside && prev) {
        const dx = (p.x - prev.x) * VELOCITY_MULTIPLIER;
        const dy = (p.y - prev.y) * VELOCITY_MULTIPLIER;
        if (Math.hypot(dx, dy) > MIN_SPEED) {
          splats.push({ ...p, dx, dy });
          lastInput = performance.now();
          wake();
        }
      }
      prev = inside ? p : null;
    };

    // ---- Frame loop: runs while there's fluid to show and the layer is on screen.
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.016, (now - last) / 1000);
      last = now;

      renderer.autoClear = false;
      while (splats.length) {
        const s = splats.shift()!;
        const u = splat.program.uniforms;
        u.uTarget.value = velocity.read.texture;
        u.aspectRatio.value = rect.width / rect.height;
        (u.point.value as Vec2).set(s.x, s.y);
        u.color.value = [s.dx, s.dy, 0];
        run(splat, velocity.write);
        velocity.swap();
      }

      curlPass.program.uniforms.uVelocity.value = velocity.read.texture;
      run(curlPass, curl);

      vorticity.program.uniforms.uVelocity.value = velocity.read.texture;
      vorticity.program.uniforms.uCurl.value = curl.texture;
      vorticity.program.uniforms.dt.value = dt;
      run(vorticity, velocity.write);
      velocity.swap();

      divergencePass.program.uniforms.uVelocity.value = velocity.read.texture;
      run(divergencePass, divergence);

      clear.program.uniforms.uTexture.value = pressure.read.texture;
      run(clear, pressure.write);
      pressure.swap();

      pressurePass.program.uniforms.uDivergence.value = divergence.texture;
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        pressurePass.program.uniforms.uPressure.value = pressure.read.texture;
        run(pressurePass, pressure.write);
        pressure.swap();
      }

      gradientSubtract.program.uniforms.uPressure.value = pressure.read.texture;
      gradientSubtract.program.uniforms.uVelocity.value = velocity.read.texture;
      run(gradientSubtract, velocity.write);
      velocity.swap();

      advection.program.uniforms.uVelocity.value = velocity.read.texture;
      advection.program.uniforms.uSource.value = velocity.read.texture;
      advection.program.uniforms.dt.value = dt;
      run(advection, velocity.write);
      velocity.swap();

      composite.program.uniforms.uTime.value = now * 0.001;
      composite.program.uniforms.tFluid.value = velocity.read.texture;
      renderer.autoClear = true;
      renderer.render({ scene: composite });

      if (now - lastInput < IDLE_MS) wake();
    };

    function wake() {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(host);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  // Above the menu and the project sheet too; it only shows over light areas.
  // Its own transition name keeps it flowing, unmoved, over page wipes.
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-70 mix-blend-multiply"
      style={{ viewTransitionName: "liquid" }}
    />
  );
}
