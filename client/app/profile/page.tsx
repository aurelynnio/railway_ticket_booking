"use client";

import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SectionHeading, SurfaceLink } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function ProfilePage() {
  const sessionQuery = useAuthSession();
  const profileQuery = useMe(Boolean(sessionQuery.data));
  const updateProfile = useUpdateProfile();

  const [draftUsername, setDraftUsername] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);

  const username =
    draftUsername ??
    (typeof profileQuery.data?.username === "string" ? profileQuery.data.username : "");
  const email =
    draftEmail ??
    (typeof profileQuery.data?.email === "string" ? profileQuery.data.email : "");

  return (
    <AppShell
      title="Profile cockpit"
      description="Trung tam tai khoan dang dang nhap, doc session tu cookie HttpOnly va noi sang `GET/PATCH /users/me` de chinh sua thong tin co ban."
      actions={
        <div className="grid gap-3 md:grid-cols-3">
          <SurfaceLink
            href="/profile/orders"
            title="My orders"
            description="Danh sach order theo session hien tai."
          />
          <SurfaceLink
            href="/profile/tickets"
            title="Issued tickets"
            description="View ticket da issue duoc suy ra tu orders."
          />
          <SurfaceLink
            href="/login"
            title="Session routes"
            description="Chuyen sang login neu can reset hanh vi dang nhap."
          />
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Current session"
          description="Thong tin session va profile thuc te cua user dang dang nhap tren trinh duyet."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Identity"
              title={sessionQuery.data?.email ?? "Dang tai session"}
              description="Session path cua repo nay la `client -> api-gateway -> auth-service`, sau do profile tiep tuc doc `users-service`."
            />

            {profileQuery.data ? (
              <MetaGrid
                items={[
                  { label: "User ID", value: sessionQuery.data?.userId ?? "N/A" },
                  {
                    label: "Username",
                    value:
                      typeof profileQuery.data.username === "string"
                        ? profileQuery.data.username
                        : "N/A",
                  },
                  {
                    label: "Email",
                    value:
                      typeof profileQuery.data.email === "string"
                        ? profileQuery.data.email
                        : "N/A",
                  },
                  {
                    label: "Created",
                    value: formatDateTime(
                      typeof profileQuery.data.createdAt === "string"
                        ? profileQuery.data.createdAt
                        : null,
                    ),
                  },
                  {
                    label: "Updated",
                    value: formatDateTime(
                      typeof profileQuery.data.updatedAt === "string"
                        ? profileQuery.data.updatedAt
                        : null,
                    ),
                  },
                  { label: "Role", value: String(sessionQuery.data?.role ?? "N/A") },
                ]}
                columns={3}
              />
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Quick update"
          description="Cap nhat username va email co ban ngay trong shell nay."
        >
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
              {updateProfile.isPending ? "Dang cap nhat..." : "Cap nhat profile"}
            </Button>
            {updateProfile.isError ? (
              <p className="text-sm text-rose-700">
                Cap nhat that bai. Kiem tra schema payload cua `users-service`.
              </p>
            ) : null}
            {updateProfile.isSuccess ? (
              <p className="text-sm text-emerald-700">
                Da gui cap nhat profile thanh cong.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
