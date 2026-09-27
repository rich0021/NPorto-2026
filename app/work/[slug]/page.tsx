import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/content";
import { CaseStudy } from "../../_components/case-study";
import { PageShell } from "../../_components/page-shell";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return { title: project ? `${project.name} / naufal muttaqin` : "work / naufal muttaqin" };
}

// The full-page case study, for direct visits and refreshes. Clicking a
// project from inside the site opens the same content in the bottom sheet
// instead (app/@sheet/(.)work/[slug]).
export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <PageShell>
      <CaseStudy project={project} />
    </PageShell>
  );
}
