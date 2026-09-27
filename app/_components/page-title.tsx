import { ViewTransition } from "react";

// Every page's main word shares one transition name, so navigating morphs the
// old word into the new one instead of wiping it away with the page.
export function TitleMorph({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="page-title" share="title-morph" default="none">
      {children}
    </ViewTransition>
  );
}

// The big grey word pinned to the bottom-left corner, as in the Figma frames.
export function PageTitle({ children, count }: { children: string; count?: number }) {
  return (
    <TitleMorph>
      <h1 className="page-title pointer-events-none mt-24 w-fit pb-10 md:fixed md:bottom-10 md:left-(--gutter) md:mt-0 md:pb-0">
        <span data-split="chars" className="inline-block">
          {children}
        </span>
        {count !== undefined && (
          <sup className="ml-2 align-top text-[0.18em] tracking-normal">{String(count).padStart(2, "0")}</sup>
        )}
      </h1>
    </TitleMorph>
  );
}
