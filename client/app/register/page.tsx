"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { NoticeBox, StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/auth.hook";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const registerSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
});

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  });

  return (
    <AuthShell
      eyebrow="Tạo tài khoản"
      title="Tạo tài khoản mới để giữ booking theo người dùng"
      description="Tài khoản giúp lưu hồ sơ, giữ lịch sử đơn hàng và theo dõi vé đã phát hành trong các lần đặt sau."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Đã có tài khoản?</span>
          <Link href="/login" className="font-semibold text-primary">
            Quay về đăng nhập
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField
          label="Username"
          required
          error={form.formState.errors.username?.message}
          hint="3-32 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới và gạch ngang."
        >
          <Input
            placeholder="nguyen-van-a"
            autoComplete="username"
            aria-invalid={Boolean(form.formState.errors.username)}
            {...form.register("username")}
          />
        </FormField>

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
          hint="Tối thiểu 6 ký tự. Nên dùng chữ hoa, số và ký tự đặc biệt."
        >
          <Input
            type="password"
            placeholder="Tạo mật khẩu mới"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button
          type="submit"
          size="lg"
          disabled={register.isPending || form.formState.isSubmitting}
        >
          {register.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Sẵn sàng cho hồ sơ" tone="brand" />
          <StatusBadge label="Nối tiếp lịch sử đơn" tone="positive" />
        </div>

        {register.isError ? (
          <NoticeBox
            title="Tạo tài khoản thất bại"
            description="Vui lòng kiểm tra email, mật khẩu hoặc thử lại sau."
            tone="danger"
          />
        ) : null}
      </form>
    </AuthShell>
  );
}
