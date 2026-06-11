import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full rounded-[1.3rem] bg-white/78 px-4 py-3 text-sm text-foreground ring-1 ring-black/8 transition-all outline-none placeholder:text-muted-foreground/90 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-ring/55 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/45 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
