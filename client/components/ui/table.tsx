"use client"

import * as React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type TableDensity = "comfortable" | "dense"

const TableDensityContext = React.createContext<TableDensity>("comfortable")

function Table({
  className,
  density = "comfortable",
  ...props
}: React.ComponentProps<"table"> & { density?: TableDensity }) {
  return (
    <TableDensityContext.Provider value={density}>
      <Card
        data-slot="table-container"
        padding="none"
        className="relative w-full overflow-x-auto"
      >
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </Card>
    </TableDensityContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/55", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:nth-child(even)]:bg-muted/30", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/55 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:bg-muted/45 has-aria-expanded:bg-muted data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const density = React.useContext(TableDensityContext);
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-4 text-left align-middle text-xs font-medium uppercase tracking-wider whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        density === "dense" ? "h-9" : "h-11",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const density = React.useContext(TableDensityContext);
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        density === "dense" ? "py-2 text-[13px]" : "py-3.5",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
