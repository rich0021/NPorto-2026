import { problemsToProducts, profile, stackLayers, taglines } from "@/lib/content";
import { HomePhases, type PhaseKind } from "./_components/home-phases";
import { PageMotion } from "./_components/page-motion";
import { PageShell } from "./_components/page-shell";
import { TechTitle } from "./_components/tech-title";
import { TalkCta } from "./_components/talk-cta";

const kinds: PhaseKind[] = ["fill", "assemble", "decode"];
const small = "text-[clamp(11px,2.5vw,36px)] leading-[1.26] font-light text-ghost";

// The homepage frame: the name filling the first screen, the three lines each
// resolving on their own pinned screen (see HomePhases), and the call to talk.
export default function Home() {
  return (
    <PageShell>
      <PageMotion>
        {/* The name block, laid out as in the Figma frame, sits in the middle
            of the first screen. The top padding offsets the room the display
            keeps under its baseline, so the visible text is what gets centred. */}
        <section className="relative flex h-svh flex-col justify-center overflow-hidden pt-[3.7vw]">
          <h1 className="relative">
            <span className="sr-only">{profile.fullName}</span>

            <span
              aria-hidden="true"
              data-split="chars"
              data-delay="0.35"
              className={`absolute top-[2.5vw] left-[2.5vw] ${small}`}
            >
              {profile.middleName}
            </span>

            <span aria-hidden="true" className="flex items-baseline gap-[1.25vw] pl-[0.7vw]">
              <span className="display mt-[-4.72vw] block">
                <TechTitle text={profile.firstName} delay={0.1} />
              </span>
              <span data-split="chars" data-delay="0.55" className={small}>
                {profile.lastName}
              </span>
            </span>
          </h1>

          {/* A quiet meta line along the foot of the first screen, so the
              space under the name reads as a composed screen, not a gap. */}
          <div className="shell absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 pb-[clamp(20px,3svh,36px)] text-[13px] leading-tight text-ghost">
            <p data-reveal data-delay="0.9">full-stack developer</p>
            <p data-reveal data-delay="1" aria-hidden="true" className="flex items-center gap-2">
              scroll <span className="scroll-cue" />
            </p>
          </div>
        </section>

        <HomePhases
          phases={taglines.map((text, i) => ({ text, kind: kinds[i] }))}
          stack={stackLayers}
          cases={problemsToProducts}
        />

        <TalkCta className="mt-[30svh]" />
      </PageMotion>
    </PageShell>
  );
}
