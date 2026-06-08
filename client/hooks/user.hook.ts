import { useMutation, useQuery } from "@tanstack/react-query";
import { PaginatedResponse, UserResponse } from "@/lib/api-types";
import instance from "@/lib/http";

export const useMe = (enabled = true) => {
  return useQuery({
    queryKey: ["me"],
    enabled,
    queryFn: async () => {
      const res = await instance.get<UserResponse>("/users/me");
      return res.data;
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: async (data: { username?: string; email?: string }) => {
      const res = await instance.patch<UserResponse>("/users/me", data);
      return res.data;
    },
  });
};

export const useListUsers = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["users", page, limit],
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<UserResponse>>("/users", {
        params: { page, limit },
      });
      return res.data;
    },
  });
};
