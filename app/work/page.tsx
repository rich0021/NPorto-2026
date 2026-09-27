import type { Metadata } from "next";
import { projects } from "@/lib/content";
import { PageMotion } from "../_components/page-motion";
import { PageShell } from "../_components/page-shell";
import { PageTitle } from "../_components/page-title";
import { ProjectFrame } from "../_components/project-frame";
import { TransitionLink } from "../_components/transition-link";

export const metadata: Metadata = { title: "work / naufal muttaqin" };

// The work frame: a column of grey squares right of centre, with the big grey
// word pinned bottom-left while the column scrolls past.
export default function WorkPage() {
  return (
    <PageShell>
      <PageMotion>
        <div className="shell relative z-10 pt-[clamp(96px,14.4vw,208px)] pb-[clamp(96px,14vw,200px)]">
          <ol className="mx-auto flex w-fit flex-col gap-[clamp(48px,7.6vw,109px)] lg:mx-0 lg:w-auto lg:pl-[58%]">
            {projects.map((p, i) => (
              <li key={p.slug} data-reveal data-scroll>
                <TransitionLink
                  href={`/work/${p.slug}`}
                  scroll={false}
                  data-cursor="view"
                  className="project-card flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8"
                >
                  <ProjectFrame project={p} preload={i < 2} />
                  <div className="max-w-[18rem]">
                    <p className="text-sm text-fg/55">
                      {String(i + 1).padStart(2, "0")} <span className="mx-1">/</span> {p.category}
                    </p>
                    <h2 className="mt-1 text-[clamp(18px,1.4vw,20px)] leading-tight">{p.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed">{p.summary}</p>
                    <p className="mt-2 text-sm text-fg/55">{p.stack.join(", ").toLowerCase()}</p>
                  </div>
                </TransitionLink>
              </li>
            ))}
          </ol>
        </div>

        <PageTitle count={projects.length}>work</PageTitle>
      </PageMotion>
    </PageShell>
  );
}
