"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Ticket } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";

const benefits = [
  {
    icon: Ticket,
    title: "Giữ chỗ trong 10 phút",
    description:
      "Sau khi tra cứu, bạn có 10 phút để hoàn tất thanh toán trước khi chỗ được nhả.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán bảo mật",
    description:
      "VNPay sandbox, hỗ trợ thẻ nội địa và quốc tế theo chuẩn PCI DSS.",
  },
  {
    icon: Sparkles,
    title: "Lịch sử đồng bộ",
    description:
      "Đơn và vé phát hành hiển thị trên mọi thiết bị sau khi đăng nhập.",
  },
];

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
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-[1080px] gap-6 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-12">
        <section className="hidden flex-col gap-8 rounded-2xl border border-border bg-card p-8 lg:flex">
          <BrandLogo size="lg" />
          <div className="space-y-3">
            <span className="route-pill">{eyebrow}</span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">
              {title}
            </h1>
            <p className="max-w-md text-sm leading-7 text-ink-muted">
              {description}
            </p>
          </div>
          <ul className="grid gap-3 border-t border-border pt-6">
            {benefits.map(({ icon: Icon, title: t, description: d }) => (
              <Card
                key={t}
                variant="flat"
                className="flex items-start gap-3 bg-secondary/40 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="font-heading text-sm font-semibold text-ink">
                    {t}
                  </p>
                  <p className="text-xs leading-5 text-ink-muted">{d}</p>
                </div>
              </Card>
            ))}
          </ul>
        </section>

        <section className="mx-auto flex w-full max-w-md flex-col gap-5 lg:max-w-none">
          <div className="flex flex-col items-center text-center lg:hidden">
            <BrandLogo size="md" />
          </div>
          <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8">
            <div className="space-y-2 lg:hidden">
              <span className="route-pill">{eyebrow}</span>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
                {title}
              </h1>
              <p className="text-sm leading-6 text-ink-muted">{description}</p>
            </div>
            {children}
            {footer ? (
              <div className="mt-6 border-t border-border pt-4 text-sm leading-6 text-ink-muted">
                {footer}
              </div>
            ) : null}
          </div>
          <p className="px-2 text-center text-xs text-ink-muted">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <Link
              href="#"
              className="font-medium text-ink underline-offset-2 hover:text-brand hover:underline"
            >
              điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link
              href="#"
              className="font-medium text-ink underline-offset-2 hover:text-brand hover:underline"
            >
              chính sách bảo mật
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
