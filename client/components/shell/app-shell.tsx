"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/shell/admin-shell";
import { PublicShell } from "@/components/shell/public-shell";

export { Panel } from "@/components/shell/panel";

/**
 * AppShell - thin dispatcher.
 *
 * Routes:
 *  - /admin/*  → AdminShell  (sidebar layout, no top nav, no footer)
 *  - else      → PublicShell (sticky header + bottom nav + footer)
 *
 * Auth pages use AuthShell directly (no app chrome).
 */
export function AppShell({
  title,
  description,
  children,
  actions,
  heroVariant = "simple",
  embedded = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  heroVariant?: "simple" | "rich" | "minimal";
  /** Renders only page content when a route is already framed by a parent layout. */
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (embedded) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return (
      <AdminShell title={title} description={description} actions={actions}>
        {children}
      </AdminShell>
    );
  }

  return (
    <PublicShell
      title={title}
      description={description}
      actions={actions}
      heroVariant={heroVariant}
    >
      {children}
    </PublicShell>
  );
}
