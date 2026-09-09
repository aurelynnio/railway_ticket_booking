import Link from "next/link";
import { TrainFront, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full border border-border bg-primary-soft text-primary">
        <TrainFront className="size-8" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        404
      </h1>
      <p className="mt-2 font-display text-xl font-semibold text-ink">
        Không tìm thấy trang
      </p>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Trang bạn đang tìm có thể đã bị di chuyển, đổi tên hoặc tạm thời không khả dụng.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">
            <Search className="size-4" />
            Tìm chuyến tàu
          </Link>
        </Button>
      </div>
    </div>
  );
}
