"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { NoticeBox } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth.hook";
import { emailField, passwordField } from "@/lib/validation";

const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const login = useLogin();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["auth-session"] });
        const nextPath =
          typeof window === "undefined"
            ? null
            : new URLSearchParams(window.location.search).get("next");
        const safeNextPath =
          nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : "/profile";

        router.push(safeNextPath);
      },
    });
  });

  return (
    <AuthShell
      eyebrow="Đăng nhập"
      title="Tiếp tục hành trình của bạn"
      description="Đăng nhập để giữ chỗ, thanh toán và theo dõi vé đã đặt trên mọi thiết bị."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink-muted">Chưa có tài khoản?</span>
          <Link
            href="/register"
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Tạo tài khoản <ArrowRight className="ml-0.5 inline size-3.5" />
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email"
          required
          error={form.formState.errors.email?.message}
        >
          <Input
            type="email"
            placeholder="ban@railway.test"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </FormField>

        <FormField
          label="Mật khẩu"
          required
          error={form.formState.errors.password?.message}
          aside={(
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Quên mật khẩu?
            </Link>
          )}
        >
          <Input
            type="password"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={login.isPending || form.formState.isSubmitting}
        >
          {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          <ArrowRight className="size-4" />
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-[0.15em] text-ink-subtle">
              Hoặc
            </span>
          </div>
        </div>

        <Button asChild type="button" size="lg" variant="outline" className="w-full">
          <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/auth/google`}>
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Đăng nhập với Google
          </a>
        </Button>

        {login.isError ? (
          <NoticeBox
            title="Đăng nhập thất bại"
            description="Vui lòng kiểm tra email, mật khẩu hoặc thử lại sau."
            tone="danger"
          />
        ) : null}
      </form>
    </AuthShell>
  );
}
