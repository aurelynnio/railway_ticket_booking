"use client";

import { useQuery } from "@tanstack/react-query";

import {
  PaginatedResponse,
  SearchTripResponse,
  StationSuggestionResponse,
} from "@/lib/api-types";
import instance from "@/lib/http";

export interface SearchTripsQuery {
  from?: string;
  to?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export function useSearchTrips(query: SearchTripsQuery) {
  return useQuery({
    queryKey: ["search-trips", query],
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<SearchTripResponse>>(
        "/search/trips",
        {
          params: query,
        },
      );
      return res.data;
    },
  });
}

export function useStationSuggestions(query?: string) {
  return useQuery({
    queryKey: ["station-suggestions", query],
    queryFn: async () => {
      const res = await instance.get<StationSuggestionResponse[]>(
        "/search/suggest-stations",
        {
          params: { q: query || undefined },
        },
      );
      return res.data;
    },
  });
}
