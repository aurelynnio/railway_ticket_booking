"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  PaginatedResponse,
  SeatMapResponse,
  TicketAvailabilityResponse,
  TicketResponse,
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
