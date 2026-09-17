"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/http";

export interface NotificationRecord {
  id: string;
  userId: string | null;
  recipientEmail: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotificationsResponse {
  data: NotificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationsQuery {
  page?: number;
  limit?: number;
}

export function useMyNotifications(
  query: NotificationsQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["notifications-my", query],
    enabled,
    queryFn: async () => {
      const res = await instance.get<PaginatedNotificationsResponse>(
        "/notifications/my",
        { params: query },
      );
      return res.data;
    },
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    enabled,
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await instance.get<{ unreadCount: number }>(
        "/notifications/unread-count",
      );
      return res.data?.unreadCount ?? 0;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await instance.patch(`/notifications/${notificationId}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-my"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await instance.post("/notifications/read-all");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-my"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useBroadcastMarketing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      subject: string;
      body: string;
      voucherCode?: string;
      recipientEmails?: string[];
    }) => {
      const res = await instance.post("/notifications/admin/broadcast", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-all"] });
    },
  });
}

export function useAllNotifications(
  query: NotificationsQuery & { type?: string } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["notifications-all", query],
    enabled,
    queryFn: async () => {
      const res = await instance.get<PaginatedNotificationsResponse>(
        "/notifications",
        { params: query },
      );
      return res.data;
    },
  });
}
