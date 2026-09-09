import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-lg bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-ink-subtle shadow-sm transition-all duration-200",
        "hover:shadow-md",
        "focus-visible:ring-4 focus-visible:ring-ring/10 focus-visible:shadow-md",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:ring-4 aria-invalid:ring-destructive/10",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
