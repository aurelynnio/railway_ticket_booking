import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card flex flex-col overflow-hidden rounded-lg text-sm text-card-foreground transition-colors duration-150",
  {
    variants: {
      variant: {
        outlined:
          "border border-border bg-card",
        elevated:
          "border border-border bg-card shadow-sm",
        flat: "border border-transparent bg-secondary",
        quiet: "border border-transparent bg-transparent",
      },
      padding: {
        none: "",
        sm: "p-4 gap-4",
        md: "p-5 gap-5",
        lg: "p-6 gap-6",
        xl: "p-8 gap-8",
      },
      interactive: {
        true: "cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:bg-muted/30 hover:shadow-sm",
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
        "@container/card-header grid auto-rows-min items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
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
        "font-display text-lg leading-tight font-semibold tracking-tight text-ink",
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
      className={cn("text-sm leading-relaxed text-ink-muted", className)}
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
      className={cn("flex-1", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-border bg-muted/30 -mt-2 -mx-5 mb-[-1.25rem] mt-auto px-5 py-3",
        "[.group\/card[data-padding=lg]_&]:-mx-6 [.group\/card[data-padding=lg]_&]:mb-[-1.5rem] [.group\/card[data-padding=lg]_&]:px-6 [.group\/card[data-padding=lg]_&]:py-4",
        "[.group\/card[data-padding=sm]_&]:-mx-4 [.group\/card[data-padding=sm]_&]:mb-[-1rem] [.group\/card[data-padding=sm]_&]:px-4 [.group\/card[data-padding=sm]_&]:py-2.5",
        "[.group\/card[data-padding=none]_&]:m-0 [.group\/card[data-padding=none]_&]:px-4 [.group\/card[data-padding=none]_&]:py-3",
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
