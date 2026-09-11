"use client";

import type { ReactNode } from "react";
import { ShieldCheck, Ticket, Clock } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

const features = [
  {
    icon: Ticket,
    title: "Giữ chỗ 10 phút",
    desc: "Thời gian để hoàn tất thanh toán trước khi chỗ được nhả lại.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán bảo mật",
    desc: "VNPay chuẩn PCI DSS, hỗ trợ thẻ nội địa và quốc tế.",
  },
  {
    icon: Clock,
    title: "Vé điện tử tức thì",
    desc: "QR code xuất hiện ngay sau khi thanh toán thành công.",
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 p-12 text-primary-foreground lg:flex">
        {/* Decorative */}
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-gold/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative">
          <BrandMark showText={false} size="lg" />
        </div>

        <div className="relative space-y-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              <span className="h-px w-10 bg-gold/60" />
              Mekong Line
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight">
              {title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-primary-foreground/70">
              {subtitle}
            </p>
          </div>

          {/* Route decoration */}
          <div className="flex items-center gap-3 pt-4">
            <span className="size-2.5 rounded-full bg-gold" />
            <div className="h-px flex-1 border-t border-dashed border-white/30" />
            <span className="size-2.5 rounded-full bg-accent" />
            <div className="h-px flex-1 border-t border-dashed border-white/30" />
            <span className="size-2.5 rounded-full bg-white/60" />
          </div>
          <div className="flex justify-between text-xs text-primary-foreground/50">
            <span>Hà Nội</span>
            <span>Đà Nẵng</span>
            <span>TP. Hồ Chí Minh</span>
          </div>
        </div>

        <div className="relative space-y-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <f.icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">{f.title}</p>
                <p className="text-sm leading-relaxed text-primary-foreground/65">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
