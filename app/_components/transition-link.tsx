"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

// Pages sit in a line: home, work (and its projects), about, contact. Going
// right along that line is "forward", going left is "back", and the page
// transition wipes in the matching direction.
function depth(path: string) {
  if (path.startsWith("/work/")) return 1.5;
  if (path === "/work") return 1;
  if (path === "/about") return 2;
  if (path === "/contact") return 3;
  return 0;
}

type Props = Omit<ComponentProps<typeof Link>, "href" | "transitionTypes"> & { href: string };

export function TransitionLink({ href, ...props }: Props) {
  const pathname = usePathname();
  const direction = depth(href) >= depth(pathname) ? "forward" : "back";
  return <Link href={href} transitionTypes={[direction]} {...props} />;
}
