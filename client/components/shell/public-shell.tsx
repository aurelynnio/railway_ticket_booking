"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode } from "react";
import { ArrowUpRight, ChevronRight, MapPinned, Search } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import {
  bookingFlowSteps,
  isActivePath,
  publicPrimaryNav,
  publicSecondaryLinks,
} from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";

type PublicShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  heroVariant?: "simple" | "rich";
  children: ReactNode;
};

export function PublicShell({
  title,
  description,
  actions,
  heroVariant = "simple",
  children,
}: PublicShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sessionQuery = useAuthSession();
  const logout = useLogout();
  const isHome = pathname === "/";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/75 bg-background/92 backdrop-blur-xl">
        <div className="app-container flex">
          <div className="flex h-16 w-full items-center gap-6">
            <BrandLogo />

            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <Link
                href="/search"
                className="inline-flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"
              >
                <Search className="size-4" aria-hidden />
                Tìm tuyến, ga đến hoặc ngày đi
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              {sessionQuery.data ? (
                <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:inline-flex">
                  <span className="line-clamp-1 max-w-[160px]">
                    {sessionQuery.data.email}
                  </span>
                  <ChevronRight className="size-3" aria-hidden />
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
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="app-container flex">
          <nav className="grid w-full grid-cols-4 gap-1 sm:flex sm:w-auto sm:items-center" aria-label="Điều hướng chính">
            {publicPrimaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b-2 px-2 py-2.5 text-center text-sm leading-tight transition-colors sm:px-3",
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

      <div className="app-container flex flex-col gap-8 py-8">
        {isHome ? (
          heroVariant === "rich" ? (
            <RichHero title={title} description={description} actions={actions} />
          ) : (
            <SimpleHero title={title} description={description} actions={actions} variant="home" />
          )
        ) : (
          <SimpleHero title={title} description={description} actions={actions} variant="page" />
        )}

        <div className="page-section">{children}</div>

        <SiteFooter />
      </div>
    </main>
  );
}

function RichHero({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5 border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="space-y-4">
            <div className="route-pill w-fit">
              <MapPinned className="size-3" aria-hidden />
              Bắc · Trung · Nam
            </div>
            <h1 className="max-w-2xl font-heading text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          <div className="mt-2 grid grid-cols-3 gap-3 border-t border-border pt-5">
            {bookingFlowSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col gap-2">
                  <span className="flex size-8 items-center justify-center rounded-md bg-brand-soft text-brand">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="text-xs font-medium text-ink">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-secondary p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Tuyến phủ sóng
          </p>
          <div className="transit-line h-1.5 rounded-full" aria-hidden />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium text-ink">
            {["Hà Nội", "Huế", "Đà Nẵng", "Nha Trang", "Sài Gòn", "..."].map((city) => (
              <li
                key={city}
                className="flex items-center gap-2 border-b border-border/60 pb-2 last:border-b-0"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {city}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SimpleHero({
  title,
  description,
  actions,
  variant,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  variant: "home" | "page";
}) {
  if (variant === "page") {
    return (
      <section className="page-header-compact">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="route-pill w-fit">
              <MapPinned className="size-3" aria-hidden />
              Bắc - Trung - Nam
            </div>
            <h1 className="max-w-4xl font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {actions ? <div className="w-full lg:w-auto">{actions}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="page-band overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <div className="route-pill w-fit">
            <MapPinned className="size-3" aria-hidden />
            Bắc - Trung - Nam
          </div>
          <h1 className="max-w-4xl font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="hidden min-w-72 rounded-lg border border-border/80 bg-card/70 px-4 py-3 lg:block">
          <div className="transit-line h-1.5 rounded-full" aria-hidden />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {bookingFlowSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-3.5" aria-hidden />
                  </div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {actions ? <div className="mt-5">{actions}</div> : null}
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/70 pt-8">
      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
            Vietrail Way
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
  );
}
