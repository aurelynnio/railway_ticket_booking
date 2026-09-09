import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="page-section space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-sm" />
        <Skeleton className="h-4 w-72 rounded-sm" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
