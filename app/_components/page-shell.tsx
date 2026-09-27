import { ViewTransition } from "react";

// Wraps every page so route changes play the full-page wipe. Lives in each
// page, not the layout, because layouts persist and never enter or exit.
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ forward: "page-in-forward", back: "page-in-back", default: "none" }}
      exit={{ forward: "page-out-forward", back: "page-out-back", default: "none" }}
      default="none"
    >
      <main className="relative min-h-svh bg-bg">{children}</main>
    </ViewTransition>
  );
}
