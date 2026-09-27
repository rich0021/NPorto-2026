"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

// A big bold line whose letters slide up out of a mask one after another,
// once. Optionally (`drift`) they drift up and apart at their own speeds as
// it scrolls away. `reveal="scroll"` waits until it scrolls into view.
export function TitleFx({
  text,
  delay = 0,
  reveal = "load",
  drift = true,
  className = "",
}: {
  text: string;
  delay?: number;
  reveal?: "load" | "scroll";
  drift?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const chars = [...root.querySelectorAll<HTMLElement>(".tfx-char")];
      gsap.set(root, { visibility: "visible" });
      if (prefersReducedMotion()) return;

      // The start position is set on its own, not as the rise's `from`:
      // ScrollTrigger rewinds the rise whenever it re-measures (fonts, resize,
      // the loader lifting), and letters whose stagger hadn't begun lost their
      // `from` and sat in place, then dropped out of sight one by one.
      gsap.set(chars, { yPercent: 115, transformOrigin: "50% 100%" });
      // The mask only exists for the rise; after it, drifting letters may leave it.
      const mask = root.querySelector<HTMLElement>(".tfx-mask")!;
      // Clamped: a line at the very foot of a tall, narrow screen can't scroll
      // up to 90%, and would otherwise never appear.
      const scrollTrigger = reveal === "scroll" ? { trigger: root, start: "clamp(top 90%)", once: true } : undefined;
      gsap
        .timeline({
          delay,
          scrollTrigger,
          onComplete: () => {
            mask.style.overflow = "visible";
          },
        })
        .to(chars, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.05 });

      if (drift) {
        const seed = chars.map((_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);
        gsap.to(chars, {
          y: (i) => -(0.1 + seed[i] * 0.35) * root.offsetHeight,
          rotate: (i) => (seed[i] - 0.5) * 16,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root, start: 0, end: "bottom top", scrub: 0.8 },
        });
      }
    },
    { scope: ref },
  );

  return (
    <span ref={ref} aria-hidden="true" className={`title-fx relative flow-root ${className}`}>
      <span className="tfx-mask block">
        {[...text].map((ch, i) => (
          <span key={i} className="tfx-char inline-block">
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
