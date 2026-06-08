import Link from "next/link";
import { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const navItems = [
  { href: "/search", label: "Search" },
  { href: "/tickets", label: "Tickets" },
  { href: "/profile", label: "Profile" },
  { href: "/login", label: "Login" },
];

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe8_0%,#fbfaf7_35%,#ffffff_100%)] text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Railway Ticket Booking
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
                  {description}
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {actions ? (
            <div className="border-t border-zinc-200 bg-zinc-50/80 px-6 py-4">
              {actions}
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="border border-zinc-200 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
