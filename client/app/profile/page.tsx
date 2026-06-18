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
      title="Hồ sơ cá nhân"
      description="Quản lý thông tin tài khoản đang đăng nhập và mở nhanh đơn hàng hoặc vé đã phát hành."
      actions={
        <div className="grid gap-3 md:grid-cols-3">
          <SurfaceLink
            href="/profile/orders"
            title="Đơn của tôi"
            description="Danh sách đơn hàng theo tài khoản hiện tại."
          />
          <SurfaceLink
            href="/profile/tickets"
            title="Vé đã phát hành"
            description="Các vé đã được phát hành từ đơn hàng hoàn tất."
          />
          <SurfaceLink
            href="/login"
            title="Đăng nhập lại"
            description="Chuyển sang đăng nhập khi cần làm mới phiên."
          />
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Current session"
          description="Thông tin phiên đăng nhập và hồ sơ hiện tại."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Identity"
              title={sessionQuery.data?.email ?? "Đang tải session"}
              description="Thông tin này được dùng để nối đơn hàng, vé và thanh toán với đúng tài khoản."
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
          description="Cập nhật username và email cơ bản."
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
              {updateProfile.isPending ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
            </Button>
            {updateProfile.isError ? (
              <p className="text-sm text-rose-700">
                Cập nhật thất bại. Vui lòng kiểm tra dữ liệu nhập và thử lại.
              </p>
            ) : null}
            {updateProfile.isSuccess ? (
              <p className="text-sm text-emerald-700">
                Đã gửi cập nhật hồ sơ thành công.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
