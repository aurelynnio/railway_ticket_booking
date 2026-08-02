"use client";

import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/http";

export interface NotificationRecord {
  id: string;
  userId: string | null;
  recipientEmail: string;
  type: string;
  subject: string;
  body: string;
  status: string;
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

export function useNotificationById(id: string, enabled = true) {
  return useQuery({
    queryKey: ["notification", id],
    enabled,
    queryFn: async () => {
      const res = await instance.get(`/notifications/${id}`);
      return res.data;
    },
  });
}
