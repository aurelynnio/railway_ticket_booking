"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/auth.hook";

export default function ResetPasswordPage() {
  const resetPassword = useResetPassword();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isDone, setIsDone] = useState(false);

  return (
    <AuthShell
      eyebrow="Đặt lại mật khẩu"
      title="Nhập token và đặt lại mật khẩu mới"
      description="Trang reset được giữ đơn giản nhưng có hierarchy rõ hơn, để user biết token đến từ đâu và sau khi submit thì sẽ quay lại login."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Cần tạo yêu cầu mới?</span>
          <Link href="/forgot-password" className="font-semibold text-primary">
            Gửi email reset
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Token
          </p>
          <Input
            placeholder="Dán token reset vào đây"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mật khẩu mới
            </p>
            <Input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
        </div>

        <Button
          type="button"
          size="lg"
          disabled={resetPassword.isPending}
          onClick={async () => {
            await resetPassword.mutateAsync({ token, newPassword });
            setIsDone(true);
          }}
        >
          {resetPassword.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Reset flow" tone="brand" />
          <StatusBadge label="Gateway -> auth-service" tone="positive" />
        </div>

        {isDone ? (
          <div className="rounded-[1.2rem] bg-muted/35 px-4 py-4 text-sm leading-6 text-foreground ring-1 ring-border">
            Đặt lại mật khẩu thành công. Bạn có thể quay lại{" "}
            <Link href="/login" className="font-semibold text-primary">
              đăng nhập
            </Link>
            .
          </div>
        ) : null}

        {resetPassword.isError ? (
          <div className="rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground ring-1 ring-border">
            Đặt lại mật khẩu thất bại. Kiểm tra token hoặc `auth-service`.
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
