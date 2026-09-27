"use client";

// Settles when the first-load loader starts lifting, so entrances that don't
// run on GSAP (Tech Text's canvas) can wait for it instead of playing unseen
// behind it. Already settled on the server and after the first load.
let settle: () => void = () => {};

export const pageReady: Promise<void> =
  typeof window === "undefined" ? Promise.resolve() : new Promise<void>((resolve) => (settle = resolve));

export const markPageReady = () => settle();
