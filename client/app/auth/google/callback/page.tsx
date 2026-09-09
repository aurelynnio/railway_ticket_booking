"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useGoogleCallback } from "@/hooks/auth.hook";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const mutation = useGoogleCallback();

  useEffect(() => {
    if (code) {
      mutation.mutate(
        code,
        {
          onSuccess: () => router.push("/profile"),
          onError: () => router.push("/login"),
        }
      );
    }
  }, [code, mutation, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-ink-muted">Đang đăng nhập...</p>
      </div>
    </div>
  );
}
