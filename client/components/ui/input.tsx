import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[1rem] bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border transition-all outline-none placeholder:text-muted-foreground/90 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/55 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Input }
