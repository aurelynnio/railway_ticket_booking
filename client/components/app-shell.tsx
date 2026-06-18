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
        <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:px-8">
          <aside className="surface-panel-strong flex flex-col gap-6 rounded-[2.1rem] px-5 py-5 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-[1.2rem] bg-primary text-primary-foreground">
                  <TrainFront className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold tracking-normal">
                    Railway Hub
                  </p>
                  <p className="text-xs uppercase tracking-normal text-muted-foreground">
                    Bảng điều phối
                  </p>
                </div>
              </div>
              <div className="rounded-[1.6rem] bg-muted/50 px-4 py-4 ring-1 ring-border">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                  Session
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {sessionQuery.data?.email ?? "Chế độ khách"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionQuery.data?.userId ?? "Đang sử dụng giao diện khách"}
                </p>
                {sessionQuery.data ? (
                  <button
                    type="button"
                    className="mt-4 text-sm font-semibold text-foreground transition hover:text-muted-foreground"
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
                <div key={group.label} className="space-y-2">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-1.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-[1.25rem] px-3 py-3 text-sm font-medium transition-all",
                            active
                              ? "bg-primary text-primary-foreground"
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
            <header className="surface-panel-strong overflow-hidden rounded-[2.2rem] px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground ring-1 ring-border">
                      <span className="rail-dot" />
                      {pathname}
                    </div>
                    <div className="space-y-2">
                      <h1 className="font-heading text-4xl font-semibold tracking-normal text-balance text-foreground sm:text-5xl">
                        {title}
                      </h1>
                      <p className="max-w-4xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                        {description}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[1.7rem] bg-muted/45 px-4 py-4 ring-1 ring-border lg:max-w-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Góc nhìn điều phối
                    </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
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
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col">
          <div className="surface-panel-strong rounded-[1.8rem] px-4 py-4 sm:px-5">
            <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-[1.05rem] bg-primary text-primary-foreground">
                  <TrainFront className="size-4.5" />
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold tracking-normal">
                    Railway Hub
                  </p>
                  <p className="text-[11px] uppercase tracking-normal text-muted-foreground">
                    Đặt vé tinh gọn cho tuyến Bắc Trung Nam
                  </p>
                </div>
              </Link>

              <div className="hidden min-w-0 justify-center lg:flex">
                <Link
                  href="/search"
                  className="inline-flex w-full max-w-[520px] items-center gap-3 rounded-[1.1rem] bg-background px-4 py-3 text-sm text-muted-foreground ring-1 ring-border transition hover:bg-muted"
                >
                  <Search className="size-4" />
                  Tìm chuyến hoặc hạng vé...
                </Link>
              </div>

              <div className="flex items-center gap-2 lg:justify-self-end">
                {sessionQuery.data ? (
                  <div className="hidden items-center gap-2 rounded-[1rem] bg-muted px-3 py-2 text-xs text-muted-foreground ring-1 ring-border lg:inline-flex">
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
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <nav className="flex flex-wrap items-center gap-1.5">
                {publicPrimaryNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-[0.95rem] px-4 py-2 text-sm font-medium transition",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
                <Headphones className="size-4 text-foreground/70" />
                Theo dõi tồn vé, đơn hàng và thanh toán liền mạch.
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel-strong relative overflow-hidden rounded-[2.6rem] px-6 py-8 sm:px-8 sm:py-9">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-[0.06] dark:opacity-[0.02]"
            src="/imgs/railway.png"
            alt=""
            aria-hidden="true"
          />
          <div className="relative grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
            <div className="space-y-4">
              <div className="route-pill">
                <span className="rail-dot" />
                {pathname === "/" ? "Giao diện hành khách" : "Không gian hành trình"}
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-semibold tracking-normal text-balance text-foreground sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-3 py-1 ring-1 ring-border">
                  Tín hiệu tồn vé
                </span>
                <span className="rounded-full bg-muted px-3 py-1 ring-1 ring-border">
                  Khám phá theo tuyến
                </span>
                <span className="rounded-full bg-muted px-3 py-1 ring-1 ring-border">
                  Một tài khoản cho mọi đơn
                </span>
              </div>
            </div>
            {actions ? (
              <div className="xl:min-w-[420px]">
                <div className="rounded-[1.9rem] bg-muted/35 p-4 ring-1 ring-border">
                  {actions}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-6">{children}</div>

        <footer className="surface-panel rounded-[2.3rem] px-6 py-6 sm:px-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.75fr_0.75fr]">
            <div>
              <p className="font-heading text-lg font-semibold tracking-normal text-foreground">
                Railway Hub
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Tìm chuyến, so sánh giá, đặt chỗ và theo dõi đơn hàng trên cùng một
                hệ thống.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
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
              <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
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
    <section className="surface-panel rounded-[2rem] px-6 py-6 sm:px-7">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold tracking-normal text-foreground">
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
