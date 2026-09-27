"use client";

import { useRef } from "react";
import { gsap, hasFinePointer, useGSAP } from "@/lib/gsap";

// Mouse follower that trails the normal cursor. A white disc with
// `mix-blend-mode: difference`, so whatever it passes over shows in negative.
// It grows over links, and over anything with `data-cursor="label"` it grows
// further and shows that label.
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = root.current;
    if (!el || !hasFinePointer()) return;

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
    let visible = false;

    const move = (e: PointerEvent) => {
      if (!visible) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
        visible = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button");
      const mode = target?.dataset.cursor ?? (target ? "link" : "");
      el.dataset.mode = mode && mode !== "link" ? "label" : mode;
      if (label.current) label.current.textContent = mode && mode !== "link" ? mode : "";
    };

    const hide = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.3 });
      visible = false;
    };
    const down = () => el.classList.add("is-down");
    const up = () => el.classList.remove("is-down");

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  });

  return (
    <div ref={root} className="cursor" aria-hidden="true">
      <div className="cursor-disc">
        <span ref={label} className="cursor-label" />
      </div>
    </div>
  );
}
