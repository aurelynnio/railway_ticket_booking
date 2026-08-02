"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { NoticeBox, StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/auth.hook";
import { emailField } from "@/lib/validation";

const forgotPasswordSchema = z.object({
  email: emailField,
});

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    forgotPassword.mutate(values, {
      onSuccess: (result: Record<string, unknown>) => {
        setTokenPreview(typeof result?.token === "string" ? result.token : null);
      },
    });
  });

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

        <Button
          type="submit"
          size="lg"
          disabled={forgotPassword.isPending || form.formState.isSubmitting}
        >
          {forgotPassword.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Khôi phục bảo mật" tone="brand" />
          <StatusBadge label="Email xác minh" tone="warning" />
        </div>

        {tokenPreview ? (
          <div className="space-y-3 rounded-lg border border-border/80 bg-secondary/45 px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">Mã khôi phục</p>
            <p className="break-all font-mono text-xs text-foreground">{tokenPreview}</p>
            <Link href="/reset-password" className="inline-flex font-semibold text-primary">
              Đi tới màn reset
            </Link>
          </div>
        ) : null}

        {forgotPassword.isError ? (
          <NoticeBox
            title="Gửi yêu cầu thất bại"
            description="Vui lòng kiểm tra email và thử lại."
            tone="danger"
          />
        ) : null}
      </form>
    </AuthShell>
  );
}
