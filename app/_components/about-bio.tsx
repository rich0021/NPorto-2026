"use client";

import { useRef, useState } from "react";
import { gsap, hasFinePointer, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import ScrollReveal from "./scroll-reveal";
import { TransitionLink } from "./transition-link";

export type BioToken = { text: string; href?: string; preview?: string };
export type BioChapter = { label: string; tokens: BioToken[] };

// Where reading happens: a paragraph reveals while it passes the line 80%
// down the screen (React Bits' Scroll Reveal start). Each paragraph's box
// includes the gap below it, so one ends exactly where the next begins: only
// one reveals at a time, and the index follows the same range.
const READ_START = "top bottom-=20%";
const READ_END = "bottom bottom-=20%";

// The bio in the about frame's column (237px in, 966px wide at 1440), with the
// empty column to its left turned into a sticky chapter index. As you scroll,
// each paragraph un-blurs word by word (Scroll Reveal), the index follows, and the
// linked projects float a screenshot next to the cursor.
export function AboutBio({ chapters }: { chapters: BioChapter[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [shot, setShot] = useState<{ src?: string; label: string } | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const paragraphs = [...root.querySelectorAll<HTMLElement>(".bio-p")];
      const bar = root.querySelector<HTMLElement>(".bio-bar");

      paragraphs.forEach((p, i) => {
        ScrollTrigger.create({
          trigger: p,
          start: READ_START,
          end: READ_END,
          // Entering or passing a paragraph makes it current; scrolling back
          // above it hands over to the one before. (Leave events still fire
          // on a jump past several, so the index never gets stranded.)
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
          onLeave: () => setActive(i),
          onLeaveBack: () => setActive(Math.max(0, i - 1)),
        });
      });

      if (prefersReducedMotion()) return;

      if (bar) {
        gsap.fromTo(
          bar,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: paragraphs[0],
              endTrigger: paragraphs.at(-1),
              start: READ_START,
              end: READ_END,
              scrub: true,
            },
          },
        );
      }

      // The floating screenshot trails the cursor over linked projects.
      // Whether it shows is decided from what's actually under the pointer,
      // re-checked on every move, scroll and click, rather than trusting
      // enter/leave events (which don't fire when the text scrolls out from
      // under a still cursor, or when a click opens the sheet on top).
      const box = preview.current;
      if (!box || !hasFinePointer()) return;
      gsap.set(box, { xPercent: -50, yPercent: -115, scale: 0.6, autoAlpha: 0 });
      const xTo = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });

      let current: HTMLElement | null = null;
      let px = -1;
      let py = -1;
      // overwrite: "auto" lets the newest of show/hide cancel the other, so a
      // quick pass over a link can't leave a half-finished show running.
      const sync = (target: Element | null) => {
        const link = target?.closest<HTMLElement>(".bio-link") ?? null;
        if (link === current) return;
        current = link;
        if (link) {
          setShot({ src: link.dataset.previewSrc, label: link.dataset.previewLabel ?? "" });
          gsap.to(box, { autoAlpha: 1, scale: 1, rotate: -3, duration: 0.5, ease: "back.out(1.6)", overwrite: "auto" });
        } else {
          gsap.to(box, { autoAlpha: 0, scale: 0.6, rotate: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
        }
      };
      const move = (e: PointerEvent) => {
        px = e.clientX;
        py = e.clientY;
        xTo(px);
        yTo(py);
        sync(e.target as Element);
      };
      const recheck = () => sync(px < 0 ? null : document.elementFromPoint(px, py));
      const clear = () => sync(null);

      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("scroll", recheck, { passive: true });
      window.addEventListener("pointerdown", clear);
      document.documentElement.addEventListener("pointerleave", clear);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("scroll", recheck);
        window.removeEventListener("pointerdown", clear);
        document.documentElement.removeEventListener("pointerleave", clear);
        gsap.set(box, { autoAlpha: 0 });
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="px-(--gutter) pt-[8.3vw] md:grid md:grid-cols-[16.46vw_minmax(0,1fr)] md:px-0">
      <nav aria-label="Chapters" className="hidden md:block">
        <div className="sticky top-[40svh] flex gap-4 pl-[3.1vw]">
          <span aria-hidden="true" className="relative w-px bg-black/10">
            <span className="bio-bar absolute inset-0 origin-top bg-fg" />
          </span>
          <ol className="flex flex-col gap-2 text-[13px] leading-tight">
            {chapters.map((c, i) => (
              <li key={c.label}>
                <a
                  href={`#chapter-${i + 1}`}
                  aria-current={active === i ? "true" : undefined}
                  className={`bio-index flex gap-2 transition-colors duration-500 ${active === i ? "text-fg" : "text-ghost"}`}
                >
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div className="max-w-[48.3em] pr-(--gutter) text-[clamp(16px,1.39vw,24px)] leading-[1.26] text-black">
        {chapters.map((c, i) => (
          <div key={c.label} id={`chapter-${i + 1}`} className="bio-p scroll-mt-[40svh]">
            <ScrollReveal containerClassName="pb-[3.5em]" textClassName="" wordAnimationEnd={READ_END} rotationEnd={READ_END}>
              {c.tokens.map((t, k) =>
                t.href ? (
                  <TransitionLink
                    key={k}
                    href={t.href}
                    scroll={false}
                    data-cursor="view"
                    className="bio-link"
                    data-preview-src={t.preview}
                    data-preview-label={t.text}
                  >
                    {/* Inline (not inline-block) words, so the link's underline runs through them. */}
                    {t.text.split(" ").map((w, j, all) => (
                      <span key={j} className="word">
                        {w}
                        {j < all.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </TransitionLink>
                ) : (
                  t.text
                ),
              )}
            </ScrollReveal>
          </div>
        ))}
      </div>

      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none invisible fixed top-0 left-0 z-40 aspect-[4/3] w-[clamp(200px,20vw,320px)] overflow-hidden bg-placeholder shadow-[0_30px_60px_-20px_rgb(0_0_0/0.35)]"
      >
        {shot?.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- already-optimised screenshot, swapped on hover
          <img src={shot.src} alt="" className="size-full object-cover object-top" />
        ) : (
          <span className="grid size-full place-items-center text-[15px] font-bold">{shot?.label}</span>
        )}
      </div>
    </div>
  );
}
