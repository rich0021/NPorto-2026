"use client";

import { useRef } from "react";
import { gsap, hasFinePointer, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

// Runs a page's entrance and scroll animations from data attributes, so the
// pages themselves can stay server components:
//
//   data-split="lines|words|chars"  text rises line by line (or word/char) out of a mask
//   data-reveal                     block fades up
//   data-clip                       panel wipes open from the bottom; its <img> settles from a zoom
//   data-parallax="0.15"            drifts against the scroll by that fraction
//   data-depth="0.02"               follows the mouse by that fraction
//
// Add `data-scroll` to split/reveal/clip to play when scrolled into view
// instead of on load, and `data-delay="0.2"` to offset it.
export function PageMotion({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const all = root.querySelectorAll<HTMLElement>("[data-split], [data-reveal], [data-clip]");
      if (prefersReducedMotion()) {
        gsap.set(all, { visibility: "visible" });
        return;
      }

      // Inside the project sheet, triggers follow the sheet's scroller, not the window.
      const scroller = root.closest<HTMLElement>("[data-scroller]") ?? undefined;
      const trigger = (el: HTMLElement) =>
        el.dataset.scroll !== undefined ? { trigger: el, scroller, start: "top 88%", once: true } : undefined;
      const delay = (el: HTMLElement) => Number(el.dataset.delay ?? 0);

      root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const unit = (el.dataset.split || "lines") as "lines" | "words" | "chars";
        SplitText.create(el, {
          type: unit === "lines" ? "lines" : `lines,${unit}`,
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          charsClass: "split-char",
          onSplit(self) {
            gsap.set(el, { visibility: "visible" });
            return gsap.from(self[unit], {
              yPercent: 110,
              duration: unit === "chars" ? 1.2 : 1.1,
              ease: "expo.out",
              stagger: unit === "chars" ? 0.045 : unit === "words" ? 0.03 : 0.09,
              delay: delay(el),
              scrollTrigger: trigger(el),
            });
          },
        });
      });

      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out", delay: delay(el), scrollTrigger: trigger(el) },
        );
      });

      root.querySelectorAll<HTMLElement>("[data-clip]").forEach((el) => {
        const img = el.querySelector("img");
        const tl = gsap.timeline({ delay: delay(el), scrollTrigger: trigger(el) });
        tl.set(el, { visibility: "visible" })
          .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
        if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.2);
      });

      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax || 0.15);
        gsap.fromTo(
          el,
          { yPercent: amount * 100 },
          {
            yPercent: -amount * 100,
            ease: "none",
            scrollTrigger: { trigger: el, scroller, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      const depthEls = root.querySelectorAll<HTMLElement>("[data-depth]");
      if (depthEls.length && hasFinePointer()) {
        const movers = [...depthEls].map((el) => ({
          depth: Number(el.dataset.depth),
          x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
        }));
        const move = (e: PointerEvent) => {
          const dx = e.clientX - window.innerWidth / 2;
          const dy = e.clientY - window.innerHeight / 2;
          movers.forEach((m) => {
            m.x(dx * m.depth);
            m.y(dy * m.depth);
          });
        };
        window.addEventListener("pointermove", move);
        return () => window.removeEventListener("pointermove", move);
      }

      ScrollTrigger.refresh();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
