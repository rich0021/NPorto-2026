import type { Metadata } from "next";
import { projects } from "@/lib/content";
import { PageMotion } from "../_components/page-motion";
import { PageShell } from "../_components/page-shell";
import { PageTitle } from "../_components/page-title";
import { TransitionLink } from "../_components/transition-link";
import { WorkCarousel, type WorkItem } from "../_components/work-carousel";

export const metadata: Metadata = { title: "work / naufal muttaqin" };

// The work frame: the page word, then every project as a card in React Bits'
// Flex Carousel. The carousel is a canvas, so a plain list of the same links
// sits alongside it for screen readers and crawlers.
export default function WorkPage() {
  const items: WorkItem[] = projects.map((p) => {
    const shot = p.card ?? p.gallery[0] ?? p.cover;
    const preview = (p.gallery[0] ?? p.cover)?.src;
    return { slug: p.slug, src: shot?.src ?? "", preview, alt: p.summary, title: p.name, subtitle: p.category };
  });

  return (
    <PageShell>
      <PageMotion>
        <PageTitle>work</PageTitle>

        <div className="pt-[4vw]">
          <WorkCarousel items={items.filter((i) => i.src)} />
        </div>

        <nav aria-label="Projects" className="sr-only">
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <TransitionLink href={`/work/${p.slug}`} scroll={false}>
                  {p.name}, {p.category}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
      </PageMotion>
    </PageShell>
  );
}
