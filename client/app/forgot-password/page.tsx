"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/auth.hook";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  async function handleSubmit() {
    const result = await forgotPassword.mutateAsync({ email });
    setTokenPreview(typeof result === "string" ? result : JSON.stringify(result));
  }

  return (
    <AppShell
      title="Forgot Password"
      description="Form nay goi POST /auth/forgotPassword. Backend hien tra reset token thang ve client."
    >
      <div className="mx-auto w-full max-w-xl">
        <Panel title="Lay reset token" description="Day la flow demo; backend hien tra token truc tiep thay vi gui email.">
          <div className="grid gap-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              type="button"
              disabled={forgotPassword.isPending || !email}
              onClick={() => void handleSubmit()}
            >
              {forgotPassword.isPending ? "Dang tao token..." : "Lay reset token"}
            </Button>
            {forgotPassword.isError ? (
              <p className="text-sm text-red-600">Khong tao duoc token. Kiem tra auth-service va email.</p>
            ) : null}
            {tokenPreview ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-medium">Reset token</p>
                <p className="mt-2 break-all font-mono text-xs">{tokenPreview}</p>
                <Link className="mt-3 inline-block text-amber-700 hover:underline" href="/reset-password">
                  Sang trang reset password
                </Link>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
