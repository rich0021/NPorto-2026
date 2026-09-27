import type { Metadata } from "next";
import { AboutStory } from "../_components/about-story";
import { PageMotion } from "../_components/page-motion";
import { PageShell } from "../_components/page-shell";
import { PageTitle } from "../_components/page-title";

export const metadata: Metadata = { title: "about / naufal muttaqin" };

// The bio told as a story: see AboutStory for how the chapters play.
export default function AboutPage() {
  return (
    <PageShell>
      <PageMotion>
        <AboutStory />
        <PageTitle>about</PageTitle>
      </PageMotion>
    </PageShell>
  );
}
