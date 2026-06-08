"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/auth.hook";

export default function ResetPasswordPage() {
  const resetPassword = useResetPassword();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit() {
    await resetPassword.mutateAsync({
      token,
      newPassword,
    });
  }

  return (
    <AppShell
      title="Reset Password"
      description="Form nay goi POST /auth/resetPassword voi token backend tra ve o buoc forgot password."
    >
      <div className="mx-auto w-full max-w-xl">
        <Panel title="Doi mat khau" description="Neu backend nhan token hop le, mat khau moi se duoc cap nhat.">
          <div className="grid gap-3">
            <Input
              placeholder="Reset token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button
              type="button"
              disabled={resetPassword.isPending || !token || !newPassword}
              onClick={() => void handleSubmit()}
            >
              {resetPassword.isPending ? "Dang reset..." : "Reset password"}
            </Button>
            {resetPassword.isError ? (
              <p className="text-sm text-red-600">Reset password that bai. Co the token het han hoac backend dang loi.</p>
            ) : null}
            {resetPassword.isSuccess ? (
              <div className="text-sm text-emerald-700">
                Reset password thanh cong.{" "}
                <Link className="font-medium underline" href="/login">
                  Sang trang login
                </Link>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
