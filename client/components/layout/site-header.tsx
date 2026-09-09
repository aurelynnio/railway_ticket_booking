"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Menu, X, Search, User, LogOut, ArrowRight } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/search", label: "Tìm chuyến" },
  { href: "/tickets", label: "Vé tàu" },
  { href: "/route-map", label: "Lộ trình" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-background/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-8">
            <BrandMark />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-primary"
                      : "text-ink-muted hover:text-ink hover:bg-muted/60"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-[15px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
              <Link href="/search" aria-label="Search">
                <Search className="size-4" />
              </Link>
            </Button>

            {session.data ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-full bg-card py-1.5 pl-1.5 pr-4 shadow-sm transition-colors hover:shadow-md"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {(session.data.email ?? "U")[0].toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-medium text-ink">
                    {session.data.email}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={logout.isPending}
                  onClick={() =>
                    logout.mutate(undefined, {
                      onSettled: () => {
                        startTransition(() => {
                          router.push("/login");
                          router.refresh();
                        });
                      },
                    })
                  }
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden lg:inline">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild variant="accent" size="sm">
                  <Link href="/register">
                    Đặt vé
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="bg-background lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-lg px-4 py-3 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-primary-soft text-primary"
                    : "text-ink-muted hover:bg-muted hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 space-y-2 pt-4">
              {session.data ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ink hover:bg-muted"
                  >
                    <User className="size-4" />
                    Tài khoản của tôi
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={logout.isPending}
                    onClick={() => {
                      setMobileOpen(false);
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
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild variant="accent" className="w-full">
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Tạo tài khoản
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
