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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo />
        </div>

          <div className="surface-panel-strong px-6 py-8">
          <div className="space-y-2">
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

          <div className="mt-6">{children}</div>

          {footer ? (
            <div className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bằng cách tiếp tục, bạn đồng ý với điều khoản dịch vụ và chính sách bảo mật.
        </p>
      </div>
    </main>
  );
}
