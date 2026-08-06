import Link from "next/link";

import { AppShell, Panel } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export interface RouteScaffoldLink {
  href: string;
  label: string;
  description?: string;
}

export function RouteScaffold({
  title,
  description,
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
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Link
            href="/route-map"
            className="rounded-md border border-border bg-background px-3 py-1.5 hover:bg-muted"
          >
            Sơ đồ trang
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Trang đang hoàn thiện"
          description="Nội dung chi tiết sẽ được bổ sung khi tính năng sẵn sàng."
        >
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              Bạn vẫn có thể điều hướng sang các khu vực liên quan bên dưới.
            </p>
            {notes.length > 0 ? (
              <Card variant="flat" className="p-4">
                <p className="font-medium text-foreground">Ghi chú</p>
                <ul className="mt-2 grid gap-2">
                  {notes.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </Panel>
        <Panel
          title="Liên quan"
          description="Các khu vực có thể mở tiếp."
        >
          <div className="grid gap-3">
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có liên kết liên quan.
              </p>
            ) : (
              links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block"
                >
                  <Card
                    variant="flat"
                    interactive
                    className="px-4 py-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {link.label}
                    </p>
                    {link.description ? (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {link.description}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
