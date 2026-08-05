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
import { useResetPassword } from "@/hooks/auth.hook";
import { passwordField, requiredText } from "@/lib/validation";

const resetPasswordSchema = z.object({
  token: requiredText("Mã khôi phục"),
  newPassword: passwordField,
});

export default function ResetPasswordPage() {
  const resetPassword = useResetPassword();
  const [isDone, setIsDone] = useState(false);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    resetPassword.mutate(values, {
      onSuccess: () => {
        setIsDone(true);
      },
    });
  });

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
        <FormField
          label="Mã khôi phục"
          required
          error={form.formState.errors.token?.message}
          hint="Dán mã nhận được từ email hoặc từ màn forgot-password trong môi trường dev."
        >
          <Input
            placeholder="Dán mã khôi phục"
            autoComplete="one-time-code"
            aria-invalid={Boolean(form.formState.errors.token)}
            {...form.register("token")}
          />
        </FormField>

        <FormField
          label="Mật khẩu mới"
          required
          error={form.formState.errors.newPassword?.message}
          hint="Tối thiểu 6 ký tự. Nên dùng chữ hoa, số và ký tự đặc biệt."
        >
          <Input
            type="password"
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.newPassword)}
            {...form.register("newPassword")}
          />
        </FormField>

        <Button
          type="submit"
          size="lg"
          disabled={resetPassword.isPending || form.formState.isSubmitting}
        >
          {resetPassword.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Khôi phục tài khoản" tone="brand" />
          <StatusBadge label="Bảo mật mật khẩu" tone="positive" />
        </div>

        {isDone ? (
          <NoticeBox
            title="Đặt lại mật khẩu thành công"
            description={
              <>
                Bạn có thể quay lại{" "}
                <Link href="/login" className="font-semibold text-primary">
                  đăng nhập
                </Link>
                .
              </>
            }
            tone="positive"
          />
        ) : null}

        {resetPassword.isError ? (
          <NoticeBox
            title="Đặt lại mật khẩu thất bại"
            description="Vui lòng kiểm tra mã khôi phục."
            tone="danger"
          />
        ) : null}
      </form>
    </AuthShell>
  );
}
