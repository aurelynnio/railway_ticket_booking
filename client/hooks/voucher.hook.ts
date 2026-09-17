"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/http";

export interface VoucherItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateVoucherPayload {
  code: string;
  orderAmount: number;
  userId?: string;
}

export interface ValidateVoucherResult {
  isValid: boolean;
  voucherId?: string;
  code: string;
  title?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export interface CreateVoucherPayload {
  code: string;
  title: string;
  description?: string;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  validFrom?: string;
  validTo: string;
  isActive?: boolean;
}

export interface UpdateVoucherPayload {
  title?: string;
  description?: string;
  discountType?: "PERCENT" | "FIXED_AMOUNT";
  discountValue?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface AdminVouchersQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedVouchersResponse {
  data: VoucherItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useValidateVoucher() {
  return useMutation({
    mutationFn: async (payload: ValidateVoucherPayload): Promise<ValidateVoucherResult> => {
      const res = await instance.post<ValidateVoucherResult>(
        "/vouchers/validate",
        payload,
      );
      return res.data;
    },
  });
}

export function useAvailableVouchers() {
  return useQuery({
    queryKey: ["vouchers-available"],
    queryFn: async (): Promise<VoucherItem[]> => {
      const res = await instance.get<VoucherItem[]>("/vouchers/available");
      return res.data;
    },
  });
}

export function useAdminVouchers(query: AdminVouchersQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["admin-vouchers", query],
    enabled,
    queryFn: async (): Promise<PaginatedVouchersResponse> => {
      const res = await instance.get<PaginatedVouchersResponse>(
        "/admin/vouchers",
        { params: query },
      );
      return res.data;
    },
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateVoucherPayload) => {
      const res = await instance.post("/admin/vouchers", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers-available"] });
    },
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateVoucherPayload }) => {
      const res = await instance.patch(`/admin/vouchers/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers-available"] });
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await instance.delete(`/admin/vouchers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers-available"] });
    },
  });
}

