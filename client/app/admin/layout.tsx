"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";
import { useAuthSession } from "@/hooks/auth.hook";

const ADMIN_ROLE = 1;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionQuery = useAuthSession();
  const session = sessionQuery.data;
  const isAdmin = session?.role === ADMIN_ROLE;
  const isAuthenticated = Boolean(session?.userId);

  useEffect(() => {
    if (sessionQuery.isLoading || sessionQuery.isFetching) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [
    isAdmin,
    isAuthenticated,
    pathname,
    router,
    sessionQuery.isFetching,
    sessionQuery.isLoading,
  ]);

  if (sessionQuery.isLoading || sessionQuery.isFetching) {
    return <AdminGateMessage title="Đang kiểm tra quyền truy cập" />;
  }

  if (!isAuthenticated) {
    return <AdminGateMessage title="Đang chuyển về đăng nhập" />;
  }

  if (!isAdmin) {
    return <AdminGateMessage title="Tài khoản không có quyền quản trị" />;
  }

  return children;
}

function AdminGateMessage({ title }: { title: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-background px-4 outline-none"
    >
      <Card variant="outlined" padding="xl" className="w-full max-w-md">
        <BrandLogo sublabel="Admin" />
        <div className="mt-6 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Khu vực admin chỉ dành cho tài khoản có role quản trị.
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}
