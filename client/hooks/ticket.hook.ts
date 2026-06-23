"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ChangePriceRequest,
  ChangeSaleWindowRequest,
  OpenSaleRequest,
  PaginatedResponse,
  PrepareStockRequest,
  ReleaseSeatRequest,
  ReleaseTicketRequest,
  ReserveSeatRequest,
  ReserveTicketRequest,
  SeatMapResponse,
  TicketItemAvailabilityResponse,
  TicketAvailabilityResponse,
  TicketResponse,
  UpdateTicketItemRequest,
  UpdateTicketRequest,
} from "@/lib/api-types";
import instance from "@/lib/http";

export interface TicketsQuery {
  departureStationCode?: string;
  arrivalStationCode?: string;
  dateStart?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateTicketItemPayload {
  name?: string;
  description?: string;
  coachCode?: string;
  seatClass?: string;
  seatType?: string;
  seatLabels?: string[];
  availableSeatLabels?: string[];
  stockInitial?: number;
  stockAvailable?: number;
  stockPrepared?: boolean;
  priceOriginal?: number | string;
  priceFlash?: number | string;
  saleStartTime?: string;
  saleEndTime?: string;
}

export interface CreateTicketPayload {
  title?: string;
  trainNumber?: string;
  departureStationCode?: string;
  departureStationName?: string;
  arrivalStationCode?: string;
  arrivalStationName?: string;
  journeyNote?: string;
  dateStart?: string;
  dateEnd?: string;
  status?: number;
  ticketItems?: CreateTicketItemPayload[];
}

export function useTickets(query: TicketsQuery) {
  return useQuery({
    queryKey: ["tickets", query],
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<TicketResponse>>(
        "/tickets",
        {
          params: query,
        },
      );
      return res.data;
    },
  });
}

export function useTicket(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const res = await instance.get<TicketResponse>(`/tickets/${ticketId}`);
      return res.data;
    },
  });
}

export function useTicketAvailability(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket-availability", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const res = await instance.get<TicketAvailabilityResponse>(
        `/tickets/${ticketId}/availability`,
      );
      return res.data;
    },
  });
}

export function useSeatMap(ticketId?: string) {
  return useQuery({
    queryKey: ["seat-map", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const res = await instance.get<SeatMapResponse>(
        `/tickets/${ticketId}/seat-map`,
      );
      return res.data;
    },
  });
}

export function useTicketItem(ticketId?: string, ticketItemId?: string) {
  return useQuery({
    queryKey: ["ticket-item", ticketId, ticketItemId],
    enabled: Boolean(ticketId && ticketItemId),
    queryFn: async () => {
      const res = await instance.get(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}`,
      );
      return res.data as TicketResponse["ticketItems"][number];
    },
  });
}

export function useTicketItemAvailability(
  ticketId?: string,
  ticketItemId?: string,
) {
  return useQuery({
    queryKey: ["ticket-item-availability", ticketId, ticketItemId],
    enabled: Boolean(ticketId && ticketItemId),
    queryFn: async () => {
      const res = await instance.get<TicketItemAvailabilityResponse>(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}/availability`,
      );
      return res.data;
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const res = await instance.post<TicketResponse>("/tickets", payload);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicket(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateTicketRequest) => {
      const res = await instance.patch<TicketResponse>(
        `/tickets/${ticketId}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useAddTicketItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: CreateTicketItemPayload;
    }) => {
      const res = await instance.post<TicketResponse>(
        `/tickets/${ticketId}/ticket-items`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["seat-map", variables.ticketId] });
    },
  });
}

export function useRemoveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      const res = await instance.delete(`/tickets/${ticketId}`);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

function useTicketAction(pathBuilder: (ticketId: string) => string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      const res = await instance.post<TicketResponse>(pathBuilder(ticketId));
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
    },
  });
}

export function usePublishTicket() {
  return useTicketAction((ticketId) => `/tickets/${ticketId}/publish`);
}

export function useUnpublishTicket() {
  return useTicketAction((ticketId) => `/tickets/${ticketId}/unpublish`);
}

export function useCloseSale() {
  return useTicketAction((ticketId) => `/tickets/${ticketId}/close-sale`);
}

export function usePrepareStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: PrepareStockRequest;
    }) => {
      const res = await instance.post<TicketResponse>(
        `/tickets/${ticketId}/prepare-stock`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
    },
  });
}

export function useOpenSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: OpenSaleRequest;
    }) => {
      const res = await instance.post<TicketResponse>(
        `/tickets/${ticketId}/open-sale`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
    },
  });
}

function useTicketReservationAction<TPayload extends ReserveTicketRequest | ReleaseTicketRequest>(
  pathBuilder: (ticketId: string) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: TPayload;
    }) => {
      const res = await instance.post<TicketAvailabilityResponse>(
        pathBuilder(ticketId),
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["seat-map", variables.ticketId] });
      void queryClient.invalidateQueries({
        queryKey: [
          "ticket-item-availability",
          variables.ticketId,
          variables.payload.ticketItemId,
        ],
      });
    },
  });
}

export function useReserveTicket() {
  return useTicketReservationAction<ReserveTicketRequest>(
    (ticketId) => `/tickets/${ticketId}/reserve`,
  );
}

export function useReleaseTicket() {
  return useTicketReservationAction<ReleaseTicketRequest>(
    (ticketId) => `/tickets/${ticketId}/release`,
  );
}

function useSeatReservationAction<TPayload extends ReserveSeatRequest | ReleaseSeatRequest>(
  pathBuilder: (ticketId: string, ticketItemId: string) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketItemId,
      payload,
    }: {
      ticketId: string;
      ticketItemId: string;
      payload: TPayload;
    }) => {
      const res = await instance.post<TicketItemAvailabilityResponse>(
        pathBuilder(ticketId, ticketItemId),
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["seat-map", variables.ticketId] });
      void queryClient.invalidateQueries({
        queryKey: [
          "ticket-item-availability",
          variables.ticketId,
          variables.ticketItemId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-item", variables.ticketId, variables.ticketItemId],
      });
    },
  });
}

export function useReserveSeat() {
  return useSeatReservationAction<ReserveSeatRequest>(
    (ticketId, ticketItemId) =>
      `/tickets/${ticketId}/ticket-items/${ticketItemId}/reserve-seat`,
  );
}

export function useReleaseSeat() {
  return useSeatReservationAction<ReleaseSeatRequest>(
    (ticketId, ticketItemId) =>
      `/tickets/${ticketId}/ticket-items/${ticketItemId}/release-seat`,
  );
}

export function useUpdateTicketItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketItemId,
      payload,
    }: {
      ticketId: string;
      ticketItemId: string;
      payload: UpdateTicketItemRequest;
    }) => {
      const res = await instance.patch(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "ticket-item",
          variables.ticketId,
          variables.ticketItemId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
    },
  });
}

export function useRemoveTicketItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketItemId,
    }: {
      ticketId: string;
      ticketItemId: string;
    }) => {
      const res = await instance.delete(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}`,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["ticket-availability", variables.ticketId],
      });
    },
  });
}

export function useChangePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketItemId,
      payload,
    }: {
      ticketId: string;
      ticketItemId: string;
      payload: ChangePriceRequest;
    }) => {
      const res = await instance.post(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}/change-price`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "ticket-item",
          variables.ticketId,
          variables.ticketItemId,
        ],
      });
    },
  });
}

export function useChangeSaleWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketItemId,
      payload,
    }: {
      ticketId: string;
      ticketItemId: string;
      payload: ChangeSaleWindowRequest;
    }) => {
      const res = await instance.post(
        `/tickets/${ticketId}/ticket-items/${ticketItemId}/change-sale-window`,
        payload,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "ticket-item",
          variables.ticketId,
          variables.ticketItemId,
        ],
      });
    },
  });
}
