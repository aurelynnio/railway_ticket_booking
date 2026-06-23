"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!token || !newPassword) return;

    resetPassword.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          setIsDone(true);
        },
      },
    );
  };

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
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Token
          </p>
          <Input
            placeholder="Dán token reset vào đây"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Mật khẩu mới
          </p>
          <Input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Reset flow" tone="brand" />
          <StatusBadge label="Gateway -> auth-service" tone="positive" />
        </div>

        {isDone ? (
          <div className="rounded-lg bg-muted/35 px-4 py-4 text-sm leading-6 text-foreground ring-1 ring-border">
            Đặt lại mật khẩu thành công. Bạn có thể quay lại{" "}
            <Link href="/login" className="font-semibold text-primary">
              đăng nhập
            </Link>
            .
          </div>
        ) : null}

        {resetPassword.isError ? (
          <div className="rounded-lg bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground ring-1 ring-border">
            Đặt lại mật khẩu thất bại. Kiểm tra token hoặc `auth-service`.
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
