"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, startTransition } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Search,
  Receipt,
  Shield,
  TrainFront,
  UserRound,
  Wallet,
} from "lucide-react";

import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNavGroups = [
  {
    label: "Quản trị",
    items: [
      { href: "/admin", label: "Tổng quan", icon: Shield },
      { href: "/admin/tickets", label: "Vé tàu", icon: TrainFront },
      { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
      { href: "/admin/users", label: "Người dùng", icon: UserRound },
      { href: "/admin/payments", label: "Thanh toán", icon: Wallet },
    ],
  },
];

const publicPrimaryNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/search", label: "Tìm chuyến" },
  { href: "/tickets", label: "Vé tàu" },
  { href: "/profile/orders", label: "Đơn của tôi" },
];

const publicSecondaryLinks = [
  { href: "/profile", label: "Hồ sơ" },
  { href: "/profile/tickets", label: "Vé đã phát hành" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const pathname = usePathname();
  const router = useRouter();
  const sessionQuery = useAuthSession();
  const logout = useLogout();

  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:px-8">
          <aside className="surface-panel flex flex-col gap-6 px-4 py-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <TrainFront className="size-4" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold tracking-tight">
                    Railway Hub
                  </p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </Link>
              <div className="quiet-panel px-3 py-3">
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
              </div>
            </div>

            <div className="soft-divider" />

            <nav className="grid gap-1 overflow-y-auto pr-1">
              {adminNavGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
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
          </aside>

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 w-full items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrainFront className="size-4" />
              </div>
              <span className="font-heading text-sm font-semibold tracking-tight">
                Railway Hub
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <Link
                href="/search"
                className="inline-flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Search className="size-4" />
                Tìm tuyến, ga đến hoặc ngày đi
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {sessionQuery.data ? (
                <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:inline-flex">
                  <span className="line-clamp-1 max-w-[160px]">
                    {sessionQuery.data.email}
                  </span>
                  <ChevronRight className="size-3" />
                  <Link href="/profile" className="font-medium text-foreground hover:text-primary">
                    Hồ sơ
                  </Link>
                </div>
              ) : null}
              {sessionQuery.data ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
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
                  {logout.isPending ? "Đang xuất..." : "Đăng xuất"}
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">
                      Tạo tài khoản
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1">
            {publicPrimaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-2 px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {actions ? <div>{actions}</div> : null}
        </section>

        <div className="flex min-w-0 flex-col gap-8">{children}</div>

        <footer className="border-t border-border pt-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
                Railway Hub
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Lên kế hoạch, giữ chỗ và theo dõi hành trình trong một trải nghiệm
                đặt vé thống nhất.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Hành trình
              </p>
              <Link href="/" className="hover:text-foreground">
                Trang chủ
              </Link>
              <Link href="/search" className="hover:text-foreground">
                Tìm chuyến
              </Link>
              <Link href="/tickets" className="hover:text-foreground">
                Duyệt vé tàu
              </Link>
              <Link href="/profile/orders" className="hover:text-foreground">
                Đơn của tôi
              </Link>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground md:justify-self-end">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cá nhân
              </p>
              {publicSecondaryLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="hover:text-foreground">
                Đăng nhập
              </Link>
            </div>
          </div>
        </footer>
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
    <section className="surface-panel px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
