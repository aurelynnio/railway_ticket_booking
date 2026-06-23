"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, startTransition } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Headphones,
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
    label: "Điều phối",
    items: [
      { href: "/admin", label: "Admin", icon: Shield },
      { href: "/admin/tickets", label: "Điều phối vé", icon: TrainFront },
      { href: "/admin/orders", label: "Điều phối đơn", icon: Receipt },
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
      <main className="min-h-screen text-foreground">
        <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-8">
          <aside className="surface-panel-strong flex flex-col gap-6 px-5 py-5 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <TrainFront className="size-4" />
                </div>
                <div>
                  <p className="font-heading text-base font-semibold tracking-tight">
                    Railway Hub
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bảng điều phối
                  </p>
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Session
                </p>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {sessionQuery.data?.email ?? "Chế độ khách"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionQuery.data?.userId ?? "Đang sử dụng giao diện khách"}
                </p>
                {sessionQuery.data ? (
                  <button
                    type="button"
                    className="mt-3 text-sm font-medium text-primary hover:text-primary/80"
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

            <nav className="grid gap-5 overflow-y-auto pr-1">
              {adminNavGroups.map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-0.5">
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
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <header className="surface-panel-strong px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <span className="rail-dot" />
                      {pathname}
                    </div>
                    <div className="space-y-2">
                      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                        {title}
                      </h1>
                      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/50 px-4 py-3 lg:max-w-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      Góc nhìn điều phối
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-foreground">
                      Theo dõi tồn vé, đơn hàng, người dùng và thanh toán trong
                      cùng một khu điều phối.
                    </p>
                  </div>
                </div>
                {actions ? (
                  <>
                    <div className="soft-divider" />
                    <div>{actions}</div>
                  </>
                ) : null}
              </div>
            </header>

            <div className="flex min-w-0 flex-col gap-6">{children}</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 w-full items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrainFront className="size-4" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-tight">
                  Railway Hub
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Đặt vé tinh gọn
                </p>
              </div>
            </Link>

            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <Link
                href="/search"
                className="inline-flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Search className="size-4" />
                Tìm chuyến hoặc hạng vé...
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {sessionQuery.data ? (
                <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground lg:inline-flex">
                  <span className="line-clamp-1 max-w-[170px]">
                    {sessionQuery.data.email}
                  </span>
                  <ChevronRight className="size-3" />
                  <Link href="/profile" className="font-medium text-foreground">
                    Tài khoản
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
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1">
              {publicPrimaryNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "font-medium text-foreground border-b-2 border-primary -mb-px"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="surface-panel-strong px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div className="space-y-3">
              <div className="route-pill">
                <span className="rail-dot" />
                {pathname === "/" ? "Giao diện hành khách" : "Không gian hành trình"}
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border border-border bg-muted/50 px-2 py-1">
                  Tín hiệu tồn vé
                </span>
                <span className="rounded-md border border-border bg-muted/50 px-2 py-1">
                  Khám phá theo tuyến
                </span>
                <span className="rounded-md border border-border bg-muted/50 px-2 py-1">
                  Một tài khoản cho mọi đơn
                </span>
              </div>
            </div>
            {actions ? (
              <div className="xl:min-w-[420px]">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  {actions}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-6">{children}</div>

        <footer className="surface-panel px-6 py-6 sm:px-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.75fr_0.75fr]">
            <div>
              <p className="font-heading text-base font-semibold tracking-tight text-foreground">
                Railway Hub
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Tìm chuyến, so sánh giá, đặt chỗ và theo dõi đơn hàng trên cùng một
                hệ thống.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Đặt vé
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
                Tài khoản
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
    <section className="surface-panel px-6 py-5 sm:px-7">
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
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
