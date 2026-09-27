"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { iteration } from "@/lib/content";
import { Magnetic } from "./magnetic";
import { pageScroll } from "./smooth-scroll";
import { StaggeredMenu } from "./staggered-menu";

const nav = [
  { label: "home", href: "/" },
  { label: "work", href: "/work" },
  { label: "about", href: "/about" },
  { label: "talk", href: "/contact" },
];

// The dark square in each frame's top-right corner opens the sidebar: React
// Bits' Staggered Menu, grey layers sweeping in from the right ahead of the
// #222 panel, then the pages rise in one after another. Picking a page leaves
// the menu open until that page renders, then it slides away.
export function Header() {
  const pathname = usePathname();
  // Remembers the page the menu was opened on, so any route change closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const close = useCallback(() => setOpenOn(null), []);
  const menu = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = nav.map(({ label, href }) => ({
    label,
    ariaLabel: `Go to ${label}`,
    link: href,
    current: href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`),
  }));

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("menu-open");
    pageScroll.current?.stop();
    menu.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenOn(null);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("menu-open");
      pageScroll.current?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <StaggeredMenu
        id="site-menu"
        open={open}
        items={items}
        note={`iteration ${iteration}`}
        panelRef={menu}
        ignoreRef={toggle}
        onClose={close}
        // Another page: stay open until it renders. This page: just close.
        onItemClick={(it) => it.link === pathname && close()}
        style={{ viewTransitionName: "site-menu" }}
      />

      <header ref={toggle} className="fixed top-5.25 right-[calc(clamp(16px,2.36vw,34px)+var(--sbw,0px))] z-60" style={{ viewTransitionName: "site-header" }}>
        <Magnetic strength={0.3}>
          <button
            ref={button}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(!open)}
            className="burger grid size-9.5 place-items-center bg-ink text-white"
          >
            {/* The Figma burger icon, split into its buns and patty so it can
                fold into a close icon (see .burger in globals.css). */}
            <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
              <path
                className="burger-top"
                d="M7 4H16C17.3261 4 18.5979 4.52678 19.5355 5.46447C20.4732 6.40215 21 7.67392 21 9H2C2 7.67392 2.52678 6.40215 3.46447 5.46447C4.40215 4.52678 5.67392 4 7 4ZM16 5H7C5.14 5 3.57 6.27 3.13 8H19.87C19.43 6.27 17.86 5 16 5Z"
              />
              <path
                className="burger-patty"
                d="M12.5 10L14.5 12L16.5 10H19C19.5304 10 20.0391 10.2107 20.4142 10.5858C20.7893 10.9609 21 11.4696 21 12V13C21 13.5304 20.7893 14.0391 20.4142 14.4142C20.0391 14.7893 19.5304 15 19 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V12C2 11.4696 2.21071 10.9609 2.58579 10.5858C2.96086 10.2107 3.46957 10 4 10H12.5ZM14.5 13.41L12.09 11H4C3.73478 11 3.48043 11.1054 3.29289 11.2929C3.10536 11.4804 3 11.7348 3 12V13C3 13.2652 3.10536 13.5196 3.29289 13.7071C3.48043 13.8946 3.73478 14 4 14H19C19.2652 14 19.5196 13.8946 19.7071 13.7071C19.8946 13.5196 20 13.2652 20 13V12C20 11.7348 19.8946 11.4804 19.7071 11.2929C19.5196 11.1054 19.2652 11 19 11H16.91L14.5 13.41Z"
              />
              <path
                className="burger-bottom"
                d="M21 16C21 17.3261 20.4732 18.5979 19.5355 19.5355C18.5979 20.4732 17.3261 21 16 21H7C5.67392 21 4.40215 20.4732 3.46447 19.5355C2.52678 18.5979 2 17.3261 2 16H21ZM7 20H16C17.86 20 19.43 18.73 19.87 17H3.13C3.57 18.73 5.14 20 7 20Z"
              />
              <rect className="burger-x burger-x1" x="3.5" y="11.25" width="17" height="1.5" />
              <rect className="burger-x burger-x2" x="3.5" y="11.25" width="17" height="1.5" />
            </svg>
          </button>
        </Magnetic>
      </header>
    </>
  );
}
