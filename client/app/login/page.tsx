"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth.hook";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    await login.mutateAsync({ email, password });
    router.push("/profile");
  }

  return (
    <AppShell
      title="Login"
      description="Dang nhap qua POST /auth/login. Gateway se set HttpOnly cookie de session duoc giu tren browser."
    >
      <div className="mx-auto w-full max-w-xl">
        <Panel title="Dang nhap" description="Sau khi login thanh cong, trang profile se doc session tu cookie thay vi giu token phia client.">
          <div className="grid gap-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="button"
              disabled={login.isPending || !email || !password}
              onClick={() => void handleLogin()}
            >
              {login.isPending ? "Dang dang nhap..." : "Dang nhap"}
            </Button>
            {login.isError ? (
              <p className="text-sm text-red-600">Dang nhap that bai. Kiem tra email/password va auth-service.</p>
            ) : null}
            <div className="flex gap-4 text-sm">
              <Link className="text-amber-700 hover:underline" href="/register">
                Tao tai khoan
              </Link>
              <Link className="text-amber-700 hover:underline" href="/forgot-password">
                Quen mat khau
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
