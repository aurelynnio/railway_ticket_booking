"use client";

import { useQuery } from "@tanstack/react-query";

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
