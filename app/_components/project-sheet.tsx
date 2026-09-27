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
// slides it back down and goes back.
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
    const reduce = prefersReducedMotion();
    gsap.to(sheet.current, { y: () => window.innerHeight, duration: reduce ? 0 : 0.7, ease: "power3.in" });
    gsap.to(backdrop.current, { opacity: 0, duration: reduce ? 0 : 0.7, onComplete: () => router.back() });
  };

  useGSAP(
    () => {
      const html = document.documentElement;
      html.classList.add("sheet-open");
      pageScroll.current?.stop();

      const reduce = prefersReducedMotion();
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 0.5, duration: reduce ? 0 : 0.8, ease: "power2.out" });
      gsap.fromTo(
        sheet.current,
        { y: () => window.innerHeight },
        { y: 0, duration: reduce ? 0 : 1.1, ease: "power3.out" },
      );
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
        const instance = new Lenis({ wrapper: el, content: content.current, autoRaf: false, lerp: 0.09 });
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
      <div ref={backdrop} className="absolute inset-0 bg-black opacity-0" />

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
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
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
