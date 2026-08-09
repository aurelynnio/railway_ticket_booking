"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Shield, KeyRound, Mail, UserCog } from "lucide-react";

import { Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import {
  MetaGrid,
  NoticeBox,
  SectionHeading,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession, useChangePassword, useResendVerification, useRevokeAllSessions, useVerifyEmail } from "@/hooks/auth.hook";
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
  const sessionQuery = useAuthSession();
  const profileQuery = useMe(Boolean(sessionQuery.data));
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
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
    <>
      <Panel
        eyebrow="Tài khoản"
        title="Thông tin cá nhân"
        description="Xem và cập nhật thông tin hồ sơ, email và bảo mật tài khoản."
      >
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Nhận dạng"
            title="Thông tin phiên đăng nhập"
            description="Thông tin này được dùng để nối đơn hàng, vé và thanh toán với đúng tài khoản."
          />

          {profileQuery.data ? (
            <MetaGrid
              items={[
                { label: "User ID", value: <span className="mono tabular-nums">{sessionQuery.data?.userId ?? "N/A"}</span> },
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
                      ? <span className="mono">{profileQuery.data.email}</span>
                      : "N/A",
                },
                {
                  label: "Ngày tạo",
                  value: <span className="mono tabular-nums">{formatDateTime(
                    typeof profileQuery.data.createdAt === "string"
                      ? profileQuery.data.createdAt
                      : null,
                  )}</span>,
                },
                {
                  label: "Cập nhật lần cuối",
                  value: <span className="mono tabular-nums">{formatDateTime(
                    typeof profileQuery.data.updatedAt === "string"
                      ? profileQuery.data.updatedAt
                      : null,
                  )}</span>,
                },
                { label: "Vai trò", value: String(sessionQuery.data?.role ?? "N/A") },
              ]}
              columns={3}
            />
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          eyebrow="Cập nhật"
          title="Chỉnh sửa hồ sơ"
          description="Cập nhật username và email cơ bản."
        >
          <form
            className="space-y-4"
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
                type="email"
                placeholder="Email"
                aria-invalid={Boolean(profileForm.formState.errors.email)}
                {...profileForm.register("email")}
              />
            </FormField>
            <Button
              type="submit"
              disabled={!sessionQuery.data?.userId || updateProfile.isPending}
              className="gap-2"
            >
              <UserCog className="size-4" strokeWidth={1.75} />
              {updateProfile.isPending ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
            </Button>
            {updateProfile.isError ? (
              <NoticeBox
                title="Cập nhật thất bại"
                description="Vui lòng kiểm tra dữ liệu nhập và thử lại."
                tone="destructive"
              />
            ) : null}
            {updateProfile.isSuccess ? (
              <NoticeBox
                title="Đã cập nhật hồ sơ"
                description="Thông tin tài khoản đã được lưu thành công."
                tone="success"
              />
            ) : null}
          </form>
        </Panel>

        <Panel
          eyebrow="Bảo mật"
          title="Đổi mật khẩu"
          description="Đổi mật khẩu cho tài khoản đang đăng nhập."
        >
          <form
            className="space-y-4"
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
              className="gap-2"
            >
              <KeyRound className="size-4" strokeWidth={1.75} />
              {changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
            {changePassword.isSuccess ? (
              <NoticeBox
                title="Đổi mật khẩu thành công"
                description="Mật khẩu mới đã được áp dụng cho tài khoản hiện tại."
                tone="success"
              />
            ) : null}
            {changePassword.isError ? (
              <NoticeBox
                title="Đổi mật khẩu thất bại"
                description="Kiểm tra mật khẩu cũ và thử lại."
                tone="destructive"
              />
            ) : null}
          </form>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          eyebrow="Xác thực"
          title="Xác minh email"
          description="Xác minh email hoặc gửi lại email xác minh."
        >
          <div className="space-y-5">
            <form
              className="space-y-4"
              onSubmit={verifyForm.handleSubmit((values) =>
                verifyEmail.mutate(values),
              )}
            >
              <FormField
                label="Token xác minh"
                error={verifyForm.formState.errors.token?.message}
              >
                <Input
                  placeholder="Nhập token xác minh"
                  aria-invalid={Boolean(verifyForm.formState.errors.token)}
                  className="mono"
                  {...verifyForm.register("token")}
                />
              </FormField>
              <Button
                type="submit"
                variant="outline"
                disabled={verifyEmail.isPending}
                className="gap-2"
              >
                <Mail className="size-4" strokeWidth={1.75} />
                {verifyEmail.isPending ? "Đang xác minh..." : "Xác minh email"}
              </Button>
            </form>
            {verifyEmail.isSuccess ? (
              <NoticeBox
                title="Xác minh email thành công"
                description="Địa chỉ email đã được xác minh."
                tone="success"
              />
            ) : null}
            {verifyEmail.isError ? (
              <NoticeBox
                title="Xác minh thất bại"
                description="Token có thể đã hết hạn hoặc không hợp lệ."
                tone="destructive"
              />
            ) : null}

            <div className="soft-divider" />

            <div>
              <p className="mb-3 text-sm text-ink-muted">
                Gửi lại email xác minh nếu chưa nhận được.
              </p>
              <form
                className="space-y-4"
                onSubmit={resendForm.handleSubmit((values) =>
                  resendVerification.mutate(values),
                )}
              >
                <FormField
                  label="Email nhận xác minh"
                  error={resendForm.formState.errors.email?.message}
                >
                  <Input
                    type="email"
                    placeholder="Email nhận xác minh"
                    aria-invalid={Boolean(resendForm.formState.errors.email)}
                    {...resendForm.register("email")}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={resendVerification.isPending}
                  className="gap-2"
                >
                  <Mail className="size-4" strokeWidth={1.75} />
                  {resendVerification.isPending ? "Đang gửi..." : "Gửi lại xác minh"}
                </Button>
              </form>
              {resendVerification.isSuccess ? (
                <div className="mt-3">
                  <NoticeBox
                    title="Đã gửi email xác minh"
                    description="Kiểm tra hộp thư đến của bạn để tiếp tục xác minh."
                    tone="success"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Phiên"
          title="Quản lý phiên đăng nhập"
          description="Đăng xuất tất cả thiết bị đang sử dụng tài khoản này."
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Thu hồi tất cả phiên đăng nhập trên các thiết bị khác. Bạn sẽ cần đăng nhập lại trên các thiết bị đó.
            </p>
            <Button
              type="button"
              variant="destructive"
              disabled={revokeAllSessions.isPending}
              onClick={() => revokeAllSessions.mutate()}
              className="gap-2"
            >
              <Shield className="size-4" strokeWidth={1.75} />
              {revokeAllSessions.isPending ? "Đang thu hồi..." : "Đăng xuất tất cả thiết bị"}
            </Button>
            {revokeAllSessions.isSuccess ? (
              <NoticeBox
                title="Đã thu hồi tất cả phiên"
                description="Bạn cần đăng nhập lại trên các thiết bị đang sử dụng."
                tone="success"
              />
            ) : null}
            {revokeAllSessions.isError ? (
              <NoticeBox
                title="Thu hồi phiên thất bại"
                description="Vui lòng thử lại sau."
                tone="destructive"
              />
            ) : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
