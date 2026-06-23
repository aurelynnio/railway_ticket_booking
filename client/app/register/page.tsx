"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/auth.hook";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!username || !email || !password) return;

    register.mutate(
      { username, email, password },
      {
        onSuccess: () => {
          router.push("/login");
        },
      },
    );
  };

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
        <Field
          label="Username"
          value={username}
          placeholder="nguyen-van-a"
          onChange={setUsername}
          required
        />
        <Field
          label="Email"
          value={email}
          placeholder="ban@railway.test"
          onChange={setEmail}
          type="email"
          required
        />
        <Field
          label="Mật khẩu"
          value={password}
          placeholder="Tạo mật khẩu mới"
          onChange={setPassword}
          type="password"
          required
        />

        <Button
          type="submit"
          size="lg"
          disabled={register.isPending}
        >
          {register.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Sẵn sàng cho hồ sơ" tone="brand" />
          <StatusBadge label="Nối tiếp lịch sử đơn" tone="positive" />
        </div>

        {register.isError ? (
          <div className="rounded-lg bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground ring-1 ring-border">
            Tạo tài khoản thất bại. Vui lòng kiểm tra email, mật khẩu hoặc thử lại sau.
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "email";
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}
