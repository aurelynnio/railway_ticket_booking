"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleCallback } from "@/hooks/auth.hook";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleCallback = useGoogleCallback();
  const attemptedCode = useRef<string | null>(null);
  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      return;
    }

    if (attemptedCode.current === code) {
      return;
    }

    attemptedCode.current = code;
    let active = true;

    void googleCallback
      .mutateAsync(code)
      .then(() => {
        if (active) {
          router.replace("/");
        }
      })
      .catch(() => {
        // The mutation state renders a safe, user-facing error below.
      });

    return () => {
      active = false;
    };
  }, [code, googleCallback, router]);

  const hasError = !code || googleCallback.isError;

  return (
    <AppShell
      title={hasError ? "Không thể đăng nhập Google" : "Đang hoàn tất đăng nhập"}
      description={
        hasError
          ? "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn."
          : "Hệ thống đang xác thực tài khoản Google của bạn."
      }
    >
      <div className="mx-auto max-w-lg">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
            {hasError ? (
              <AlertCircle className="size-10 text-destructive" strokeWidth={1.5} />
            ) : (
              <LoaderCircle
                className="size-10 animate-spin text-primary"
                aria-label="Đang xác thực đăng nhập Google"
                strokeWidth={1.5}
              />
            )}

            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                {hasError ? "Đăng nhập chưa hoàn tất" : "Đang xác thực"}
              </h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                {hasError
                  ? "Hãy thử đăng nhập lại. Nếu lỗi tiếp diễn, hãy liên hệ quản trị viên để kiểm tra cấu hình Google OAuth."
                  : "Vui lòng chờ trong giây lát, không đóng trang này."}
              </p>
            </div>

            {hasError ? (
              <Button asChild size="lg">
                <Link href="/login">Quay lại đăng nhập</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}
