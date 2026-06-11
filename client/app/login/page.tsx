"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth.hook";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthShell
      eyebrow="Đăng nhập"
      title="Đăng nhập để tiếp tục flow đặt vé"
      description="Trang login được đưa về đúng tinh thần của `vetau`: bên trái là form rõ ràng, bên phải là panel thông tin live. Session vẫn đi qua `api-gateway` và HttpOnly cookie như hiện tại."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Chưa có tài khoản?</span>
          <Link href="/register" className="font-semibold text-primary">
            Tạo tài khoản
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Email
          </p>
          <Input
            placeholder="ban@railway.test"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mật khẩu
            </p>
            <Link href="/forgot-password" className="text-sm font-medium text-primary">
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <Button
          type="button"
          size="lg"
          disabled={login.isPending}
          onClick={async () => {
            await login.mutateAsync({ email, password });
            router.push("/profile");
          }}
        >
          {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          <ArrowRight />
        </Button>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Cookie session" tone="brand" />
          <StatusBadge label="Gateway auth" tone="positive" />
        </div>

        {login.isError ? (
          <div className="rounded-[1.2rem] bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground ring-1 ring-border">
            Đăng nhập thất bại. Kiểm tra `auth-service`, gateway hoặc thông tin đăng nhập.
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
