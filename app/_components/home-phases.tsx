"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

export type PhaseKind = "fill" | "assemble" | "decode";
type Phase = { text: string; kind: PhaseKind };
type Props = {
  phases: Phase[];
  stack: { layer: string; tech: string }[];
  cases: { problem: string; product: string }[];
};

// Bandung, for the counter under the first line.
const LAT = 6.9175;
const LNG = 107.6191;
const GLYPHS = "{}[]<>/\\=+*;:01#$%&_";

// The third line's wireframe: grey blocks shaped like this page's sections in
// the Figma frame (the name, the three lines, the call to talk), each
// collapsing into the line of code in app/page.tsx that renders it.
const WIREFRAME = [
  { code: '<TitleFx text="naufal" />', w: "100%", h: "5.5em", bars: 1 },
  { code: "<HomePhases phases={taglines} />", w: "40%", h: "4.4em", bars: 3 },
  { code: "<TalkCta />", w: "86%", h: "2.6em", bars: 1 },
];

// The three lines under the name, one screen each. Every screen pins while you
// scroll through it: the line resolves, and a small exhibit under it shows
// what the line means.
//   fill      words darken one by one; the stack builds from the database up
//   assemble  the line starts as just its first word; problems slide in and
//             get struck out, the products that solved them slide in beside
//             them, and the rest of the line slides up as it re-centres
//   decode    glyphs settle into letters; the page's own wireframe collapses
//             into the code that renders it
// Without motion everything simply sits there, finished.
export function HomePhases({ phases, stack, cases }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const lines = root.querySelectorAll<HTMLElement>(".phase-line");
      if (prefersReducedMotion()) {
        gsap.set(lines, { visibility: "visible" });
        return;
      }

      // Text that's drawn from the timeline's progress (the counter, the
      // decoding letters) is repainted by a ticker whenever that progress
      // differs from what was last drawn. Callbacks alone aren't enough:
      // ScrollTrigger jumps timelines with callbacks muted when it re-measures
      // (fonts loading, resize, a reload that restores the scroll position),
      // which left the letters stuck mid-scramble.
      const painters: { tl: gsap.core.Timeline; paint: (p: number) => void; last: number }[] = [];
      const tick = () =>
        painters.forEach((pt) => {
          const p = pt.tl.progress();
          if (p !== pt.last) {
            pt.last = p;
            pt.paint(p);
          }
        });

      root.querySelectorAll<HTMLElement>("[data-phase]").forEach((section) => {
        const kind = section.dataset.phase as PhaseKind;
        const line = section.querySelector<HTMLElement>(".phase-line")!;
        const q = <T extends HTMLElement>(s: string) => [...section.querySelectorAll<T>(s)];
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: "top top", end: "+=120%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        // One thing at a time: the caption only arrives once the exhibit is done.
        tl.fromTo(q(".phase-caption"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.88);

        if (kind === "fill") {
          tl.fromTo(q(".phase-word"), { opacity: 0.12 }, { opacity: 1, stagger: 0.07, duration: 0.2 }, 0);
          // Layers are listed top-down; they stack up from the bottom.
          const rows = q(".stack-row").reverse();
          tl.fromTo(
            rows,
            { yPercent: -120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.18, ease: "power2.out", stagger: 0.1 },
            0.2,
          ).fromTo(q(".stack-rule").reverse(), { scaleX: 0 }, { scaleX: 1, duration: 0.18, stagger: 0.1 }, 0.2);

          // The counter runs 0.2 → 0.9 of the timeline.
          const coords = section.querySelector<HTMLElement>(".phase-coords")!;
          painters.push({
            tl,
            last: -1,
            paint: (p) => {
              const t = gsap.utils.clamp(0, 1, (p - 0.2) / 0.7);
              coords.textContent = `${(LAT * t).toFixed(4)}° s  ${(LNG * t).toFixed(4)}° e`;
            },
          });
        }

        if (kind === "assemble") {
          const inner = section.querySelector<HTMLElement>(".phase-inner")!;
          const tail = q(".phase-tail");
          // While only the first word shows, shift the line so that word sits centred.
          const centreHead = () => tail.reduce((w, c) => w + c.offsetWidth, 0) / 2;

          // Stacked rows (phones) bring the product down from the problem, not in from the side.
          const stacked = window.matchMedia("(max-width: 767px)").matches;
          q(".case-row").forEach((row, i) => {
            tl.fromTo(row, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.12, ease: "power2.out" }, 0.04 + i * 0.07);
            const at = 0.32 + i * 0.1;
            tl.fromTo(row.querySelector(".case-strike"), { scaleX: 0 }, { scaleX: 1, duration: 0.08 }, at)
              .fromTo(row.querySelector(".case-problem"), { color: "#222222" }, { color: "rgba(0,0,0,0.4)", duration: 0.08 }, at)
              .fromTo(
                row.querySelectorAll(".case-arrow, .case-product"),
                stacked ? { opacity: 0, y: -8 } : { opacity: 0, x: -16 },
                { opacity: 1, x: 0, y: 0, duration: 0.08, ease: "power2.out", stagger: 0.02 },
                at + 0.05,
              );
          });

          // Only after the last product has landed does the line finish itself.
          tl.fromTo(inner, { x: centreHead }, { x: 0, duration: 0.16, ease: "power2.inOut" }, 0.71).fromTo(
            tail,
            { yPercent: 115 },
            { yPercent: 0, duration: 0.14, ease: "expo.out", stagger: 0.008 },
            0.72,
          );
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }

        if (kind === "decode") {
          const chars = q(".phase-char");
          // From the markup's data, not the DOM text, which may be mid-scramble
          // if this effect re-runs (hot reload, remount).
          const finals = chars.map((c) => c.dataset.ch ?? "");
          const n = chars.length;
          const settleAt = (i: number) => 0.1 + (i / Math.max(1, n - 1)) * 0.4;
          const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

          // Lock each letter to its final width, so glyphs don't shove the line around.
          const lock = () =>
            chars.forEach((c, i) => {
              c.textContent = finals[i];
              c.style.width = "";
              c.style.width = `${c.getBoundingClientRect().width}px`;
            });
          const render = (p: number) =>
            chars.forEach((c, i) => {
              const done = !finals[i].trim() || p >= settleAt(i);
              c.textContent = done ? finals[i] : glyph();
              c.classList.toggle("is-code", !done);
              c.classList.toggle("is-near", !done && p >= settleAt(i) - 0.2);
            });
          const painter = { tl, last: -1, paint: render };
          painters.push(painter);
          tl.to({}, { duration: 1 }, 0).fromTo(
            q(".phase-caret"),
            { opacity: 0 },
            { opacity: 1, duration: 0.02 },
            0.5,
          );

          // Each grey block shrinks to one line and gives way to its code.
          q(".wire-row").forEach((row, i) => {
            const at = 0.3 + i * 0.13;
            tl.fromTo(row, { height: row.dataset.h }, { height: "1.6em", duration: 0.14, ease: "power2.inOut" }, at)
              .fromTo(row.querySelector(".wire-block"), { opacity: 1 }, { opacity: 0, duration: 0.08 }, at + 0.06)
              .fromTo(row.querySelector(".wire-code"), { opacity: 0 }, { opacity: 1, duration: 0.08 }, at + 0.08);
          });

          document.fonts.ready.then(() => {
            lock();
            painter.last = -1; // repaint on the next tick
          });
        }

        gsap.set(line, { visibility: "visible" });
      });

      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        // Leave the letters readable for whoever runs next.
        root.querySelectorAll<HTMLElement>(".phase-char[data-ch]").forEach((c) => {
          c.textContent = c.dataset.ch ?? "";
          c.classList.remove("is-code", "is-near");
        });
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref}>
      {phases.map(({ text, kind }) => (
        <section key={text} data-phase={kind} className="relative grid h-svh place-items-center overflow-hidden px-(--gutter)">
          <div className="flex w-full flex-col items-center gap-[clamp(28px,4svh,48px)]">
            <p className="phase-line w-[10.6em] text-center text-[clamp(16px,1.67vw,24px)] leading-[1.26]">
              {kind === "fill" ? (
                text.split(" ").map((word, w) => (
                  <span key={w} className="phase-word">
                    {word}{" "}
                  </span>
                ))
              ) : (
                <>
                  <span className="sr-only">{text}</span>
                  <span aria-hidden="true" className="phase-inner inline-block overflow-clip py-[0.12em] -my-[0.12em] whitespace-nowrap">
                    {[...text].map((ch, c) => (
                      <span
                        key={c}
                        data-ch={ch === " " ? "\u00a0" : ch}
                        className={`phase-char inline-block ${kind === "assemble" && c >= text.indexOf(" ") ? "phase-tail" : ""}`}
                      >
                        {ch === " " ? " " : ch}
                      </span>
                    ))}
                    {kind === "decode" && <span className="phase-caret">_</span>}
                  </span>
                </>
              )}
            </p>

            {kind === "fill" && (
              <>
                <ol className="w-full max-w-[26rem] text-[13px] leading-none">
                  {stack.map(({ layer, tech }) => (
                    <li key={layer} className="stack-row relative flex items-baseline justify-between gap-6 py-2.5">
                      <span aria-hidden="true" className="stack-rule absolute inset-x-0 top-0 h-px origin-left bg-black/15" />
                      <span>{layer}</span>
                      <span className="text-right text-ghost">{tech}</span>
                    </li>
                  ))}
                </ol>
                <p className="phase-caption text-[13px] text-ghost tabular-nums">
                  <span className="phase-coords whitespace-pre">6.9175° s  107.6191° e</span> · where it ships from
                </p>
              </>
            )}

            {kind === "assemble" && (
              <>
                {/* On phones each row stacks and centres (the problem, then ↓ the
                    product), since three columns leave the problem too narrow. */}
                <ul className="w-full max-w-[40rem] space-y-3 text-[13px] leading-tight max-md:space-y-5">
                  {cases.map(({ problem, product }) => (
                    <li key={product} className="case-row grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-1.5 max-md:text-center">
                      <span className="case-problem relative justify-self-end text-right max-md:justify-self-center max-md:text-center">
                        {problem}
                        <span aria-hidden="true" className="case-strike absolute inset-x-0 top-1/2 h-px origin-left bg-current" />
                      </span>
                      <span aria-hidden="true" className="case-arrow text-ghost max-md:inline-block max-md:rotate-90">
                        →
                      </span>
                      <span className="case-product font-bold">{product}</span>
                    </li>
                  ))}
                </ul>
                <p className="phase-caption text-[13px] text-ghost">three of them, so far</p>
              </>
            )}

            {kind === "decode" && (
              <>
                <div aria-hidden="true" className="w-full max-w-[22rem] text-[12px]">
                  {WIREFRAME.map((row, i) => (
                    <div key={i} data-h={row.h} className="wire-row relative mb-2" style={{ height: row.h }}>
                      <span className="wire-block absolute inset-y-0 left-0 flex flex-col gap-[0.4em]" style={{ width: row.w }}>
                        {Array.from({ length: row.bars }, (_, b) => (
                          <span key={b} className="flex-1 bg-placeholder" />
                        ))}
                      </span>
                      <code className="wire-code absolute inset-y-0 left-0 flex items-center font-mono whitespace-nowrap">
                        {row.code}
                      </code>
                    </div>
                  ))}
                </div>
                <p className="phase-caption text-[13px] text-ghost">this page started as grey boxes in figma</p>
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
