"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/shell/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { NoticeBox } from "@/components/ui/railway-ui";
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
