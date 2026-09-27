import media from "./project-media.json";

// All copy and links for the site live here, so iterating on content never
// means touching layout code. Replace every `TODO` before shipping.

export const profile = {
  firstName: "naufal",
  middleName: "muhammad",
  lastName: "muttaqin",
  fullName: "Muhammad Naufal Muttaqin",
  timeZone: "Asia/Jakarta",
  email: "", // TODO: add your email to show it on the contact page
};

export type Media = { src: string; width: number; height: number };

export type Project = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  body?: string[];
  stack: string[];
  url?: string;
  cover?: Media;
  gallery: Media[];
};

// Covers and screenshots were pulled from the old portfolio
// (muttaqin.is-a.dev/project.json) into public/projects/<slug>/.
const shots = media as Record<string, { cover: Media | null; gallery: Media[] }>;
const withMedia = (slug: string) => ({
  cover: shots[slug]?.cover ?? undefined,
  gallery: shots[slug]?.gallery ?? [],
});

export const projects: Project[] = [
  {
    slug: "ternusa",
    name: "ternusa.id",
    category: "saas platform",
    summary: "Multi-tenant SaaS platform for livestock management, with a Flutter app for the field.",
    body: [
      "Ternusa.id is a multi-tenant SaaS platform for livestock management that I've been building on NestJS, Prisma and Next.js, alongside a Flutter app for the field.",
    ],
    stack: ["NestJS", "Prisma", "Next.js", "Flutter"],
    ...withMedia("ternusa"),
  },
  {
    slug: "bintang-bot",
    name: "bintang",
    category: "ai bot",
    summary: "A WhatsApp bot that uses AI to screen job candidates before a human ever has to.",
    body: [
      "It sounds simple until you've spent a week arguing with a language model about why it keeps inventing its own interview questions.",
    ],
    stack: ["WhatsApp", "LLM"], // TODO: confirm stack
    ...withMedia("bintang-bot"),
  },
  {
    slug: "spectra-web",
    name: "spectra web",
    category: "web app & company profile",
    summary: "Spectra's web app and profile website.",
    stack: ["Laravel", "jQuery", "Bootstrap", "Tailwind", "Alpine.js"],
    url: "https://spectra.id",
    ...withMedia("spectra-web"),
  },
  {
    slug: "spectra-mobile",
    name: "spectra mobile",
    category: "mobile app",
    summary: "Every Spectra mobile client app.",
    stack: ["Flutter", "Laravel", "MySQL"],
    ...withMedia("spectra-mobile"),
  },
  {
    slug: "e-ledger",
    name: "e-ledger",
    category: "web app",
    summary: "General ledger app, with worksheets and financial reporting.",
    stack: ["Vue", "Vuetify", "Laravel"],
    ...withMedia("e-ledger"),
  },
  {
    slug: "emas-app",
    name: "emas app",
    category: "web app",
    summary: "Gold manufacturing tracker app.",
    stack: ["Vue", "AdonisJS", "PostgreSQL"],
    ...withMedia("emas-app"),
  },
  {
    slug: "disco-frog-studio",
    name: "disco frog studio",
    category: "company profile",
    summary: "Disco Frog Studio's profile website.",
    stack: ["Next.js", "Tailwind", "Laravel", "MySQL"],
    url: "https://discofrogstudio.com",
    ...withMedia("disco-frog-studio"),
  },
  {
    slug: "lestari-osean-indonesia",
    name: "lestari osean indonesia",
    category: "company profile",
    summary: "Lestari Osean Indonesia's profile website.",
    stack: ["Next.js", "Tailwind", "Laravel", "MySQL"],
    url: "https://loishipyard.com",
    ...withMedia("lestari-osean-indonesia"),
  },
  {
    slug: "bintang-manunggal-pratama",
    name: "bintang manunggal pratama",
    category: "company profile",
    summary: "Bintang Manunggal Pratama's profile website.",
    stack: ["Next.js", "Tailwind", "Laravel", "MySQL"],
    url: "https://groupbintang.com",
    ...withMedia("bintang-manunggal-pratama"),
  },
  {
    slug: "manwa",
    name: "manwa",
    category: "web app",
    summary:
      "Helps student affairs staff manage attendance and discipline data, including photo check-ins for students.",
    stack: ["Nuxt", "Laravel", "Tailwind", "MySQL"],
    url: "https://manwa.smkn11bdg.sch.id",
    ...withMedia("manwa"),
  },
  {
    slug: "kelontong-id",
    name: "kelontong.id",
    category: "marketplace",
    summary: "Internship case study: a simple marketplace app for selling groceries.",
    stack: ["Laravel", "Livewire", "jQuery", "Bootstrap", "MySQL"],
    ...withMedia("kelontong-id"),
  },
  {
    slug: "web-11",
    name: "web 11",
    category: "school website",
    summary: "Profile website for SMKN 11 Bandung.",
    stack: ["Laravel", "Bootstrap", "MySQL"],
    ...withMedia("web-11"),
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

// The about page tells the bio as a story, one chapter per scroll step. The
// wording comes from the bio in the Figma about frame; `negative` flips the
// stage to inverse.
export type Chapter = {
  title: string[];
  body: string[];
  facts?: { label: string; value: string }[];
  links?: { label: string; href: string; note: string }[];
  negative?: boolean;
  cta?: boolean;
  // What the frame stack in the middle of the stage shows for this chapter:
  // a label per plate (bottom to top), or one word in the core of the frame.
  plates?: string[];
  core?: string;
};

export const story: Chapter[] = [
  {
    title: ["hi, i'm", "naufal."],
    body: ["A full-stack developer based in Bandung, Indonesia."],
    core: "n.",
  },
  {
    title: ["two places,", "one afternoon."],
    body: [
      "Right now I split my time between building production software at Disco Frog Studio and finishing my degree in Informatics Engineering at Universitas Teknologi Bandung.",
      "It's not always tidy, but it's taught me more about actually shipping software than either half would on its own.",
    ],
    plates: ["disco frog studio", "", "universitas teknologi bandung", "", ""],
  },
  {
    title: ["every", "layer."],
    body: [
      "I've never been someone who sticks to one layer. I like following a feature from a database schema all the way to the button someone taps.",
    ],
    facts: [
      { label: "frontend", value: "react, vue" },
      { label: "backend", value: "node.js, adonisjs, nestjs, laravel" },
      { label: "mobile", value: "flutter" },
    ],
    plates: ["database schema", "api", "backend", "frontend", "the button"],
  },
  {
    title: ["the invisible", "plumbing."],
    body: [
      "I especially like the parts of the job most people avoid: deployment pipelines, Docker, auth.",
      "The invisible plumbing that decides whether a product actually stays up.",
    ],
    negative: true,
    plates: ["auth", "docker", "ci/cd", "deploy", "uptime"],
  },
  {
    title: ["lately."],
    body: ["Two things have had most of my attention."],
    links: [
      { label: "ternusa.id", href: "/work/ternusa", note: "multi-tenant saas for livestock management, plus a flutter app for the field" },
      { label: "bintang", href: "/work/bintang-bot", note: "a whatsapp bot that screens job candidates with ai" },
    ],
    plates: ["ternusa.id", "bintang", "", "", ""],
  },
  {
    title: ["off the", "clock."],
    body: ["Outside work I'm usually gaming, playing volleyball, or out on my bike."],
    plates: ["red dead redemption", "kingdom come", "volleyball", "bike", "replay"],
    facts: [
      { label: "all-time favorites", value: "red dead redemption, kingdom come: deliverance" },
      { label: "replayed", value: "long after finishing them" },
    ],
  },
  {
    title: ["some", "day."],
    body: [
      "Long term, I'd like to end up making games myself, ideally at a real studio working in Unreal Engine.",
      "With everything I'm learning about AI as something I keep building alongside that, rather than instead of it.",
    ],
    cta: true,
    core: "unreal engine",
  },
];

// From the old portfolio's social buttons.
export const socials = [
  { label: "github", href: "https://github.com/rich0021" },
  { label: "gitlab", href: "https://gitlab.com/rich0021" },
  { label: "linkedin", href: "https://www.linkedin.com/in/muhammad-naufal-muttaqin/" },
  { label: "instagram", href: "https://www.instagram.com/nfmtq0/" },
];
