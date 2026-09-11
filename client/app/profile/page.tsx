"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Ticket,
  ShoppingCart,
  Bell,
  ChevronRight,
  Shield,
  KeyRound,
  LogOut,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAuthSession,
  useChangePassword,
  useResendVerification,
  useRevokeAllSessions,
} from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const profileSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: passwordField,
});

export default function ProfilePage() {
  const session = useAuthSession();
  const profile = useMe(Boolean(session.data));
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const resendVerification = useResendVerification();
  const revokeAll = useRevokeAllSessions();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (profile.data) {
      profileForm.reset({
        username: profile.data.username ?? "",
        email: profile.data.email ?? "",
      });
    }
  }, [profile.data, profileForm]);

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tài khoản
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Hồ sơ của tôi
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card variant="outlined" padding="lg" className="text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                {(session.data?.email || "U")[0].toUpperCase()}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {profile.data?.username ?? session.data?.email ?? "User"}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {profile.data?.email ?? session.data?.email}
              </p>
              <Badge
                variant={profile.data?.emailVerified ? "success" : "warning"}
                className="mt-3"
              >
                {profile.data?.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </Card>

            <nav className="space-y-1">
              {[
                { href: "/profile", label: "Hồ sơ", icon: User },
                { href: "/profile/orders", label: "Đơn hàng", icon: ShoppingCart },
                { href: "/profile/tickets", label: "Vé của tôi", icon: Ticket },
                { href: "/profile/notifications", label: "Thông báo", icon: Bell },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink"
                >
                  <item.icon className="size-4" />
                  {item.label}
                  <ChevronRight className="ml-auto size-4" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Content */}
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="size-3.5" />
                Hồ sơ
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="size-3.5" />
                Bảo mật
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Thông tin cá nhân
                </h3>
                <form
                  className="mt-6 space-y-5"
                  onSubmit={profileForm.handleSubmit((values) =>
                    updateProfile.mutate(values)
                  )}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        aria-invalid={Boolean(profileForm.formState.errors.username)}
                        {...profileForm.register("username")}
                      />
                      {profileForm.formState.errors.username?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        aria-invalid={Boolean(profileForm.formState.errors.email)}
                        {...profileForm.register("email")}
                      />
                      {profileForm.formState.errors.email?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="accent"
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    {!profile.data?.emailVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resendVerification.mutate({ email: profile.data?.email ?? "" })}
                        disabled={resendVerification.isPending}
                      >
                        Gửi lại xác minh
                      </Button>
                    )}
                  </div>
                </form>

                <div className="mt-8 border-t border-border pt-6">
                  <h4 className="text-sm font-semibold text-ink">Thông tin tài khoản</h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-4 text-ink-muted" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                          Ngày tham gia
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {formatDateTime(profile.data?.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="size-4 text-ink-muted" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                          Trạng thái
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {profile.data?.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Đổi mật khẩu
                </h3>
                <form
                  className="mt-6 space-y-5"
                  onSubmit={passwordForm.handleSubmit((values) =>
                    changePassword.mutate(values)
                  )}
                >
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      aria-invalid={Boolean(passwordForm.formState.errors.oldPassword)}
                      {...passwordForm.register("oldPassword")}
                    />
                    {passwordForm.formState.errors.oldPassword?.message && (
                      <p className="text-xs font-medium text-destructive">
                        {passwordForm.formState.errors.oldPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword?.message && (
                      <p className="text-xs font-medium text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={changePassword.isPending}
                  >
                    <KeyRound className="size-4" />
                    {changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
                  </Button>
                </form>
              </Card>

              <Card variant="outlined" padding="lg" className="mt-6">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Phiên đăng nhập
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Thu hồi toàn bộ phiên đăng nhập trên các thiết bị. Bạn sẽ phải
                  đăng nhập lại trên mọi thiết bị.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  disabled={revokeAll.isPending}
                  onClick={() => setConfirmRevoke(true)}
                >
                  <LogOut className="size-4" />
                  {revokeAll.isPending ? "Đang thu hồi..." : "Thu hồi tất cả phiên"}
                </Button>
              </Card>

              <ConfirmDialog
                open={confirmRevoke}
                onOpenChange={setConfirmRevoke}
                title="Thu hồi tất cả phiên đăng nhập?"
                description="Mọi thiết bị đang đăng nhập sẽ bị đăng xuất, bao gồm cả thiết bị hiện tại."
                confirmLabel="Thu hồi"
                confirmPending={revokeAll.isPending}
                requireAck
                onConfirm={() => revokeAll.mutate(undefined, {
                  onSuccess: () => setConfirmRevoke(false),
                })}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
