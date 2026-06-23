"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SectionHeading, SurfaceLink } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession, useChangePassword, useLogout, useRevokeAllSessions, useVerifyEmail, useResendVerification } from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function ProfilePage() {
  const router = useRouter();
  const sessionQuery = useAuthSession();
  const profileQuery = useMe(Boolean(sessionQuery.data));
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logout = useLogout();
  const revokeAllSessions = useRevokeAllSessions();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();

  const [draftUsername, setDraftUsername] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyEmailAddr, setVerifyEmailAddr] = useState("");

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
          <button
            type="button"
            className="surface-panel block rounded-lg px-5 py-5 text-left transition-colors hover:bg-muted/50"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => {
                  router.push("/login");
                },
              })
            }
          >
            <p className="text-xs font-medium text-muted-foreground">
              Phiên
            </p>
            <p className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
              {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Xoá cookie phiên hiện tại và quay về đăng nhập.
            </p>
          </button>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Đổi mật khẩu"
          description="Đổi mật khẩu cho tài khoản đang đăng nhập."
        >
          <div className="grid gap-3">
            <Input
              type="password"
              placeholder="Mật khẩu cũ"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button
              type="button"
              disabled={!newPassword || changePassword.isPending}
              onClick={() =>
                changePassword.mutate({
                  oldPassword: oldPassword || undefined,
                  newPassword,
                })
              }
            >
              {changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
            {changePassword.isSuccess ? (
              <p className="text-sm text-emerald-700">Đổi mật khẩu thành công.</p>
            ) : null}
            {changePassword.isError ? (
              <p className="text-sm text-rose-700">
                Đổi mật khẩu thất bại. Kiểm tra mật khẩu cũ và thử lại.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Email verification"
          description="Xác minh email hoặc gửi lại email xác minh."
        >
          <div className="grid gap-3">
            <Input
              placeholder="Token xác minh"
              value={verifyToken}
              onChange={(event) => setVerifyToken(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!verifyToken || verifyEmail.isPending}
              onClick={() => verifyEmail.mutate({ token: verifyToken })}
            >
              {verifyEmail.isPending ? "Đang xác minh..." : "Xác minh email"}
            </Button>
            {verifyEmail.isSuccess ? (
              <p className="text-sm text-emerald-700">Xác minh email thành công.</p>
            ) : null}
            {verifyEmail.isError ? (
              <p className="text-sm text-rose-700">Xác minh thất bại. Token có thể đã hết hạn.</p>
            ) : null}

            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-sm text-muted-foreground">
                Gửi lại email xác minh nếu chưa nhận được.
              </p>
              <Input
                placeholder="Email nhận xác minh"
                value={verifyEmailAddr}
                onChange={(event) => setVerifyEmailAddr(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={!verifyEmailAddr || resendVerification.isPending}
                onClick={() => resendVerification.mutate({ email: verifyEmailAddr })}
              >
                {resendVerification.isPending ? "Đang gửi..." : "Gửi lại xác minh"}
              </Button>
              {resendVerification.isSuccess ? (
                <p className="mt-1 text-sm text-emerald-700">Đã gửi email xác minh.</p>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Quản lý phiên"
          description="Đăng xuất tất cả thiết bị đang sử dụng tài khoản này."
        >
          <Button
            type="button"
            variant="destructive"
            disabled={revokeAllSessions.isPending}
            onClick={() => revokeAllSessions.mutate()}
          >
            {revokeAllSessions.isPending ? "Đang thu hồi..." : "Đăng xuất tất cả thiết bị"}
          </Button>
          {revokeAllSessions.isSuccess ? (
            <p className="mt-2 text-sm text-emerald-700">
              Đã đăng xuất tất cả thiết bị. Bạn cần đăng nhập lại.
            </p>
          ) : null}
          {revokeAllSessions.isError ? (
            <p className="mt-2 text-sm text-rose-700">
              Thu hồi phiên thất bại. Vui lòng thử lại.
            </p>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
