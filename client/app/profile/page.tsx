"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import {
  MetaGrid,
  NoticeBox,
  SectionHeading,
  SurfaceLink,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAuthSession,
  useChangePassword,
  useLogout,
  useResendVerification,
  useRevokeAllSessions,
  useVerifyEmail,
} from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const profileSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: passwordField,
});

const verifyEmailSchema = z.object({
  token: requiredText("Token xác minh"),
});

const resendVerificationSchema = z.object({
  email: emailField,
});

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

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });
  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });
  const verifyForm = useForm<z.infer<typeof verifyEmailSchema>>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: "",
    },
  });
  const resendForm = useForm<z.infer<typeof resendVerificationSchema>>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    profileForm.reset({
      username:
        typeof profileQuery.data?.username === "string" ? profileQuery.data.username : "",
      email:
        typeof profileQuery.data?.email === "string" ? profileQuery.data.email : "",
    });
  }, [profileForm, profileQuery.data?.email, profileQuery.data?.username]);

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
            className="block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => {
                  router.push("/login");
                },
              })
            }
          >
            <Card interactive className="px-5 py-5 text-left">
              <p className="text-xs font-medium text-muted-foreground">
                Phiên
              </p>
              <p className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
                {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Xoá cookie phiên hiện tại và quay về đăng nhập.
              </p>
            </Card>
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
          <form
            className="grid gap-3"
            onSubmit={profileForm.handleSubmit((values) =>
              updateProfile.mutate(values),
            )}
          >
            <FormField
              label="Username"
              error={profileForm.formState.errors.username?.message}
            >
              <Input
                placeholder="Username"
                aria-invalid={Boolean(profileForm.formState.errors.username)}
                {...profileForm.register("username")}
              />
            </FormField>
            <FormField
              label="Email"
              error={profileForm.formState.errors.email?.message}
            >
              <Input
                placeholder="Email"
                aria-invalid={Boolean(profileForm.formState.errors.email)}
                {...profileForm.register("email")}
              />
            </FormField>
            <Button
              type="submit"
              disabled={!sessionQuery.data?.userId || updateProfile.isPending}
            >
              {updateProfile.isPending ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
            </Button>
            {updateProfile.isError ? (
              <NoticeBox
                title="Cập nhật thất bại"
                description="Vui lòng kiểm tra dữ liệu nhập và thử lại."
                tone="danger"
              />
            ) : null}
            {updateProfile.isSuccess ? (
              <NoticeBox
                title="Đã gửi cập nhật hồ sơ"
                description="Thông tin tài khoản đã được lưu thành công."
                tone="positive"
              />
            ) : null}
          </form>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Đổi mật khẩu"
          description="Đổi mật khẩu cho tài khoản đang đăng nhập."
        >
          <form
            className="grid gap-3"
            onSubmit={passwordForm.handleSubmit((values) =>
              changePassword.mutate({
                oldPassword: values.oldPassword || undefined,
                newPassword: values.newPassword,
              }),
            )}
          >
            <FormField
              label="Mật khẩu cũ"
              error={passwordForm.formState.errors.oldPassword?.message}
            >
              <Input
                type="password"
                placeholder="Mật khẩu cũ"
                aria-invalid={Boolean(passwordForm.formState.errors.oldPassword)}
                {...passwordForm.register("oldPassword")}
              />
            </FormField>
            <FormField
              label="Mật khẩu mới"
              error={passwordForm.formState.errors.newPassword?.message}
            >
              <Input
                type="password"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                {...passwordForm.register("newPassword")}
              />
            </FormField>
            <Button
              type="submit"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
            {changePassword.isSuccess ? (
              <NoticeBox
                title="Đổi mật khẩu thành công"
                description="Mật khẩu mới đã được áp dụng cho tài khoản hiện tại."
                tone="positive"
              />
            ) : null}
            {changePassword.isError ? (
              <NoticeBox
                title="Đổi mật khẩu thất bại"
                description="Kiểm tra mật khẩu cũ và thử lại."
                tone="danger"
              />
            ) : null}
          </form>
        </Panel>

        <Panel
          title="Email verification"
          description="Xác minh email hoặc gửi lại email xác minh."
        >
          <div className="grid gap-3">
            <form
              className="grid gap-3"
              onSubmit={verifyForm.handleSubmit((values) =>
                verifyEmail.mutate(values),
              )}
            >
              <FormField
                label="Token xác minh"
                error={verifyForm.formState.errors.token?.message}
              >
                <Input
                  placeholder="Token xác minh"
                  aria-invalid={Boolean(verifyForm.formState.errors.token)}
                  {...verifyForm.register("token")}
                />
              </FormField>
              <Button
                type="submit"
                variant="outline"
                disabled={verifyEmail.isPending}
              >
                {verifyEmail.isPending ? "Đang xác minh..." : "Xác minh email"}
              </Button>
            </form>
            {verifyEmail.isSuccess ? (
              <NoticeBox
                title="Xác minh email thành công"
                description="Địa chỉ email đã được xác minh."
                tone="positive"
              />
            ) : null}
            {verifyEmail.isError ? (
              <NoticeBox
                title="Xác minh thất bại"
                description="Token có thể đã hết hạn hoặc không hợp lệ."
                tone="danger"
              />
            ) : null}

            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-sm text-muted-foreground">
                Gửi lại email xác minh nếu chưa nhận được.
              </p>
              <form
                className="grid gap-3"
                onSubmit={resendForm.handleSubmit((values) =>
                  resendVerification.mutate(values),
                )}
              >
                <FormField
                  label="Email nhận xác minh"
                  error={resendForm.formState.errors.email?.message}
                >
                  <Input
                    placeholder="Email nhận xác minh"
                    aria-invalid={Boolean(resendForm.formState.errors.email)}
                    {...resendForm.register("email")}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={resendVerification.isPending}
                >
                  {resendVerification.isPending ? "Đang gửi..." : "Gửi lại xác minh"}
                </Button>
              </form>
              {resendVerification.isSuccess ? (
                <NoticeBox
                  title="Đã gửi email xác minh"
                  description="Kiểm tra hộp thư đến của bạn để tiếp tục xác minh."
                  tone="positive"
                />
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
            <div className="mt-3">
              <NoticeBox
                title="Đã thu hồi tất cả phiên"
                description="Bạn cần đăng nhập lại trên các thiết bị đang sử dụng."
                tone="positive"
              />
            </div>
          ) : null}
          {revokeAllSessions.isError ? (
            <div className="mt-3">
              <NoticeBox
                title="Thu hồi phiên thất bại"
                description="Vui lòng thử lại sau."
                tone="danger"
              />
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
