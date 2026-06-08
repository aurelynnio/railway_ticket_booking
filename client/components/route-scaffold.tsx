import Link from "next/link";

import { AppShell, Panel } from "@/components/app-shell";

export interface RouteScaffoldLink {
  href: string;
  label: string;
  description?: string;
}

export function RouteScaffold({
  title,
  description,
  routePath,
  links = [],
  notes = [],
}: {
  title: string;
  description: string;
  routePath: string;
  links?: RouteScaffoldLink[];
  notes?: string[];
}) {
  return (
    <AppShell
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap gap-2 text-sm text-zinc-700">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-xs text-zinc-500">
            {routePath}
          </span>
          <Link
            href="/route-map"
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 hover:bg-zinc-100"
          >
            Route map
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Route Scaffold"
          description="Trang nay da duoc tao san trong App Router. Anh co the them form, table, hook, query va business logic vao day."
        >
          <div className="grid gap-3 text-sm leading-6 text-zinc-700">
            <p>
              Day la page scaffold da ton tai trong route tree, de anh noi tiep
              vao data backend khi can.
            </p>
            {notes.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-medium text-zinc-900">Ghi chu</p>
                <ul className="mt-2 grid gap-2">
                  {notes.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>
        <Panel
          title="Lien quan"
          description="Cac trang dong cap hoặc can ke de dieu huong nhanh khi tiep tuc phat trien."
        >
          <div className="grid gap-3">
            {links.length === 0 ? (
              <p className="text-sm text-zinc-600">
                Chua khai bao link lien quan cho scaffold nay.
              </p>
            ) : (
              links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {link.label}
                  </p>
                  {link.description ? (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {link.description}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
