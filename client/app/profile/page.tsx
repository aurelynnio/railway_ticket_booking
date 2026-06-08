"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function ProfilePage() {
  const sessionQuery = useAuthSession();
  const [draftUsername, setDraftUsername] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const profileQuery = useMe(Boolean(sessionQuery.data));
  const updateProfile = useUpdateProfile();
  const username =
    draftUsername ??
    (typeof profileQuery.data?.username === "string" ? profileQuery.data.username : "");
  const email =
    draftEmail ??
    (typeof profileQuery.data?.email === "string" ? profileQuery.data.email : "");

  return (
    <AppShell
      title="Profile"
      description="Trang nay doc session hien tai tu HttpOnly cookie va goi GET /users/me tren gateway."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500">
            {sessionQuery.data?.email ?? "Dang tai session..."}
          </span>
          <Link className="text-sm font-medium text-amber-700 hover:underline" href="/profile/orders">
            Xem orders
          </Link>
          <Link className="text-sm font-medium text-amber-700 hover:underline" href="/profile/tickets">
            Xem issued tickets
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="Thong tin user" description="GET /users/me voi user duoc suy ra tu access token cookie.">
          {sessionQuery.isLoading ? (
            <p className="text-sm text-zinc-600">Dang tai session...</p>
          ) : null}
          {sessionQuery.isError ? (
            <p className="text-sm text-red-600">Khong doc duoc session hien tai. Dang chuyen ve trang login.</p>
          ) : null}
          {profileQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai profile...</p> : null}
          {profileQuery.isError ? (
            <p className="text-sm text-red-600">Khong tim thay user. Kiem tra users-service va session hien tai.</p>
          ) : null}
          {profileQuery.data ? (
            <div className="grid gap-3 text-sm text-zinc-700">
              <p>ID: {profileQuery.data.id}</p>
              <p>Username: {typeof profileQuery.data.username === "string" ? profileQuery.data.username : "N/A"}</p>
              <p>Email: {typeof profileQuery.data.email === "string" ? profileQuery.data.email : "N/A"}</p>
              <p>Created at: {formatDateTime(typeof profileQuery.data.createdAt === "string" ? profileQuery.data.createdAt : null)}</p>
              <p>Updated at: {formatDateTime(typeof profileQuery.data.updatedAt === "string" ? profileQuery.data.updatedAt : null)}</p>
            </div>
          ) : null}
        </Panel>
        <Panel title="Cap nhat co ban" description="PATCH /users/me voi user duoc suy ra tu cookie session.">
          <div className="grid gap-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(event) => setDraftUsername(event.target.value)}
            />
            <Input
              placeholder="Email"
              value={email}
              onChange={(event) => setDraftEmail(event.target.value)}
            />
            <Button
              type="button"
              disabled={!sessionQuery.data?.userId || updateProfile.isPending}
              onClick={() =>
                updateProfile.mutate({
                  username: username || undefined,
                  email: email || undefined,
                })
              }
            >
              {updateProfile.isPending ? "Dang cap nhat..." : "Cap nhat"}
            </Button>
            {updateProfile.isError ? (
              <p className="text-sm text-red-600">Cap nhat that bai. Kiem tra payload user hien co duoc users-service chap nhan hay khong.</p>
            ) : null}
            {updateProfile.isSuccess ? (
              <p className="text-sm text-emerald-700">Da gui cap nhat profile thanh cong.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
