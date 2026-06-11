"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  PaginationBar,
  SectionHeading,
  StatCard,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListUsers } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function UsersPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const query = useListUsers(page, 10);
  const users = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AppShell
      title={isAdminView ? "User operations" : "Users directory"}
      description="Danh ba user tu `users-service`, bo tri de support truy vet account, phan tich traffic va noi nhanh sang order/payment cua mot user."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Visible users"
          value={String(users.length)}
          helper="So account tren page hien tai."
        />
        <StatCard
          label="Newest update"
          value={users[0]?.updatedAt ? formatDateTime(users[0].updatedAt) : "N/A"}
          helper="Moc thoi gian cap nhat gan nhat trong viewport."
        />
        <StatCard
          label="Scope"
          value={isAdminView ? "Operations" : "Shared"}
          helper="View nay duoc dung chung cho public registry va admin namespace."
        />
      </div>

      <Panel
        title="Users table"
        description="Moi dong giu nhieu thong tin co ban, sau do detail page se noi them order va payment lien quan."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Identity" : "Directory"}
            title="Danh sach user"
            description="List view giu thong tin gon, uu tien link sang detail hon la dua het moi field len bang."
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{compactId(user.id)}</TableCell>
                  <TableCell>{user.name ?? user.username ?? "N/A"}</TableCell>
                  <TableCell>{user.email ?? "N/A"}</TableCell>
                  <TableCell>
                    {formatDateTime(
                      typeof user.updatedAt === "string" ? user.updatedAt : null,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${isAdminView ? "/admin/users" : "/users"}/${user.id}`}>
                        Chi tiet
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination ? (
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) =>
                  pagination.totalPages === 0
                    ? current
                    : Math.min(pagination.totalPages, current + 1),
                )
              }
            />
          ) : null}
        </div>
      </Panel>
    </AppShell>
  );
}
