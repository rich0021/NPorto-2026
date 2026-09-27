import { profile } from "@/lib/content";
import { PageMotion } from "./_components/page-motion";
import { PageShell } from "./_components/page-shell";
import { TitleMorph } from "./_components/page-title";
import { ProjectCarousel } from "./_components/project-carousel";

const small = "text-[clamp(14px,min(2.5vw,4svh),36px)] leading-none text-ghost";

// Exactly one screen, never scrolls: "hi", the project carousel, and the name.
export default function Home() {
  return (
    <PageShell>
      <PageMotion className="relative flex h-svh flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(20px,3.3vw,48px)] pt-20">
          <p
            data-reveal
            data-delay="0.1"
            className="group cursor-default text-[clamp(24px,2.5vw,36px)] leading-none font-bold"
          >
            <span className="group-hover:hidden">hi</span>
            <span className="hidden group-hover:inline" lang="id">
              halo
            </span>
          </p>
          <div data-depth="-0.015">
            <div data-reveal data-delay="0.25">
              <ProjectCarousel />
            </div>
          </div>
        </div>

        <h1 className="home-name relative px-[clamp(8px,1.5vw,22px)]" data-depth="0.008">
          <span className="sr-only">{profile.fullName}</span>

          <span
            aria-hidden="true"
            data-reveal
            data-delay="0.7"
            className={`absolute top-[0.1em] left-[clamp(8px,1.5vw,22px)] flex gap-[1.4em] ${small}`}
          >
            <span>im</span>
            <span>{profile.middleName}</span>
          </span>

          <span aria-hidden="true" className="flex items-baseline gap-[clamp(12px,2.8vw,40px)]">
            <TitleMorph>
              <span
                data-split="chars"
                data-delay="0.15"
                className="-ml-[0.04em] block text-[min(20.8vw,38svh)] leading-[0.8] tracking-[-0.02em] text-ghost"
              >
                {profile.firstName}
              </span>
            </TitleMorph>
            <span data-reveal data-delay="0.8" className={small}>
              {profile.lastName}
            </span>
          </span>
        </h1>
      </PageMotion>
    </PageShell>
  );
}
