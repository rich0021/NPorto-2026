import { TitleFx } from "./title-fx";
import { TransitionLink } from "./transition-link";

// The big bold line that ends a page and leads to contact ("let's have a
// talk, shall we?" unless a page says otherwise). It rises in when scrolled
// to, once. Left-aligned as in the Figma
// frames, or `centered` on the page.
export function TalkCta({
  text = "let's have a talk, shall we?",
  centered = false,
  className = "",
}: {
  text?: string;
  centered?: boolean;
  className?: string;
}) {
  return (
    <TransitionLink
      href="/contact"
      data-cursor="say hi"
      // On phones the line is short, so it gets room under it rather than
      // sitting on the screen's bottom edge, and it steps down a size and in
      // to the page gutter so it doesn't run into the screen's edges.
      className={`block w-fit ${centered ? "mx-auto" : "pl-[2.85vw] max-md:pl-[var(--gutter)]"} text-[7.64vw] leading-[1.26] font-bold whitespace-nowrap max-md:mb-[16svh] max-md:text-[6.7vw] ${className}`}
    >
      <span className="sr-only">{text}</span>
      <TitleFx text={text} reveal="scroll" drift={false} />
    </TransitionLink>
  );
}
