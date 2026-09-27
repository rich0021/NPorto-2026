import type { Metadata } from "next";
import { bio, getProject, profile } from "@/lib/content";
import { AboutBio, type BioToken } from "../_components/about-bio";
import { LocalTime } from "../_components/local-time";
import { PageMotion } from "../_components/page-motion";
import { PageShell } from "../_components/page-shell";
import { PageTitle } from "../_components/page-title";
import { TalkCta } from "../_components/talk-cta";

export const metadata: Metadata = { title: "about / naufal muttaqin" };

// "[text](/work/slug)" → a link token carrying that project's first screenshot.
function tokenize(text: string): BioToken[] {
  return text.split(/(\[[^\]]+\]\([^)]+\))/).filter(Boolean).map((part) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!link) return { text: part };
    const [, label, href] = link;
    const project = getProject(href.split("/").pop() ?? "");
    return { text: label, href, preview: (project?.gallery[0] ?? project?.cover)?.src };
  });
}

// The about frame: the huge "me", then the bio as a quiet column that you read
// into focus (see AboutBio), then the call to talk.
export default function AboutPage() {
  return (
    <PageShell>
      <PageMotion>
        <PageTitle>me</PageTitle>

        <p data-reveal data-delay="0.5" className="mt-4 px-(--gutter) text-[13px] text-ghost md:pl-[16.46vw]">
          bandung, indonesia — <LocalTime timeZone={profile.timeZone} /> here
        </p>

        <AboutBio chapters={bio.map((c) => ({ label: c.label, tokens: tokenize(c.text) }))} />

        <TalkCta
          text="let's cook something up"
          centered
          className="mt-[30svh]"
        />
      </PageMotion>
    </PageShell>
  );
}
