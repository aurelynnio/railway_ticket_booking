"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/hooks/auth.hook";
import { emailField } from "@/lib/validation";

const schema = z.object({ email: emailField });

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [token, setToken] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    forgot.mutate(values, {
      onSuccess: (res: Record<string, unknown>) => {
        if (typeof res?.token === "string") setToken(res.token);
      },
    });
  });

  return (
    <AuthLayout
      title="Khôi phục mật khẩu"
      subtitle="Nhập email đã đăng ký. Chúng tôi sẽ gửi mã khôi phục đến hộp thư của bạn."
    >
      <div className="space-y-2 lg:hidden">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Quên mật khẩu
        </h1>
        <p className="text-sm text-ink-muted">Nhập email để nhận mã khôi phục.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id="email"
              type="email"
              placeholder="ban@railway.test"
              autoComplete="email"
              className="pl-10"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          variant="accent"
          className="w-full gap-2"
          disabled={forgot.isPending}
        >
          {forgot.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          <ArrowRight className="size-4" />
        </Button>

        {token && (
          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
            <p className="text-sm font-medium text-primary">
              Mã khôi phục (môi trường dev):
            </p>
            <code className="mt-2 block break-all rounded-lg bg-background px-3 py-2 font-mono text-sm text-ink">
              {token}
            </code>
            <Link
              href="/reset-password"
              className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Đi tới đặt lại mật khẩu <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </div>
        )}

        {forgot.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            Gửi yêu cầu thất bại. Vui lòng thử lại.
          </div>
        )}
      </form>

      <div className="mt-8 text-center text-sm text-ink-muted">
        Đã nhớ mật khẩu?{" "}
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
