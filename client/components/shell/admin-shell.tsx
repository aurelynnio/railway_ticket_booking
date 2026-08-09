"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode } from "react";
import { LogOut } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
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

  const userEmail = sessionQuery.data?.email ?? "";
  const userInitial = userEmail ? userEmail[0]?.toUpperCase() : "?";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen bg-background text-foreground outline-none"
    >
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card xl:flex xl:sticky xl:top-0 xl:h-screen">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <BrandLogo sublabel="Admin" />
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {userEmail || "Chưa đăng nhập"}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
              Quản trị viên
            </p>
          </div>
          {sessionQuery.data ? (
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-muted hover:text-ink"
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
              title={logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            >
              <LogOut className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="soft-divider" />

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng quản trị">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 border-l-2 px-3 text-sm transition-colors duration-150",
                        active
                          ? "border-primary bg-primary-soft font-medium text-primary"
                          : "border-transparent text-ink-muted hover:bg-muted hover:text-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-subtle">
              Giao diện
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-xs text-ink-muted sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>

        <nav
          className="border-b border-border bg-card xl:hidden"
          aria-label="Điều hướng quản trị trên thiết bị nhỏ"
        >
          <div className="flex min-w-max items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {adminNavGroups.flatMap((group) => group.items).map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-ink-muted hover:bg-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex min-w-0 flex-col gap-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
