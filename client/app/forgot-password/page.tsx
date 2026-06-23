"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/auth.hook";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email) return;

    forgotPassword.mutate(
      { email },
      {
        onSuccess: (result: Record<string, unknown>) => {
          setTokenPreview(
            typeof result?.token === "string" ? result.token : null,
          );
        },
      },
    );
  };

  return (
    <AuthShell
      eyebrow="Quên mật khẩu"
      title="Gửi yêu cầu khôi phục tài khoản"
      description="Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Đã nhớ mật khẩu?</span>
          <Link href="/login" className="font-semibold text-primary">
            Quay về đăng nhập
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Email
          </p>
          <Input
            type="email"
            placeholder="ban@railway.test"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={forgotPassword.isPending}
        >
          {forgotPassword.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Khôi phục bảo mật" tone="brand" />
          <StatusBadge label="Email xác minh" tone="warning" />
        </div>

        {tokenPreview ? (
          <div className="rounded-lg bg-muted/50 px-4 py-4 text-sm leading-6 text-foreground border border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Mã khôi phục
            </p>
            <p className="mt-2 break-all font-mono text-xs text-foreground">{tokenPreview}</p>
            <Link href="/reset-password" className="mt-3 inline-flex font-semibold text-primary">
              Đi tới màn reset
            </Link>
          </div>
        ) : null}

        {forgotPassword.isError ? (
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-6 text-foreground border border-border">
            Gửi yêu cầu thất bại. Vui lòng kiểm tra email và thử lại.
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
