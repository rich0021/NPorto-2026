import { notFound } from "next/navigation";
import { getProject } from "@/lib/content";
import { CaseStudy } from "../../../_components/case-study";
import { ProjectSheet } from "../../../_components/project-sheet";

// Clicking a project from inside the site opens its case study in a bottom
// sheet over the current page. Direct visits render app/work/[slug] instead.
export default async function ProjectSheetPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <ProjectSheet slug={slug} title={project.name}>
      <CaseStudy key={slug} project={project} inSheet />
    </ProjectSheet>
  );
}
