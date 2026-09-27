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
