"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

// The page-level Lenis instance, so overlays like the project sheet can pause
// page scrolling while they own the wheel.
// `keepPosition` asks the next route change to leave the page where it is
// (opening, swapping and closing the sheet change the URL, not the page).
export const pageScroll: { current: Lenis | null; keepPosition: boolean } = {
  current: null,
  keepPosition: false,
};

// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and the
// scroll position stay in lockstep. Native scrolling is kept underneath, so
// sticky elements and view transitions behave normally.
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ autoRaf: false, lerp: 0.09, wheelMultiplier: 1 });
    lenis.current = instance;
    pageScroll.current = instance;
    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenis.current = null;
      pageScroll.current = null;
    };
  }, []);

  // Each page starts at the top; ScrollTrigger re-measures the new layout.
  useEffect(() => {
    if (pageScroll.keepPosition || document.documentElement.classList.contains("sheet-open")) {
      pageScroll.keepPosition = false;
      return;
    }
    lenis.current?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
