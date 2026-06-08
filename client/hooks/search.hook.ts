"use client";

import { useQuery } from "@tanstack/react-query";

import { PaginatedResponse, SearchTripResponse } from "@/lib/api-types";
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
