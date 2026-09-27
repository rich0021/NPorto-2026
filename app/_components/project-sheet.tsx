"use client";

import Lenis from "lenis";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { pageScroll } from "./smooth-scroll";

// Bottom sheet for a case study, built to match Humaan's: a black backdrop
// fades to 50%, and the sheet rises from below the screen to sit 200px down,
// inset 30px with 50px top corners. The whole overlay scrolls with its own
// Lenis; over the first stretch of scrolling the sheet's background widens to
// full bleed and its corners square off, and the round close button pins to
// the top-right corner. Closing (×, Escape, or a click on the dimmed area)
// slides the whole overlay down off the screen and goes back.
//
// The rise and fall use the Web Animations API on transform and opacity, so
// the compositor runs them: they stay smooth while the case study mounts,
// which is exactly when the sheet is moving.
const RISE = { duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" };
const FALL = { duration: 650, easing: "cubic-bezier(0.7, 0, 0.84, 0)" };
export function ProjectSheet({ children, slug, title }: { children: React.ReactNode; slug: string; title: string }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    pageScroll.keepPosition = true;
    const duration = prefersReducedMotion() ? 0 : FALL.duration;
    const down = `translate3d(0, ${window.innerHeight}px, 0)`;
    // No more scrolling or clicks on the way out. (Not lenis.stop(): that
    // clips the scroller's overflow, which snaps it back to the top.)
    if (root.current) root.current.style.pointerEvents = "none";
    // The scroller, not the sheet: it is exactly one screen tall, so one
    // screen down always clears it, however far the sheet was scrolled (a
    // long sheet moved a screen down would still cover it, then vanish). Both
    // start from where they are now, in case the rise is still running.
    scroller.current?.animate({ transform: ["none", down] }, { ...FALL, duration, fill: "forwards" });
    const from = backdrop.current ? getComputedStyle(backdrop.current).opacity : "0.5";
    const fade = backdrop.current?.animate({ opacity: [from, "0"] }, { ...FALL, duration, fill: "forwards" });
    if (fade) fade.onfinish = () => router.back();
    else router.back();
  };

  useGSAP(
    () => {
      const html = document.documentElement;
      // The page's scrollbar goes while the sheet is open (see .sheet-open).
      html.style.setProperty("--sbw", `${window.innerWidth - html.clientWidth}px`);
      html.classList.add("sheet-open");
      pageScroll.current?.stop();

      const reduce = prefersReducedMotion();
      if (!reduce) {
        const up = `translate3d(0, ${window.innerHeight}px, 0)`;
        const rise = sheet.current?.animate({ transform: [up, "none"] }, RISE);
        // The case study measures its scroll triggers as it mounts, while the
        // sheet is still a screen lower on its way up; measure again once it
        // has landed, or every reveal inside fires a screen late.
        if (rise) rise.onfinish = () => ScrollTrigger.refresh();
        backdrop.current?.animate({ opacity: [0, 0.5] }, { duration: 800, easing: "ease-out" });
      }
      closeButton.current?.focus({ preventScroll: true });

      // 0 while the sheet rests below the top, 1 once it has scrolled up to it.
      const el = scroller.current!;
      const setProgress = () => {
        const top = sheet.current?.offsetTop || 1;
        const p = Math.min(1, Math.max(0, el.scrollTop / top));
        root.current?.style.setProperty("--p", p.toFixed(4));
      };
      el.addEventListener("scroll", setProgress, { passive: true });
      setProgress();

      let raf: ((time: number) => void) | undefined;
      if (!reduce && content.current) {
        const instance = new Lenis({ wrapper: el, content: content.current, autoRaf: false, lerp: 0.06, wheelMultiplier: 0.8 });
        instance.on("scroll", ScrollTrigger.update);
        raf = (time) => instance.raf(time * 1000);
        gsap.ticker.add(raf);
        lenis.current = instance;
      }

      return () => {
        el.removeEventListener("scroll", setProgress);
        if (raf) gsap.ticker.remove(raf);
        lenis.current?.destroy();
        lenis.current = null;
        html.classList.remove("sheet-open");
        html.style.removeProperty("--sbw");
        pageScroll.current?.start();
      };
    },
    { scope: root },
  );

  // Swapping to the next project keeps the sheet open; bring it back to rest.
  useEffect(() => {
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true, force: true });
    else scroller.current?.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Clicks on the dimmed strip above the sheet close it; clicks inside don't.
  const closeOnOutside = (e: React.MouseEvent) => {
    if (!sheet.current?.contains(e.target as Node)) close();
  };

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={title} className="sheet fixed inset-0 z-[60]">
      <div ref={backdrop} className="absolute inset-0 bg-black opacity-50" />

      <div
        ref={scroller}
        data-scroller
        data-lenis-prevent
        onClick={closeOnOutside}
        className="sheet-scroller absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div ref={content}>
          <div ref={sheet} className="sheet-inner">
            <div aria-hidden="true" className="sheet-bg" />

            <div className="sheet-close-rail">
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                aria-label="Close project"
                className="sheet-close"
              >
                <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
                  <path d="M2.33 15.67 15.67 2.33m0 13.34L2.33 2.33" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
                </svg>
              </button>
            </div>

            <div className="relative">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
