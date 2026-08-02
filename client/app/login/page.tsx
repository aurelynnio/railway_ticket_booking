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
import { NoticeBox, StatusBadge } from "@/components/railway-ui";
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Chưa có tài khoản?</span>
          <Link href="/register" className="font-semibold text-primary">
            Tạo tài khoản
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField
          label="Email"
          error={form.formState.errors.email?.message}
        >
          <Input
            type="email"
            placeholder="ban@railway.test"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </FormField>

        <FormField
          label="Mật khẩu"
          error={form.formState.errors.password?.message}
          aside={(
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary"
            >
              Quên mật khẩu?
            </Link>
          )}
        >
          <Input
            type="password"
            placeholder="Nhập mật khẩu"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button
          type="submit"
          size="lg"
          disabled={login.isPending || form.formState.isSubmitting}
        >
          {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          <ArrowRight />
        </Button>

        <Button asChild type="button" size="lg" variant="outline">
          <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/auth/google`}>
            Đăng nhập Google
          </a>
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Bảo mật phiên" tone="brand" />
          <StatusBadge label="Theo dõi đơn hàng" tone="positive" />
        </div>

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
