import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-12 w-full rounded-[1rem] bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border transition-all outline-none focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/55 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
