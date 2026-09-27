"use client";

import { useEffect, useRef, useState } from "react";
import TechText from "./tech-text";

// Room around the word for Tech Text's selection frame, labels and dragged
// letters, × the font size.
const PAD = 0.3;

type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  size: number;
  anchor: { x: number; baseline: number };
  clip: number;
};

// A huge page word drawn by React Bits' Tech Text: letters rise out of the
// line one by one, then the one under the cursor turns into its dashed
// outline with a measured selection frame, and any letter can be dragged off
// the baseline and springs home. With the cursor away, the frame sweeps
// along the word by itself.
//
// The DOM word stays (transparent) for layout and the page's type; the canvas
// is laid over it and told exactly where that word's pen and baseline are, so
// it draws in the same place.
export function TechTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const root = ref.current;
    const word = root?.querySelector<HTMLElement>(".tech-title-text");
    const base = root?.querySelector<HTMLElement>(".tech-title-base");
    if (!root || !word || !base) return;

    const measure = () => {
      const r = root.getBoundingClientRect();
      const size = parseFloat(getComputedStyle(root).fontSize);
      const pad = Math.round(size * PAD);
      // Whole device pixels on x, so the canvas isn't resampled sideways.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const left = Math.floor((r.left - pad) * dpr) / dpr - r.left;
      const top = -pad;
      setBox({
        left,
        top,
        width: Math.ceil(r.width - left + pad),
        height: Math.ceil(r.height + pad * 2),
        size,
        anchor: { x: word.getBoundingClientRect().left - r.left - left, baseline: base.getBoundingClientRect().top - r.top - top },
        clip: r.height - top,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <span ref={ref} aria-hidden="true" className="tech-title relative flow-root">
      <span className="tech-title-text">
        {text}
        <span className="tech-title-base inline-block size-0 align-baseline" />
      </span>
      {box && (
        <span
          className="pointer-events-none absolute"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        >
          <TechText
            text={text}
            fontSize={box.size}
            fontWeight={700}
            letterSpacing={0}
            color="#222222"
            accentColor="#222222"
            anchor={box.anchor}
            enter={{ delay, clip: box.clip }}
          />
        </span>
      )}
    </span>
  );
}
