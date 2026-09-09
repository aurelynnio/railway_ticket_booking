import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active shadow-sm hover:shadow-md",
        gold:
          "bg-gold text-gold-foreground hover:bg-gold-hover shadow-sm",
        outline:
          "bg-card text-foreground hover:bg-muted shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-foreground hover:bg-surface-3",
        ghost:
          "bg-transparent text-ink-muted hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        "link-accent": "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default:
          "h-11 px-5 text-sm [&_svg]:size-4",
        xs: "h-8 px-3 text-xs rounded-md [&_svg]:size-3 gap-1",
        sm: "h-9 px-4 text-sm rounded-md [&_svg]:size-3.5 gap-1.5",
        lg: "h-12 px-7 text-base [&_svg]:size-4",
        xl: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
