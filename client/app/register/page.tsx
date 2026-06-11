"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

  return (
    <AuthShell
      eyebrow="Tạo tài khoản"
      title="Tạo tài khoản mới để giữ booking theo người dùng"
      description="Register page được đổi bố cục giống `vetau`: form chính ở bên trái, khung thông tin hỗ trợ ở bên phải, giúp auth pages không còn cảm giác utility page."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Đã có tài khoản?</span>
          <Link href="/login" className="font-semibold text-primary">
            Quay về đăng nhập
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <Field
          label="Username"
          value={username}
          placeholder="nguyen-van-a"
          onChange={setUsername}
        />
        <Field
          label="Email"
          value={email}
          placeholder="ban@railway.test"
          onChange={setEmail}
        />
        <Field
          label="Mật khẩu"
          value={password}
          placeholder="Tạo mật khẩu mới"
          onChange={setPassword}
          type="password"
        />

        <Button
          type="button"
          size="lg"
          disabled={register.isPending}
          onClick={async () => {
            await register.mutateAsync({ username, email, password });
            router.push("/login");
          }}
        >
          {register.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Sẵn sàng cho hồ sơ" tone="brand" />
          <StatusBadge label="Nối tiếp lịch sử đơn" tone="positive" />
        </div>

        {register.isError ? (
          <div className="rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground ring-1 ring-border">
            Tạo tài khoản thất bại. Kiểm tra `auth-service` hoặc dữ liệu đầu vào.
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
}) {
  return (
    <div className="grid gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
