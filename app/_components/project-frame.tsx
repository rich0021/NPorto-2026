import Image from "next/image";
import { ViewTransition } from "react";
import type { Project } from "@/lib/content";

const sizes = {
  sm: "(min-width: 1440px) 110px, 9vw",
  md: "(min-width: 1440px) 215px, 17vw",
};

// The grey square frame from the design, holding one project's cover. Each
// project's frame shares a transition name, so the same frame travels between
// the home carousel, the work list and the project page.
export function ProjectFrame({
  project,
  size = "md",
  preload,
  morph = true,
}: {
  project: Project;
  size?: "sm" | "md";
  preload?: boolean;
  morph?: boolean;
}) {
  const frame = (
      <div className={`frame shrink-0 overflow-hidden ${size === "sm" ? "frame--sm" : ""}`}>
        {project.cover ? (
          <Image
            src={project.cover.src}
            width={project.cover.width}
            height={project.cover.height}
            alt={`${project.name} logo`}
            sizes={sizes[size]}
            className="frame-img absolute inset-0 size-full object-contain"
            preload={preload}
          />
        ) : (
          <span
            className={`absolute inset-0 grid place-items-center p-2 text-center leading-tight ${
              size === "sm" ? "text-[11px]" : "text-[clamp(14px,1.25vw,18px)]"
            }`}
          >
            {project.name}
          </span>
        )}
      </div>
  );

  return morph ? (
    <ViewTransition name={`frame-${project.slug}`} share="frame-morph" default="none">
      {frame}
    </ViewTransition>
  ) : (
    frame
  );
}
