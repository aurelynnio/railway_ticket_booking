"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { RouteLine } from "@/components/route-line";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import {
  isActivePath,
  publicPrimaryNav,
} from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

type PublicShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  heroVariant?: "simple" | "rich" | "minimal";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="app-container">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-8">
              <BrandLogo />
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
                {publicPrimaryNav.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative px-3 py-2 text-sm font-medium transition-colors duration-150",
                        active
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {item.label}
                      {active && (
                        <span
                          className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
                <Link href="/search" aria-label="Tìm chuyến">
                  <Search className="size-4" />
                </Link>
              </Button>
              <ThemeToggle />
              {sessionQuery.data ? (
                <div className="hidden items-center gap-3 md:flex">
                  <Link href="/profile" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                      {(sessionQuery.data.email ?? "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline max-w-[140px] truncate">
                      {sessionQuery.data.email}
                    </span>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
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
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">
                      Đặt vé ngay
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="public-mobile-menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="public-mobile-menu"
            className="animate-fade-in border-t border-border lg:hidden"
          >
            <div className="app-container py-4 space-y-1">
              {publicPrimaryNav.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2.5 text-sm font-medium rounded-sm",
                      active ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-border my-3 pt-3 flex flex-col gap-2">
                {sessionQuery.data ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={logout.isPending}
                    onClick={() => {
                      setMobileMenuOpen(false);
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
                    Đăng xuất
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Đặt vé ngay
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="app-container py-8 lg:py-12">
          {isHome ? (
            heroVariant === "rich" ? (
              <EditorialHero title={title} description={description} actions={actions} />
            ) : heroVariant === "minimal" ? null : (
              <PageHero title={title} description={description} actions={actions} />
            )
          ) : (
            <PageHero title={title} description={description} actions={actions} />
          )}

          <div
            id="main-content"
            tabIndex={-1}
            className="page-section mt-8 outline-none lg:mt-12"
          >
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

function EditorialHero({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative -mt-4 mb-4">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16 items-center py-8 lg:py-16 border-b border-border pb-12 lg:pb-20">
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-px w-8 bg-primary" />
              Đường sắt Việt Nam
            </span>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-semibold text-ink tracking-tight text-balance">
              {title}
            </h1>
            <p className="text-lg leading-relaxed text-ink-muted max-w-xl">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-8 sm:gap-8">
            {[
              { value: "36", label: "Ga phủ sóng" },
              { value: "1.726", label: "Km đường sắt" },
              { value: "24/7", label: "Hỗ trợ" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-semibold text-ink tabular-nums sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-primary-soft/35">
            {/* Decorative railway illustration */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="w-full space-y-6">
                <div className="space-y-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">Hành trình Bắc-Nam</p>
                  <p className="font-display text-2xl font-semibold text-ink">Hà Nội → Sài Gòn</p>
                </div>
                <RouteLine animated />
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { time: "32h", label: "Thời gian" },
                    { time: "SE2", label: "Tàu nhanh" },
                    { time: "Từ 750K", label: "Giá vé" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="font-mono text-sm font-semibold text-primary">{item.time}</p>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-primary/20 -z-10" />
        </div>
      </div>
    </section>
  );
}

function PageHero({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="border-b border-border pb-8 lg:pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
            <span className="h-px w-6 bg-primary" />
            Vietrail
          </span>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15] font-semibold text-ink tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {description}
          </p>
        </div>
        {actions ? <div className="shrink-0 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="app-container py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo />
            <p className="text-sm leading-relaxed text-ink-muted max-w-xs">
              Nền tảng đặt vé tàu trực tuyến hiện đại, kết nối hành trình Bắc-Trung-Nam với trải nghiệm minh bạch và tin cậy.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted mb-4">
              Đặt vé
            </p>
            <ul className="space-y-3">
              <li><Link href="/search" className="text-sm text-ink-muted hover:text-ink transition-colors">Tìm chuyến</Link></li>
              <li><Link href="/tickets" className="text-sm text-ink-muted hover:text-ink transition-colors">Danh mục vé</Link></li>
              <li><Link href="/route-map" className="text-sm text-ink-muted hover:text-ink transition-colors">Bản đồ tuyến</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted mb-4">
              Cá nhân
            </p>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-sm text-ink-muted hover:text-ink transition-colors">Đăng nhập</Link></li>
              <li><Link href="/register" className="text-sm text-ink-muted hover:text-ink transition-colors">Tạo tài khoản</Link></li>
              <li><Link href="/profile/orders" className="text-sm text-ink-muted hover:text-ink transition-colors">Đơn của tôi</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted mb-4">
              Hỗ trợ
            </p>
            <ul className="space-y-3">
              <li><span className="text-sm text-ink-muted">Hotline: 1900 0000</span></li>
              <li><span className="text-sm text-ink-muted">support@vietrail.vn</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-ink-subtle">
            © 2026 Vietrail. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-xs text-ink-subtle">
            Thiết kế cho hành trình đường sắt hiện đại
          </p>
        </div>
      </div>
    </footer>
  );
}
