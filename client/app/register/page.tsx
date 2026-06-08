"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/auth.hook";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    await register.mutateAsync({ username, email, password });
    router.push("/login");
  }

  return (
    <AppShell
      title="Register"
      description="Dang ky qua POST /auth/register. Sau khi tao tai khoan xong se chuyen sang trang login."
    >
      <div className="mx-auto w-full max-w-xl">
        <Panel title="Tao tai khoan" description="Auth-service hien yeu cau username, email va password.">
          <div className="grid gap-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
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
              disabled={register.isPending || !username || !email || !password}
              onClick={() => void handleRegister()}
            >
              {register.isPending ? "Dang tao tai khoan..." : "Dang ky"}
            </Button>
            {register.isError ? (
              <p className="text-sm text-red-600">Dang ky that bai. Co the email da ton tai hoac auth-service tra loi loi.</p>
            ) : null}
            <Link className="text-sm text-amber-700 hover:underline" href="/login">
              Da co tai khoan? Dang nhap
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
