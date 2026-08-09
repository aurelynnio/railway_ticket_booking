import {
  Bell,
  CalendarCheck,
  Receipt,
  Search,
  Shield,
  TrainFront,
  UserRound,
  Wallet,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type PublicNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export const adminNavGroups: Array<{
  label: string;
  items: AdminNavItem[];
}> = [
  {
    label: "Quản trị",
    items: [
      { href: "/admin", label: "Tổng quan", icon: Shield },
      { href: "/admin/tickets", label: "Vé tàu", icon: TrainFront },
      { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
      { href: "/admin/users", label: "Người dùng", icon: UserRound },
      { href: "/admin/payments", label: "Thanh toán", icon: Wallet },
      { href: "/admin/notifications", label: "Thông báo", icon: Bell },
    ],
  },
];

export const publicPrimaryNav: PublicNavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/search", label: "Tìm chuyến" },
  { href: "/tickets", label: "Vé tàu" },
  { href: "/profile/orders", label: "Đơn của tôi" },
];

export const publicSecondaryLinks: PublicNavItem[] = [
  { href: "/profile", label: "Hồ sơ" },
  { href: "/profile/tickets", label: "Vé đã phát hành" },
  { href: "/profile/notifications", label: "Thông báo" },
];

export const bookingFlowSteps: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Tìm chuyến", icon: Search },
  { label: "Chọn vé", icon: TrainFront },
  { label: "Thanh toán", icon: CalendarCheck },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
