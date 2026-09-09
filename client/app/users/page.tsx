"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListUsers } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function UsersPage() {
  const query = useListUsers(1, 20);
  const users = query.data?.data ?? [];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink">Người dùng</h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl border border-border bg-card p-6"><Skeleton className="h-16 w-full" /></div>)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className="group">
                <Card variant="outlined" padding="lg" interactive>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                      {(u.email ?? "U")[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{u.username ?? u.email}</p>
                      <p className="truncate text-xs text-ink-muted">{u.email}</p>
                    </div>
                    <ArrowRight className="size-4 text-ink-subtle group-hover:text-primary" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
