"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/hooks/auth.hook";
import { passwordField, requiredText } from "@/lib/validation";

const schema = z.object({
  token: requiredText("Token"),
  newPassword: passwordField,
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const reset = useResetPassword();
  const [showPass, setShowPass] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { token: "", newPassword: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    reset.mutate(values, {
      onSuccess: () => router.push("/login"),
    });
  });

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã khôi phục và mật khẩu mới để tiếp tục."
    >
      <div className="space-y-2 lg:hidden">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Đặt lại mật khẩu
        </h1>
        <p className="text-sm text-ink-muted">Nhập mã và mật khẩu mới.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="token">Mã khôi phục</Label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id="token"
              placeholder="Nhập mã khôi phục"
              className="pl-10 font-mono"
              aria-invalid={Boolean(form.formState.errors.token)}
              {...form.register("token")}
            />
          </div>
          {form.formState.errors.token && (
            <p className="text-xs text-destructive">
              {form.formState.errors.token.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id="newPassword"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pl-10 pr-10"
              aria-invalid={Boolean(form.formState.errors.newPassword)}
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        {reset.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã.
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          variant="accent"
          className="w-full gap-2"
          disabled={reset.isPending}
        >
          {reset.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-ink-muted">
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Quay về đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
