"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  User,
  Ticket,
  Receipt,
  Bell,
  LogOut,
} from "lucide-react";

import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { useMe } from "@/hooks/user.hook";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/profile", label: "Thông tin tài khoản", icon: User },
  { href: "/profile/tickets", label: "Vé của tôi", icon: Ticket },
  { href: "/profile/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/profile/notifications", label: "Thông báo", icon: Bell },
];

function getInitials(name: string, email: string): string {
  const source = name || email || "?";
  const parts = source.split(/[@\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sessionQuery = useAuthSession();
  const profileQuery = useMe(Boolean(sessionQuery.data));
  const logout = useLogout();

  const displayName =
    typeof profileQuery.data?.username === "string" && profileQuery.data.username
      ? profileQuery.data.username
      : sessionQuery.data?.email?.split("@")[0] ?? "Tài khoản";
  const displayEmail = sessionQuery.data?.email ?? "";
  const initials = getInitials(displayName, displayEmail);
  const pageMeta = getProfilePageMeta(pathname);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <AppShell title={pageMeta.title} description={pageMeta.description}>
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3 lg:hidden">
          <ProfileIdentity
            displayName={displayName}
            displayEmail={displayEmail}
            initials={initials}
          />
          <ProfileNavigation
            pathname={pathname}
            mobile
            isLoggingOut={logout.isPending}
            onLogout={handleLogout}
          />
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          <ProfileIdentity
            displayName={displayName}
            displayEmail={displayEmail}
            initials={initials}
          />
          <ProfileNavigation
            pathname={pathname}
            isLoggingOut={logout.isPending}
            onLogout={handleLogout}
          />
        </aside>

        <section className="min-w-0 space-y-6">{children}</section>
      </div>
    </AppShell>
  );
}

function ProfileIdentity({
  displayName,
  displayEmail,
  initials,
}: {
  displayName: string;
  displayEmail: string;
  initials: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-base font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight text-ink">
            {displayName}
          </p>
          {displayEmail ? (
            <p className="truncate font-mono text-xs text-ink-muted">
              {displayEmail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileNavigation({
  pathname,
  mobile = false,
  isLoggingOut,
  onLogout,
}: {
  pathname: string;
  mobile?: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <nav
      className="overflow-x-auto rounded-lg border border-border bg-card"
      aria-label="Điều hướng tài khoản"
    >
      <div className={cn(mobile ? "flex min-w-max" : "block")}>
        <ul className={cn(mobile ? "flex" : "block")}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/profile"
                ? pathname === "/profile"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 text-sm font-medium transition-colors duration-150",
                    mobile
                      ? "h-11 shrink-0 border-b-2 px-4"
                      : "border-l-2 px-5 py-3",
                    isActive
                      ? "border-primary bg-primary-soft/60 text-ink"
                      : "border-transparent text-ink-muted hover:bg-muted/50 hover:text-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={cn(mobile ? "border-l border-border" : "border-t border-border")}>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex items-center gap-2.5 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-destructive/5 hover:text-destructive disabled:opacity-50",
              mobile ? "h-11 shrink-0 px-4" : "w-full px-5 py-3",
            )}
          >
            <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </div>
    </nav>
  );
}

function getProfilePageMeta(pathname: string) {
  if (pathname.startsWith("/profile/orders/")) {
    return {
      title: "Chi tiết đơn của tôi",
      description: "Theo dõi hành trình, hành khách, ghế đã chọn và trạng thái thanh toán.",
    };
  }
  if (pathname.startsWith("/profile/orders")) {
    return {
      title: "Đơn hàng của tôi",
      description: "Theo dõi trạng thái đặt chỗ, thanh toán và vé đã phát hành.",
    };
  }
  if (pathname.startsWith("/profile/tickets")) {
    return {
      title: "Ví vé của tôi",
      description: "Tập hợp các vé điện tử đã phát hành cho hành trình sắp tới.",
    };
  }
  if (pathname.startsWith("/profile/notifications")) {
    return {
      title: "Thông báo của tôi",
      description: "Theo dõi các cập nhật quan trọng về đơn hàng và tài khoản.",
    };
  }
  return {
    title: "Tài khoản của tôi",
    description: "Quản lý thông tin cá nhân, bảo mật và các cài đặt tài khoản.",
  };
}
