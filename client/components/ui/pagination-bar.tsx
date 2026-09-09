import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  return (
    <nav aria-label="Phân trang">
      <Card
        variant="flat"
        padding="md"
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <p className="text-sm text-ink-muted tabular-nums">
          Trang {page}/{Math.max(1, totalPages)}. Tổng {total} bản ghi.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={onPrev}>
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={onNext}
          >
            Sau
          </Button>
        </div>
      </Card>
    </nav>
  );
}
