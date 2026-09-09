import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-ink-subtle shadow-sm transition-all duration-200",
        "hover:shadow-md",
        "focus-visible:ring-4 focus-visible:ring-ring/10 focus-visible:shadow-md",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:ring-4 aria-invalid:ring-destructive/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
