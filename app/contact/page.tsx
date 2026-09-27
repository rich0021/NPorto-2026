import type { Metadata } from "next";
import { profile, socials } from "@/lib/content";
import { LocalTime } from "../_components/local-time";
import { Magnetic, RollText } from "../_components/magnetic";
import { PageMotion } from "../_components/page-motion";
import { PageShell } from "../_components/page-shell";
import { PageTitle } from "../_components/page-title";

export const metadata: Metadata = { title: "contact / naufal muttaqin" };

// Where "let's have a talk, shall we?" lands: the huge word like every other
// page, then the socials as grey squares.
export default function ContactPage() {
  return (
    <PageShell>
      <PageMotion>
        <PageTitle>talk</PageTitle>

        <div className="shell flex flex-col items-center gap-[clamp(32px,4vw,56px)] pt-[8.3vw] pb-[clamp(96px,12vw,200px)]">
          <p data-split="words" className="text-center text-[clamp(18px,1.6vw,24px)]">
            have something to build? say hi.
          </p>

          <ul className="grid grid-cols-2 gap-[clamp(16px,3.75vw,54px)] sm:grid-cols-4">
            {socials.map((s, i) => (
              <li key={s.label} data-reveal data-delay={String(0.15 + i * 0.08)}>
                <Magnetic strength={0.3}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="social-tile grid size-[clamp(88px,7vw,100px)] place-items-center bg-placeholder text-sm"
                  >
                    <RollText>{s.label}</RollText>
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>

          {profile.email && (
            <a data-reveal data-delay="0.5" href={`mailto:${profile.email}`} className="text-[clamp(18px,1.6vw,24px)]">
              <RollText>{profile.email}</RollText>
            </a>
          )}

          <p data-reveal data-delay="0.6" className="text-sm text-fg/55">
            it&apos;s <LocalTime timeZone={profile.timeZone} /> in bandung right now
          </p>
        </div>
      </PageMotion>
    </PageShell>
  );
}
