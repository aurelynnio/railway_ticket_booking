"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Đã xảy ra lỗi
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Ứng dụng gặp sự cố không mong muốn. Bạn có thể thử lại hoặc quay về trang chủ.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-ink-muted">
          Mã lỗi: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
