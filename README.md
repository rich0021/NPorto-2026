# nporto-2026

Personal portfolio of Muhammad Naufal Muttaqin, a full-stack developer based in Bandung, Indonesia.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, GSAP, Lenis and OGL.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script          | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Build for production             |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Run ESLint                       |

## Project structure

```
app/
  layout.tsx            Root layout: smooth scroll, header, WebGL canvas, cursor
  page.tsx              Home
  about/                About page
  contact/              Contact page
  work/                 Work index and full-page case studies (/work/[slug])
  @sheet/               Parallel route that opens case studies in a bottom sheet
  _components/          Shared UI and motion components
lib/
  content.ts            All site copy, projects, bio, story and social links
  project-media.json    Image paths and dimensions for each project
  gsap.ts               GSAP plugin registration
  webgl.ts              Render-target helpers for the liquid background
public/projects/<slug>/ Project images (cover, card, gallery)
```

## Editing content

All copy lives in [lib/content.ts](lib/content.ts), so content changes never touch layout code. Search for `TODO` there before shipping.

To add a project:

1. Put its images in `public/projects/<slug>/`: `cover.webp`, `card.webp` (the work carousel title card) and numbered gallery shots (`01.webp`, `02.webp`, …).
2. Add an entry for `<slug>` in [lib/project-media.json](lib/project-media.json) with each image's `src`, `width` and `height`.
3. Add a `Project` to the `projects` array in `lib/content.ts`, spreading `...withMedia("<slug>")` for the images.

The case study is then available at `/work/<slug>`.

## How the case study routes work

Clicking a project from inside the site opens its case study in a bottom sheet over the current page, via the intercepting route `app/@sheet/(.)work/[slug]`. Visiting `/work/<slug>` directly, or reloading, renders the full page from `app/work/[slug]` instead.

## Notes

- This project uses Next.js 16, whose APIs and conventions differ from earlier versions. Check `node_modules/next/dist/docs/` before changing routing or data fetching. See [AGENTS.md](AGENTS.md).
- The liquid background falls back to no effect on GPUs that can't render into half-float targets.
- Bump `iteration` in `lib/content.ts` when the design changes; it's shown at the foot of the sidebar.
