"use client";

import { usePathname } from "next/navigation";
import { Magnetic, RollText } from "./magnetic";
import { TransitionLink } from "./transition-link";

const nav = ["work", "about", "contact"];

// Nav from the Figma frames. The link for the current page turns the same
// grey as the big page word. The header is pinned during page transitions so
// it stays still while the pages wipe underneath it.
export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="shell fixed inset-x-0 top-0 z-50 bg-bg"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="flex items-center justify-between py-[clamp(8px,1vw,16px)]">
        <Magnetic>
          <TransitionLink
            href="/"
            aria-label="Home"
            className="inline-flex min-h-11 items-center text-[clamp(24px,2.5vw,36px)] leading-none"
          >
            <RollText>n.</RollText>
          </TransitionLink>
        </Magnetic>

        <nav aria-label="Primary">
          <ul className="flex gap-[clamp(10px,1.2vw,17px)]">
            {nav.map((id) => {
              const href = `/${id}`;
              const current = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={id}>
                  <Magnetic strength={0.25}>
                    <TransitionLink
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center text-[clamp(18px,2.2vw,32px)] leading-none font-light transition-colors duration-300 ${
                        current ? "text-ghost" : ""
                      }`}
                    >
                      <RollText>{id}</RollText>
                    </TransitionLink>
                  </Magnetic>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
