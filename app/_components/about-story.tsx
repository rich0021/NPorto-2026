"use client";

import { useRef } from "react";
import { gsap, hasFinePointer, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { story } from "@/lib/content";
import { Magnetic, RollText } from "./magnetic";
import { TransitionLink } from "./transition-link";

const PINNED = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";
const PLATES = 5;

// Timeline layout (seconds): chapter i is on screen from STEP * (i - 1) + SHOW.
const STEP = 1.6;
const SWAP = 0.6;
const SHOW = SWAP + 0.45;

type Vars = gsap.TweenVars;

// The centrepiece is a stack of the grey square frames from the Figma file,
// in 3D. Each chapter arranges it differently; values are in plate widths so
// they scale with the screen.
const iso = { rotationX: 58, rotationZ: -40 };
const stackStates: Vars[] = [
  { rotationX: 0, rotationZ: 0, scale: 1, yPercent: 0 },
  { ...iso, scale: 0.9, yPercent: 0 },
  { ...iso, scale: 0.72, yPercent: 24 },
  { ...iso, scale: 0.72, yPercent: 24 },
  { rotationX: 50, rotationZ: -28, scale: 0.95, yPercent: 0 },
  { rotationX: 42, rotationZ: -18, scale: 0.9, yPercent: 0 },
  { rotationX: 0, rotationZ: 0, scale: 1, yPercent: 0 },
];

const scatter = [
  [-0.75, -0.5, 0.1, -18],
  [0.7, -0.65, 0.5, 24],
  [-0.45, 0.75, 0.9, 8],
  [0.72, 0.55, 0.3, -30],
  [0, 0, 1.3, 12],
];

// [x, y, z, rotationZ, scale, opacity] per plate, in plate widths.
function plateState(chapter: number, k: number): [number, number, number, number, number, number] {
  switch (chapter) {
    case 0: // one frame: the plates sit on top of each other
      return [0, 0, k * 0.006, 0, 1, 1];
    case 1: // two places: split into two groups
      return k < 2 ? [-0.62, 0, k * 0.1, 0, 0.8, 1] : [0.62, 0, (k - 2) * 0.1, 0, 0.8, 1];
    case 2: // every layer: exploded into a stack
    case 3: // the plumbing runs through the same stack
      return [0, 0, k * 0.42, 0, 1, 1];
    case 4: // lately: two things
      return k < 2 ? [k === 0 ? -0.6 : 0.6, 0, 0, 0, 0.9, 1] : [0, 0, -0.8, 0, 0.6, 0];
    case 5: // off the clock: scattered at play
      return [scatter[k][0], scatter[k][1], scatter[k][2], scatter[k][3], 0.6, 1];
    default: // someday: a tunnel of frames receding into the distance
      return [0, 0, -k * 0.55, 0, 1, 1 - k * 0.16];
  }
}

// The about page as a story. On wide screens the stage is pinned and
// scrolling plays one chapter at a time, while the frame stack in the middle
// rearranges itself and tilts toward the mouse. On phones (and with reduced
// motion) the chapters simply stack.
export function AboutStory() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(PINNED, () => {
        const el = root.current!;
        const stage = el.querySelector<HTMLElement>(".story-stage")!;
        const tilt = el.querySelector<HTMLElement>(".stack-tilt")!;
        const stack = el.querySelector<HTMLElement>(".stack")!;
        const plates = gsap.utils.toArray<HTMLElement>(".plate", el);
        const packet = el.querySelector<HTMLElement>(".stack-packet")!;
        const chapters = gsap.utils.toArray<HTMLElement>(".story-chapter", el);
        const counter = el.querySelector<HTMLElement>(".story-count")!;
        const bar = el.querySelector<HTMLElement>(".story-bar")!;
        const lines = (c: HTMLElement) => c.querySelectorAll("[data-line]");
        const extras = (c: HTMLElement) => c.querySelectorAll("[data-extra]");
        const labels = (i: number) => el.querySelectorAll(`[data-plate-chapter="${i}"]`);
        const size = () => plates[0].offsetWidth;

        const plateVars = (i: number, k: number): Vars => {
          const [x, y, z, rotationZ, scale, opacity] = plateState(i, k);
          return { x: () => x * size(), y: () => y * size(), z: () => z * size(), rotationZ, scale, autoAlpha: opacity };
        };

        gsap.set(chapters, { autoAlpha: 0 });
        gsap.set(chapters[0], { autoAlpha: 1 });
        gsap.set(el.querySelectorAll("[data-plate-chapter]"), { autoAlpha: 0 });
        gsap.set(labels(0), { autoAlpha: 1 });
        gsap.set(stack, stackStates[0]);
        plates.forEach((plate, k) => gsap.set(plate, plateVars(0, k)));
        gsap.set(packet, { autoAlpha: 0 });

        // The opening chapter plays on load: the plates drop into one frame.
        gsap.from(lines(chapters[0]), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.3 });
        gsap.from(extras(chapters[0]), { autoAlpha: 0, y: 24, duration: 1, ease: "expo.out", delay: 0.6 });
        gsap.from(plates, { z: () => size() * 1.5, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: 0.08, delay: 0.2 });

        // Data travelling up through the layers, for the plumbing chapter.
        gsap.fromTo(packet, { z: 0 }, { z: () => size() * 1.68, duration: 1.4, ease: "none", repeat: -1 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * chapters.length}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
          // Runs as the scrubbed timeline moves (it trails the scroll), so the
          // counter changes exactly when the next chapter appears.
          onUpdate() {
            const time = this.time();
            const i = time < SHOW ? 0 : Math.min(chapters.length - 1, Math.floor((time - SHOW) / STEP) + 1);
            counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
          },
        });

        tl.to(bar, { scaleX: 1, ease: "none", duration: chapters.length * STEP }, 0);

        chapters.forEach((chapter, i) => {
          if (i === 0) return;
          const prev = chapters[i - 1];
          const at = (i - 1) * STEP + SWAP; // leave each chapter up for a beat before moving on

          tl.to(lines(prev), { yPercent: -110, duration: 0.4, stagger: 0.04 }, at)
            .to(extras(prev), { autoAlpha: 0, y: -24, duration: 0.3 }, at)
            .to(labels(i - 1), { autoAlpha: 0, duration: 0.25 }, at)
            .set(prev, { autoAlpha: 0 }, at + 0.45)
            .set(chapter, { autoAlpha: 1 }, at + 0.45)
            .fromTo(lines(chapter), { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.05 }, at + 0.45)
            .fromTo(extras(chapter), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05 }, at + 0.6)
            .to(labels(i), { autoAlpha: 1, duration: 0.3 }, at + 0.75)
            .to(stack, { ...stackStates[i], duration: 0.9 }, at + 0.05);

          plates.forEach((plate, k) => tl.to(plate, { ...plateVars(i, k), duration: 0.9 }, at + 0.05 + k * 0.03));

          // The plumbing chapter flips the stage to negative and sends data up the stack.
          if (story[i].negative) {
            tl.to(stage, { backgroundColor: "#000", color: "#fff", duration: 0.6 }, at + 0.1).to(
              packet,
              { autoAlpha: 1, duration: 0.3 },
              at + 0.6,
            );
          }
          if (story[i - 1].negative) {
            tl.to(stage, { backgroundColor: "#fff", color: "#000", duration: 0.6 }, at + 0.1).to(
              packet,
              { autoAlpha: 0, duration: 0.2 },
              at,
            );
          }
        });

        // The whole stack leans toward the mouse.
        if (hasFinePointer()) {
          const rx = gsap.quickTo(tilt, "rotationX", { duration: 1, ease: "power3" });
          const ry = gsap.quickTo(tilt, "rotationY", { duration: 1, ease: "power3" });
          const move = (e: PointerEvent) => {
            rx((e.clientY / window.innerHeight - 0.5) * -18);
            ry((e.clientX / window.innerWidth - 0.5) * 22);
          };
          window.addEventListener("pointermove", move);
          return () => window.removeEventListener("pointermove", move);
        }

        ScrollTrigger.refresh();
      });

      // Stacked chapters just rise in as they scroll into view.
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".story-chapter", root.current!).forEach((chapter) => {
          gsap.from(chapter.querySelectorAll("[data-line], [data-extra]"), {
            yPercent: 40,
            autoAlpha: 0,
            duration: 1,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: chapter, start: "top 85%", once: true },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="story">
      <section className="story-stage" aria-label="About Naufal">
        <div className="story-scene" aria-hidden="true">
          <div className="stack-tilt">
            <div className="stack">
              {Array.from({ length: PLATES }, (_, k) => (
                <div key={k} className="plate">
                  <div className="plate-face">
                    {story.map((chapter, i) =>
                      chapter.plates?.[k] ? (
                        <span key={i} data-plate-chapter={i} className="plate-label">
                          {chapter.plates[k]}
                        </span>
                      ) : null,
                    )}
                    {story.map((chapter, i) =>
                      chapter.core && k === (i === 0 ? PLATES - 1 : 0) ? (
                        <span key={`core-${i}`} data-plate-chapter={i} className="plate-core">
                          {chapter.core}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
              <span className="stack-packet" />
            </div>
          </div>
        </div>

        {story.map((chapter, i) => (
          <article key={chapter.title.join(" ")} className="story-chapter shell">
            <div className="story-left">
              <p data-extra className="text-sm text-current/55 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="story-title">
                {chapter.title.map((line) => (
                  <span key={line} className="story-mask">
                    <span data-line className="block">
                      {line}
                    </span>
                  </span>
                ))}
              </h2>
            </div>

            <div className="story-right">
              {chapter.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} data-extra className="story-body">
                  {paragraph}
                </p>
              ))}

              {chapter.facts && (
                <dl data-extra className="mt-8 divide-y divide-current/15 border-y border-current/15 text-sm">
                  {chapter.facts.map((fact) => (
                    <div key={fact.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
                      <dt className="text-current/55">{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {chapter.links && (
                <ul data-extra className="mt-8 space-y-5">
                  {chapter.links.map((link) => (
                    <li key={link.href}>
                      <TransitionLink href={link.href} scroll={false} data-cursor="open" className="group block">
                        <span className="text-[clamp(22px,2vw,30px)] leading-tight">
                          <RollText>{`${link.label} →`}</RollText>
                        </span>
                        <span className="mt-1 block text-sm text-current/55">{link.note}</span>
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              )}

              {chapter.cta && (
                <div data-extra className="mt-10">
                  <Magnetic strength={0.2}>
                    <TransitionLink
                      href="/contact"
                      className="inline-flex min-h-11 items-center border-b border-current pb-1 text-[clamp(20px,2vw,28px)]"
                    >
                      <RollText>let&apos;s work together →</RollText>
                    </TransitionLink>
                  </Magnetic>
                </div>
              )}
            </div>
          </article>
        ))}

        <div className="story-progress shell" aria-hidden="true">
          <span className="story-count text-sm tabular-nums">01 / {String(story.length).padStart(2, "0")}</span>
          <span className="story-track">
            <span className="story-bar" />
          </span>
        </div>
      </section>
    </div>
  );
}
