"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/auth.hook";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const schema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
});

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [showPass, setShowPass] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: () => router.push("/login"),
    });
  });

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Tham gia cùng hàng ngàn hành khách. Lưu lịch sử, nhận ưu đãi và quản lý vé dễ dàng."
    >
      <div className="space-y-2 lg:hidden">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Tạo tài khoản
        </h1>
        <p className="text-sm text-ink-muted">Đăng ký nhanh chóng, miễn phí.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id="username"
              placeholder="nguyen-van-a"
              autoComplete="username"
              className="pl-10"
              aria-invalid={Boolean(form.formState.errors.username)}
              {...form.register("username")}
            />
          </div>
          {form.formState.errors.username && (
            <p className="text-xs text-destructive">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pl-10 pr-10"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
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
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
          <p className="text-xs text-ink-muted">
            Tối thiểu 6 ký tự. Nên dùng chữ hoa, số và ký tự đặc biệt.
          </p>
        </div>

        {register.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            Tạo tài khoản thất bại. Vui lòng thử lại.
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          variant="accent"
          className="w-full gap-2"
          disabled={register.isPending}
        >
          {register.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-ink-muted">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
