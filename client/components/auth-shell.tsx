"use client";

import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1080px] gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="hidden rounded-2xl border border-border/80 bg-card px-8 py-8 lg:block">
          <BrandLogo />
          <div className="mt-10 space-y-4">
            <div className="route-pill w-fit">{eyebrow}</div>
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="max-w-md text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="mt-10 space-y-4 rounded-xl bg-secondary/55 px-5 py-5">
            <div className="transit-line h-1.5 rounded-full" />
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p>Giữ phiên đăng nhập ổn định giữa tra cứu, đặt chỗ và thanh toán.</p>
              <p>Theo dõi đơn hàng và vé đã phát hành trong cùng một tài khoản.</p>
              <p>Khu vực quản trị dùng chung cùng ngôn ngữ giao diện, nhưng ưu tiên vận hành.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <BrandLogo />
          </div>

          <div className="surface-panel-strong px-6 py-8 sm:px-8">
            <div className="space-y-2 lg:hidden">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                {eyebrow}
              </p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-0 lg:mt-0">{children}</div>

            {footer ? (
              <div className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Bằng cách tiếp tục, bạn đồng ý với điều khoản dịch vụ và chính sách bảo mật.
          </p>
        </section>
      </div>
    </main>
  );
}
