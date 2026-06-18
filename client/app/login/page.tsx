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
      description="Session được bảo vệ bằng HttpOnly cookie qua gateway, giúp bạn đặt vé, xem đơn hàng và quay lại thanh toán mà không cần lưu token trong trình duyệt."
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
          <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
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
            <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
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
            Đăng nhập thất bại. Vui lòng kiểm tra email, mật khẩu hoặc thử lại sau.
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
