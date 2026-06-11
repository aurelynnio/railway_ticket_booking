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

export const useUser = (userId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["user", userId],
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const res = await instance.get<UserResponse>(`/users/${userId}`);
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

export const useCreateUser = () => {
  return useMutation({
    mutationKey: ["createUser"],
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await instance.post<UserResponse>("/users", data);
      return res.data;
    },
  });
};

export const useUpdateUser = (userId?: string) => {
  return useMutation({
    mutationKey: ["updateUser", userId],
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await instance.patch<UserResponse>(`/users/${userId}`, data);
      return res.data;
    },
  });
};
