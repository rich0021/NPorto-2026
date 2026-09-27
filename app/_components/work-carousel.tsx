"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { gsap, hasFinePointer, ScrollTrigger, useGSAP } from "@/lib/gsap";
import FlexCarousel, { type FlexCarouselControl, type FlexCarouselDrag, type FlexCarouselItem } from "./flex-carousel";
import { pageScroll } from "./smooth-scroll";

export type WorkItem = FlexCarouselItem & { slug: string; preview?: string };

// How far you scroll per card, × the screen height.
const SCROLL_PER_CARD = 0.45;

// A released drag moves on a card once it has gone this share of one, or
// was flicked faster than this many cards a second.
const SNAP_DISTANCE = 0.15;
const FLICK_SPEED = 1;

// The work gallery: React Bits' Flex Carousel, one card per project, linked
// to the page scroll. The carousel pins in the middle of the screen and
// scrolling down runs it from the first project to the last, then the page
// carries on. Dragging it sideways (mouse or finger) scrolls the page through
// the same stretch, so the cards always sit where the scroll says; letting go
// snaps to a card, like a phone carousel: a short drag or a flick is enough to
// move on one. Sideways scroll and the arrow keys still move
// it, and clicking the card in the middle (or Enter) opens that project.
// Hovering a card floats that project's screenshot at the cursor.
export function WorkCarousel({ items }: { items: WorkItem[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const control = useRef<FlexCarouselControl | null>(null);
  const hover = useRef<(index: number | null) => void>(() => {});
  const trigger = useRef<ScrollTrigger | null>(null);
  const dragFrom = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || items.length < 2) return;
      trigger.current = ScrollTrigger.create({
        trigger: el,
        start: "center center",
        end: () => `+=${window.innerHeight * SCROLL_PER_CARD * (items.length - 1)}`,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => control.current?.setProgress(self.progress),
      });
      return () => void (trigger.current = null);
    },
    { scope: ref, dependencies: [items.length] },
  );

  // A drag keeps the page scroll with the cards: while it's held the scroll
  // follows the pointer, and on release it jumps to the card to settle on,
  // which the carousel's spring then glides the cards to. The carousel is
  // pinned, so the jump itself doesn't show.
  const drag: FlexCarouselDrag = (phase, offset, velocity) => {
    const st = trigger.current;
    if (!st) return;
    if (phase === "start") {
      dragFrom.current = st.progress;
      return;
    }
    let progress = gsap.utils.clamp(0, 1, dragFrom.current + offset);
    if (phase === "end") {
      // In cards: where the drag started, where it was let go, and how fast.
      const last = items.length - 1;
      const from = Math.round(dragFrom.current * last);
      const at = progress * last;
      const speed = velocity * last;
      let to = Math.round(at);
      if (to === from) {
        if (Math.abs(speed) > FLICK_SPEED) to = from + Math.sign(speed);
        else if (Math.abs(at - from) > SNAP_DISTANCE) to = from + Math.sign(at - from);
      }
      progress = gsap.utils.clamp(0, last, to) / last;
    }
    const y = st.start + progress * (st.end - st.start);
    if (pageScroll.current) pageScroll.current.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
    // Directly too: if the scroll was already there (a drag held past either
    // end), nothing else would bring the cards back.
    control.current?.setProgress(progress);
  };

  // The floating screenshot. The carousel is a canvas, so it reports which
  // card is under the pointer (re-checked every frame, including while the
  // page scroll moves the cards under a still cursor); projects without a
  // screenshot show nothing. It wipes open like the case study's panels, and
  // leans into the direction it's being dragged, by how far it trails the
  // cursor.
  useGSAP(
    () => {
      const box = preview.current;
      const panel = box?.firstElementChild as HTMLElement | null;
      const img = panel?.querySelector("img");
      if (!box || !panel || !img || !hasFinePointer()) return;
      gsap.set(box, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      gsap.set(panel, { clipPath: "inset(100% 0% 0% 0%)" });
      const xTo = gsap.quickTo(box, "x", { duration: 0.7, ease: "power3" });
      const yTo = gsap.quickTo(box, "y", { duration: 0.7, ease: "power3" });

      let targetX = 0;
      let targetY = 0;
      let current: string | undefined;
      const lean = () => {
        if (!current) return;
        const lag = targetX - (gsap.getProperty(box, "x") as number);
        gsap.set(box, { rotate: gsap.utils.clamp(-8, 8, lag * 0.04) });
      };
      gsap.ticker.add(lean);

      hover.current = (index) => {
        const src = index === null ? undefined : items[index]?.preview;
        if (src === current) return;
        const wasShowing = !!current;
        current = src;
        if (src) {
          img.src = src;
          gsap.set(box, { autoAlpha: 1 });
          if (!wasShowing) {
            // Opens where the cursor is, rather than flying in from the last spot.
            xTo(targetX, targetX);
            yTo(targetY, targetY);
            gsap.fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out", overwrite: "auto" });
          }
          gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 0.9, ease: "expo.out", overwrite: "auto" });
        } else {
          gsap.to(panel, {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 0.4,
            ease: "expo.in",
            overwrite: "auto",
            onComplete: () => void (current || gsap.set(box, { autoAlpha: 0 })),
          });
        }
      };
      const move = (e: PointerEvent) => {
        targetX = e.clientX;
        targetY = e.clientY;
        xTo(e.clientX);
        yTo(e.clientY);
      };
      const clear = () => hover.current(null);

      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerdown", clear);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerdown", clear);
        gsap.ticker.remove(lean);
        hover.current = () => {};
        gsap.set(box, { autoAlpha: 0 });
      };
    },
    { dependencies: [items] },
  );

  return (
    <>
      {/* The canvas overhangs the box by a quarter of its height above and
          below (the card height is scaled to match), so the lens can bend the
          cards past the box's edges instead of cutting them off flat. */}
      <div ref={ref} className="relative h-[min(88svh,64vw)] min-h-105">
        <div className="absolute inset-x-0 -inset-y-1/4">
          <FlexCarousel
            items={items}
            controlRef={control}
            onDrag={drag}
            cardHeight={0.62 / 1.5}
            focusOnClick={false}
            captureWheel={false}
            onHover={(i) => hover.current(i)}
            onSelect={(i) => router.push(`/work/${items[i].slug}`, { scroll: false })}
          />
        </div>
      </div>

      {/* Outside the pinned box, whose pin can transform it and break `fixed`.
          A flat panel with the screenshot contained on it, as in the case study. */}
      <div ref={preview} aria-hidden="true" className="pointer-events-none invisible fixed top-0 left-0 z-40 w-[clamp(260px,26vw,420px)]">
        <div className="relative aspect-video overflow-hidden bg-panel">
          <div className="absolute inset-[6%] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- already-optimised screenshot, swapped on hover */}
            <img alt="" className="max-h-full w-auto max-w-full object-contain shadow-[0_16px_40px_-16px_rgb(0_0_0/0.35)]" />
          </div>
        </div>
      </div>
    </>
  );
}
