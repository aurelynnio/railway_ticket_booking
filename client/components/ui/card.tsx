import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg py-(--card-spacing) text-sm text-card-foreground transition-colors",
  {
    variants: {
      variant: {
        outlined:
          "border border-border bg-card has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        elevated:
          "border border-border bg-card shadow-sm has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        flat: "border border-transparent bg-secondary has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        quiet: "border border-transparent bg-transparent",
      },
      padding: {
        none: "[--card-spacing:--spacing(0)]",
        sm: "[--card-spacing:--spacing(3.5)]",
        md: "[--card-spacing:--spacing(5)]",
        lg: "[--card-spacing:--spacing(6)]",
      },
      interactive: {
        true: "cursor-pointer hover:border-ink-muted hover:bg-muted/40",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outlined",
      padding: "md",
      interactive: false,
    },
  },
);

function Card({
  className,
  variant,
  padding,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-padding={padding}
      className={cn(cardVariants({ variant, padding, interactive, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-1.5 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg leading-snug font-semibold tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-6 text-ink-muted", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-md bg-secondary/60 p-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
