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
      title="Tạo mật khẩu mới"
      description="Dán mã khôi phục trong email và chọn mật khẩu mới cho tài khoản của bạn."
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
            Mã khôi phục
          </p>
          <Input
            placeholder="Dán mã khôi phục"
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
          <StatusBadge label="Khôi phục tài khoản" tone="brand" />
          <StatusBadge label="Bảo mật mật khẩu" tone="positive" />
        </div>

        {isDone ? (
          <div className="rounded-lg bg-muted/50 px-4 py-4 text-sm leading-6 text-foreground border border-border">
            Đặt lại mật khẩu thành công. Bạn có thể quay lại{" "}
            <Link href="/login" className="font-semibold text-primary">
              đăng nhập
            </Link>
            .
          </div>
        ) : null}

        {resetPassword.isError ? (
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-6 text-foreground border border-border">
            Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã khôi phục.
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
