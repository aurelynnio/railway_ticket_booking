"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles, Ticket } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { RouteLine } from "@/components/route-line";

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
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background outline-none">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 lg:py-0">
        <div className="grid w-full gap-0 lg:grid-cols-[1fr_1.1fr] lg:gap-0">
          <section className="hidden lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-border lg:py-16 lg:pr-12">
            <div>
              <BrandLogo size="md" variant="mark" />
              <div className="mt-16 space-y-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                  {eyebrow}
                </span>
                <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink">
                  {title}
                </h1>
                <p className="max-w-sm text-base leading-relaxed text-ink-muted">
                  {description}
                </p>
              </div>
              <div className="mt-10 px-1">
                <RouteLine animated />
              </div>
            </div>

            <ul className="mt-12 grid gap-4">
              {benefits.map(({ icon: Icon, title: t, description: d }) => (
                <li key={t} className="flex items-start gap-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-primary/20 bg-primary-soft text-primary">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="space-y-1">
                    <p className="font-display text-sm font-semibold text-ink">
                      {t}
                    </p>
                    <p className="text-sm leading-relaxed text-ink-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex w-full flex-col justify-center lg:pl-12 lg:py-16">
            <div className="mx-auto w-full max-w-sm lg:max-w-md">
              <div className="flex flex-col items-center text-center lg:hidden">
                <BrandLogo size="md" />
              </div>

              <div className="mt-8 rounded-xl border border-border bg-card px-7 py-8 shadow-xs lg:mt-0 lg:px-10 lg:py-10">
                <div className="space-y-2 lg:hidden">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                    {eyebrow}
                  </span>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                    {title}
                  </h1>
                  <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
                </div>
                <div className={eyebrow ? "lg:mt-0" : ""}>{children}</div>
                {footer ? (
                  <div className="mt-6 border-t border-border pt-5 text-sm text-ink-muted">
                    {footer}
                  </div>
                ) : null}
              </div>

              <p className="mt-5 px-2 text-center text-xs leading-relaxed text-ink-subtle">
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <Link
                  href="#"
                  className="font-medium text-ink underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  href="#"
                  className="font-medium text-ink underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  chính sách bảo mật
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
