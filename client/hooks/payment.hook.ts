"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CancelPaymentRequest,
  CreatePaymentRequest,
  ExpirePaymentRequest,
  ListPaymentsByUserIdRequest,
  ListPaymentsQuery,
  MarkFailedRequest,
  PaymentMarkedPaidResponse,
  MarkPaidRequest,
  MarkProcessingRequest,
  PaginatedPaymentsResponse,
  PaymentDto,
} from "@/lib/api-types";
import instance from "@/lib/http";

function invalidatePaymentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  payment?: PaymentDto | null,
) {
  void queryClient.invalidateQueries({ queryKey: ["payments"] });

  if (payment?.id) {
    void queryClient.invalidateQueries({
      queryKey: ["payment", payment.id],
    });
  }

  if (payment?.transactionId) {
    void queryClient.invalidateQueries({
      queryKey: ["payment-transaction", payment.transactionId],
    });
  }

  if (payment?.orderId) {
    void queryClient.invalidateQueries({
      queryKey: ["payments", "order", payment.orderId],
    });
  }

  if (payment?.userId) {
    void queryClient.invalidateQueries({
      queryKey: ["payments", "user", payment.userId],
    });
  }
}

export function usePayments(query: ListPaymentsQuery, enabled = true) {
  return useQuery({
    queryKey: ["payments", query],
    enabled,
    queryFn: async () => {
      const res = await instance.get<PaginatedPaymentsResponse>("/payments", {
        params: query,
      });
      return res.data;
    },
  });
}

export function usePayment(paymentId?: string) {
  return useQuery({
    queryKey: ["payment", paymentId],
    enabled: Boolean(paymentId),
    queryFn: async () => {
      const res = await instance.get<PaymentDto>(`/payments/${paymentId}`);
      return res.data;
    },
  });
}

export function usePaymentByTransactionId(transactionId?: string) {
  return useQuery({
    queryKey: ["payment-transaction", transactionId],
    enabled: Boolean(transactionId),
    queryFn: async () => {
      const res = await instance.get<PaymentDto>(
        `/payments/transaction/${transactionId}`,
      );
      return res.data;
    },
  });
}

export function usePaymentsByOrderId(orderId?: string, enabled = true) {
  return useQuery({
    queryKey: ["payments", "order", orderId],
    enabled: enabled && Boolean(orderId),
    queryFn: async () => {
      const res = await instance.get<PaymentDto[]>(
        `/payments/order/${orderId}`,
      );
      return res.data;
    },
  });
}

export function usePaymentsByUserId(
  query: ListPaymentsByUserIdRequest,
  enabled = true,
) {
  const { userId, ...pagination } = query;

  return useQuery({
    queryKey: ["payments", "user", userId, pagination],
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const res = await instance.get<PaginatedPaymentsResponse>(
        `/payments/user/${userId}`,
        {
          params: pagination,
        },
      );
      return res.data;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePaymentRequest) => {
      const res = await instance.post<PaymentDto>("/payments", payload);
      return res.data;
    },
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment);
    },
  });
}

function usePaymentAction<TPayload>(path: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const res = await instance.post<PaymentDto>(path, payload);
      return res.data;
    },
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment);
    },
  });
}

export function useMarkPaymentProcessing() {
  return usePaymentAction<MarkProcessingRequest>("/payments/mark-processing");
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MarkPaidRequest) => {
      const res = await instance.post<PaymentMarkedPaidResponse>(
        "/payments/mark-paid",
        payload,
      );
      return res.data;
    },
    onSuccess: (result) => {
      invalidatePaymentQueries(queryClient, result.payment);
      void queryClient.invalidateQueries({
        queryKey: ["order", result.payment.orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["order-summary", result.payment.orderId],
      });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useMarkPaymentFailed() {
  return usePaymentAction<MarkFailedRequest>("/payments/mark-failed");
}

export function useCancelPayment() {
  return usePaymentAction<CancelPaymentRequest>("/payments/cancel");
}

export function useExpirePayment() {
  return usePaymentAction<ExpirePaymentRequest>("/payments/expire");
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await instance.delete<PaymentDto>(`/payments/${id}`);
      return res.data;
    },
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment);
    },
  });
}

// ===== VNPay =====

export interface CreateVnpayPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
}

export interface CreateVnpayPaymentResponse {
  paymentUrl: string;
  paymentId: string;
  transactionId: string;
}

export function useCreateVnpayPayment() {
  return useMutation({
    mutationFn: async (payload: CreateVnpayPaymentRequest) => {
      const res = await instance.post<CreateVnpayPaymentResponse>(
        "/payments/vnpay/create",
        payload,
      );
      return res.data;
    },
  });
}
