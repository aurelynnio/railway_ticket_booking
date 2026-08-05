"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { NoticeBox } from "@/components/railway-ui";
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
          required
          error={form.formState.errors.email?.message}
          hint="Dùng email đã đăng ký. Mã khôi phục có hiệu lực trong 15 phút."
        >
          <Input
            type="email"
            placeholder="ban@railway.test"
            autoComplete="email"
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

        {tokenPreview ? (
          <NoticeBox
            title="Yêu cầu đã được tạo"
            description={
              <>
                <p className="text-sm leading-6">
                  Trong môi trường dev, dùng mã bên dưới để đặt lại mật khẩu.
                  Trên production, mã chỉ gửi qua email.
                </p>
                <code className="mt-2 block break-all rounded-md border border-border/60 bg-card px-3 py-2 font-mono text-xs text-foreground">
                  {tokenPreview}
                </code>
                <Link
                  href="/reset-password"
                  className="mt-3 inline-flex font-semibold text-primary hover:text-primary/80"
                >
                  Đi tới màn reset <ArrowRight className="ml-0.5 size-3.5" />
                </Link>
              </>
            }
            tone="positive"
          />
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
