"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  OrderCheckoutResponse,
  OrderResponse,
  OrderSummaryResponse,
  PaginatedResponse,
} from "@/lib/api-types";
import instance from "@/lib/http";

export interface OrderPassengerPayload {
  fullName: string;
  passengerType: string;
  identityNumber?: string | null;
  phoneNumber?: string | null;
}

export interface CreateOrderPayload {
  userId: string;
  ticketItemId: string;
  ticketId: string;
  ticketTitle: string;
  trainNumber?: string | null;
  departureStationCode?: string | null;
  departureStationName?: string | null;
  arrivalStationCode?: string | null;
  arrivalStationName?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  coachCode?: string | null;
  seatClass?: string | null;
  seatType?: string | null;
  quantity: number;
  unitPrice: number;
  paymentMethod?: string;
  seatLabels?: string[];
  passengers?: OrderPassengerPayload[];
}

export interface OrdersQuery {
  page?: number;
  limit?: number;
  userId?: string;
  status?: number;
  ticketId?: string;
}

export function useOrders(query: OrdersQuery, enabled = true) {
  return useQuery({
    queryKey: ["orders", query],
    enabled,
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<OrderResponse>>(
        "/orders",
        {
          params: query,
        },
      );
      return res.data;
    },
  });
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const res = await instance.get<OrderResponse>(`/orders/${orderId}`);
      return res.data;
    },
  });
}

export function useOrderSummary(orderId?: string) {
  return useQuery({
    queryKey: ["order-summary", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const res = await instance.get<OrderSummaryResponse>(
        `/orders/${orderId}/summary`,
      );
      return res.data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const res = await instance.post<OrderCheckoutResponse>(
        "/orders/checkout",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

function useOrderAction<TPayload = undefined>(
  pathBuilder: (orderId: string) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload?: TPayload;
    }) => {
      const res = await instance.post(pathBuilder(orderId), payload ?? {});
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      void queryClient.invalidateQueries({
        queryKey: ["order-summary", variables.orderId],
      });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useMarkOrderPaid() {
  return useOrderAction((orderId) => `/orders/${orderId}/mark-paid`);
}

export function useConfirmOrder() {
  return useOrderAction((orderId) => `/orders/${orderId}/confirm`);
}

export function useIssueTicket() {
  return useOrderAction((orderId) => `/orders/${orderId}/issue-ticket`);
}

export function useCancelOrder() {
  return useOrderAction<{ reason?: string }>(
    (orderId) => `/orders/${orderId}/cancel`,
  );
}
