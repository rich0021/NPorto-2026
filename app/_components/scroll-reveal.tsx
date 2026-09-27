'use client';

// Scroll Reveal from React Bits (https://www.reactbits.dev/text-animations/scroll-reveal),
// installed from its registry (ScrollReveal-TS-TW). Local changes, marked "local:":
//   - children may mix text with elements (links): text is split into words,
//     elements pass through and can mark their own words with `.word`
//   - cleanup reverts only this component's tweens (upstream kills every
//     ScrollTrigger on the page, which would take the pins and titles with it)
//   - a <div> instead of <h2> around the <p> (a <p> can't sit in a heading)
//   - class props replace the defaults instead of adding to them
//   - reduced motion shows the text finished
import React, { Children, useEffect, useRef, useMemo, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = 'my-5',
  textClassName = 'text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // local: split every text child, pass elements through
  const splitText = useMemo(
    () =>
      Children.map(children, child => {
        if (typeof child !== 'string') return child;
        return child.split(/(\s+)/).map((word, index) => {
          if (word.match(/^\s+$/) || !word) return word;
          return (
            <span className="inline-block word" key={index}>
              {word}
            </span>
          );
        });
      }),
    [children]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // local: reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.querySelectorAll('.word'), { opacity: 1, filter: 'none' });
      return;
    }

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // local: scoped so cleanup only reverts what this component made
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom',
            end: rotationEnd,
            scrub: true
          }
        }
      );

      const wordElements = el.querySelectorAll<HTMLElement>('.word');

      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: 'opacity' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true
          }
        }
      );

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top bottom-=20%',
              end: wordAnimationEnd,
              scrub: true
            }
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <div ref={containerRef} className={containerClassName}>
      <p className={textClassName}>{splitText}</p>
    </div>
  );
};

export default ScrollReveal;
