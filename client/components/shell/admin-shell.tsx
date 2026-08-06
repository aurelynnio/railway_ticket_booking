"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { adminNavGroups, isActivePath } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sessionQuery = useAuthSession();
  const logout = useLogout();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:px-8">
        <Card className="flex flex-col gap-6 px-4 py-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <div className="space-y-4">
            <BrandLogo sublabel="Admin" />
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
            <Card variant="flat" className="px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Tài khoản
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {sessionQuery.data?.email ?? "Chưa đăng nhập"}
              </p>
              {sessionQuery.data ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-primary hover:text-primary/80"
                  disabled={logout.isPending}
                  onClick={() => {
                    logout.mutate(undefined, {
                      onSettled: () => {
                        startTransition(() => {
                          router.push("/login");
                          router.refresh();
                        });
                      },
                    });
                  }}
                >
                  {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              ) : null}
            </Card>
          </div>

          <div className="soft-divider" />

          <nav className="grid gap-1 overflow-y-auto pr-1" aria-label="Điều hướng quản trị">
            {adminNavGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="space-y-4">
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
            {actions ? <div>{actions}</div> : null}
          </header>

          <div className="flex min-w-0 flex-col gap-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
