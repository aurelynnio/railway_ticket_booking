"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  TrainFront,
  ShoppingCart,
  Users,
  Wallet,
  Bell,
  LogOut,
  Search,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { cn } from "@/lib/utils";

const sidebarNav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Vé tàu", icon: TrainFront },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/payments", label: "Thanh toán", icon: Wallet },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell },
];

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-card shadow-[1px_0_0_rgba(0,0,0,0.04)] transition-all duration-300 xl:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Brand — only text, no icons or symbols */}
        <div
          className={cn(
            "flex h-16 items-center",
            collapsed ? "justify-center px-0" : "px-6"
          )}
        >
          {!collapsed && (
            <span className="font-display text-base font-semibold tracking-tight text-ink">
              Mekong Line
            </span>
          )}
          {collapsed && (
            <span className="font-display text-sm font-bold text-primary">ML</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-muted hover:bg-muted hover:text-ink"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && (
                <>
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto size-1.5 rounded-full bg-accent" />
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={cn("p-4", collapsed && "flex justify-center p-2")}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-ink-muted",
              collapsed ? "size-10 justify-center p-0" : "w-full justify-start"
            )}
            disabled={logout.isPending}
            title={collapsed ? "Đăng xuất" : undefined}
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
            <LogOut className="size-4" />
            {!collapsed && <span>Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 bg-background/80 shadow-sm px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Collapse toggle — visible on xl and up */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden xl:flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {title}
            </h1>
            {description && (
              <p className="truncate text-xs text-ink-muted sm:text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="size-4" />
            </Button>
            {actions}
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto bg-card px-4 py-2 shadow-sm xl:hidden">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-muted hover:bg-muted"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
