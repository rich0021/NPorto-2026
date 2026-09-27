import Image from "next/image";
import { projects, type Media, type Project } from "@/lib/content";
import { Magnetic } from "./magnetic";
import { PageMotion } from "./page-motion";
import { ProjectFrame } from "./project-frame";
import { TransitionLink } from "./transition-link";

// A project case study in the Humaan layout: a sticky column with the story on
// the left, a gallery of screenshot panels on the right, the next project to
// finish (full page only). Renders both as a full page and inside the bottom
// sheet; in the sheet the shared-element morphs are off, because the card
// they would pair with is still on the page behind it.
export function CaseStudy({ project, inSheet = false }: { project: Project; inSheet?: boolean }) {
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const count = (n: number) => String(n).padStart(2, "0");

  const title = (
    <h1
      data-split="chars"
      className={`text-[clamp(32px,3.2vw,48px)] leading-[0.95] tracking-[-0.02em] ${inSheet ? "" : "mt-8"}`}
    >
      {project.name}
    </h1>
  );

  return (
    <PageMotion>
      <div
        // In the sheet, Humaan's padding: the gallery 30px in from the sheet's
        // top and right, the story 60px from its left and a step lower, in
        // columns of 390 : 834 with a 65px gap (at 1440).
        className={`grid gap-12 pb-[clamp(80px,10vw,160px)] ${
          inSheet
            ? "sheet-pad lg:grid-cols-[minmax(0,390fr)_minmax(0,834fr)] lg:gap-[clamp(32px,4.5vw,65px)]"
            : "shell pt-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,9fr)] lg:gap-[clamp(32px,4vw,64px)]"
        }`}
      >
        <aside className={`self-start lg:sticky ${inSheet ? "lg:top-10 lg:pt-(--sheet-pad)" : "lg:top-28"}`}>
          {/* The sheet opens straight on the title, like Humaan's. */}
          {!inSheet && (
            <div className="flex items-end justify-between gap-4">
              <ProjectFrame project={project} size="sm" preload morph />
              <p data-reveal className="text-sm text-fg/55 tabular-nums">
                {count(index + 1)} / {count(projects.length)}
              </p>
            </div>
          )}

          {title}

          <div data-reveal data-delay="0.2" className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {project.url && (
              <Magnetic strength={0.2}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="visit"
                  className="btn-fill inline-flex min-h-11 items-center gap-2 bg-fg px-4 text-sm text-bg"
                >
                  visit website <span aria-hidden="true">↗</span>
                </a>
              </Magnetic>
            )}
            <span className="text-sm text-fg/55">{project.category}</span>
          </div>

          <p data-split="lines" data-delay="0.3" className="mt-8 text-[clamp(18px,1.5vw,22px)] leading-snug">
            {project.summary}
          </p>

          {project.body?.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} data-reveal data-delay="0.4" className="mt-4 text-sm leading-relaxed text-fg/75">
              {paragraph}
            </p>
          ))}

          <ul data-reveal data-delay="0.5" className="mt-8 space-y-2 text-sm">
            {project.stack.map((tech) => (
              <li key={tech} className="flex items-center gap-3">
                <span aria-hidden="true" className="size-2 bg-frame" />
                {tech.toLowerCase()}
              </li>
            ))}
          </ul>
        </aside>

        <Gallery project={project} />
      </div>

      {/* The sheet ends with the story; only the full page leads on. */}
      {!inSheet && <UpNext project={next} />}
    </PageMotion>
  );
}

// Screenshots sit contained on flat panels. Portrait shots take a half-width
// panel; landscape shots alternate between full and half width, and dense
// packing keeps the halves paired.
function Gallery({ project }: { project: Project }) {
  if (project.gallery.length === 0) {
    return (
      <div
        data-clip
        className="grid aspect-[16/10] place-items-center bg-panel text-[clamp(20px,2.4vw,36px)] text-fg/55"
      >
        screenshots coming soon
      </div>
    );
  }

  let landscape = 0;
  const panels = project.gallery.map((shot, i) => {
    const portrait = shot.height > shot.width * 1.1;
    const wide = !portrait && landscape++ % 3 === 0;
    return { shot, wide, dark: !wide && i % 2 === 1 };
  });
  // Half-width panels pair up; an odd one out would leave a hole, so widen it.
  const halves = panels.filter((p) => !p.wide);
  if (halves.length % 2 === 1) Object.assign(halves[halves.length - 1], { wide: true, dark: false });

  return (
    <div className="grid grid-flow-row-dense grid-cols-2 gap-[clamp(12px,1.4vw,24px)]">
      {panels.map(({ shot, wide, dark }, i) => (
        <Panel key={shot.src} shot={shot} wide={wide} dark={dark} name={project.name} index={i} />
      ))}
    </div>
  );
}

function Panel({ shot, wide, dark, name, index }: { shot: Media; wide: boolean; dark: boolean; name: string; index: number }) {
  return (
    <figure
      data-clip
      data-scroll={index > 1 ? "" : undefined}
      className={`relative overflow-hidden ${wide ? "col-span-2 aspect-[16/10]" : "col-span-2 aspect-[4/5] sm:col-span-1"} ${
        dark ? "bg-fg" : "bg-panel"
      }`}
    >
      {/* Drifts against the scroll inside its panel; the 7% inset leaves it room. */}
      <div data-parallax="0.06" className="absolute inset-[7%] flex items-center justify-center">
        <Image
          src={shot.src}
          width={shot.width}
          height={shot.height}
          alt={`${name}, screen ${index + 1}`}
          sizes={wide ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          className="max-h-full w-auto max-w-full object-contain shadow-[0_24px_60px_-24px_rgb(0_0_0/0.35)]"
          preload={index === 0}
        />
      </div>
    </figure>
  );
}

function UpNext({ project }: { project: Project }) {
  const href = `/work/${project.slug}`;
  const card = (
    <>
      <div data-clip data-scroll className="relative grid aspect-[21/9] place-items-center overflow-hidden bg-panel">
        {project.cover ? (
          <Image
            src={project.cover.src}
            width={project.cover.width}
            height={project.cover.height}
            alt=""
            sizes="40vw"
            className="up-next-img h-[70%] w-auto object-contain"
          />
        ) : (
          <span className="text-[clamp(20px,2.4vw,36px)]">{project.name}</span>
        )}
      </div>
      <p className="page-title mt-6 text-[clamp(2.5rem,6.5vw,6rem)] transition-colors duration-500 group-hover:text-fg">
        {project.name}
      </p>
    </>
  );

  return (
    <section className="shell pb-[clamp(48px,6vw,96px)]">
      <p data-reveal data-scroll className="border-t border-frame pt-6 text-sm text-fg/55">
        up next
      </p>
      <TransitionLink href={href} data-cursor="next" className="up-next group mt-6 block">
        {card}
      </TransitionLink>
    </section>
  );
}
