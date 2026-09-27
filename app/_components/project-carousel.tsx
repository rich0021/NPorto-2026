"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { projects } from "@/lib/content";
import { ProjectFrame } from "./project-frame";
import { TransitionLink } from "./transition-link";

const INTERVAL_MS = 800;
const slides = projects.filter((p) => p.cover);

// The framed square on the home page: flips through project covers with hard
// cuts, each landing with a small settle. Hovering holds the current one and
// clicking opens it; its frame carries over into the project page.
export function ProjectCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  // Warm every cover up front so the fast cuts never land on a blank frame.
  useEffect(() => {
    for (const p of slides) {
      const { props } = getImageProps({
        src: p.cover!.src,
        width: p.cover!.width,
        height: p.cover!.height,
        alt: "",
        sizes: "(min-width: 1440px) 215px, 17vw",
      });
      preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes });
    }
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2 || prefersReducedMotion()) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const img = ref.current?.querySelector(".frame-img");
    if (img && !prefersReducedMotion()) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 0.6, ease: "expo.out" });
  }, [index]);

  const project = slides[index];

  return (
    <TransitionLink
      ref={ref}
      href={`/work/${project.slug}`}
      scroll={false}
      aria-label={`Open ${project.name}`}
      data-cursor="open"
      className="carousel block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ProjectFrame key={project.slug} project={project} preload={index === 0} />
    </TransitionLink>
  );
}
