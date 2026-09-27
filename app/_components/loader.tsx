"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { markPageReady } from "@/lib/page-ready";
import { pageScroll } from "./smooth-scroll";

// Long enough that the count reads as a count, not a flash.
const MIN_MS = 900;
// Never hold the page hostage to a stalled font or image.
const MAX_MS = 6000;
// When, into the curtain's lift, the page's entrances start playing.
const REVEAL_AT_MS = 300;

// Everything GSAP plays waits under the loader: entrances created while it's
// up would otherwise finish unseen behind it. Paused here, at module load, so
// it's in place before any page effect creates a tween; the loader resumes it.
if (typeof window !== "undefined") gsap.globalTimeline.pause();

// The first-load screen: a count to 100 that follows the fonts and images
// actually arriving, then the curtain lifts off the page. Mounted once in the
// root layout, so moving between pages never shows it again.
export function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const start = performance.now();
    // Again here, since a remount (Strict Mode, hot reload) resumed it.
    gsap.globalTimeline.pause();
    pageScroll.current?.stop();

    // A tenth for the page itself, the rest split between fonts and images.
    let target = 0.1;
    let shown = 0;
    let fonts = false;
    let loaded = false;
    const onFonts = () => {
      if (fonts) return;
      fonts = true;
      target += 0.45;
    };
    const onLoad = () => {
      if (loaded) return;
      loaded = true;
      target += 0.45;
    };
    (document.fonts?.ready ?? Promise.resolve()).then(onFonts, onFonts);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    let raf = 0;
    let revealTimer = 0;
    let leaving = false;
    const reveal = () => {
      pageScroll.current?.start();
      gsap.globalTimeline.resume();
      ScrollTrigger.refresh();
      markPageReady();
    };
    const leave = () => {
      leaving = true;
      el.classList.add("is-leaving");
      revealTimer = window.setTimeout(reveal, reduced ? 0 : REVEAL_AT_MS);
      el.addEventListener("transitionend", (e) => e.target === el && setGone(true));
    };

    const frame = (now: number) => {
      const elapsed = now - start;
      if (elapsed > MAX_MS) target = 1;
      // Eases toward what's arrived, but always creeps, so it never looks stuck.
      shown = Math.min(target, shown + Math.max((target - shown) * 0.08, 0.002));
      if (count.current) count.current.textContent = String(Math.round(shown * 100));
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (shown >= 0.999 && elapsed >= (reduced ? 0 : MIN_MS)) leave();
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(revealTimer);
      window.removeEventListener("load", onLoad);
      // Unmounted before it finished (hot reload): don't leave the page frozen.
      if (!leaving) reveal();
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={ref}
      role="status"
      aria-label="loading"
      className="loader shell fixed inset-0 z-[190] flex flex-col justify-between bg-ink py-[clamp(20px,3svh,36px)] text-bg"
    >
      <p className="text-[13px] leading-tight opacity-50">naufal muttaqin</p>
      <div>
        <div className="flex items-end justify-between gap-4">
          <p className="text-[13px] leading-tight opacity-50">loading</p>
          <p className="text-[clamp(64px,12vw,200px)] leading-[0.8] font-bold tabular-nums">
            <span ref={count}>0</span>
          </p>
        </div>
        <span className="mt-[clamp(16px,2.5svh,28px)] block h-px bg-bg/20">
          <span ref={bar} className="block h-full origin-left bg-bg" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </div>
  );
}
