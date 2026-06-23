import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useUserByEmail = (email?: string, enabled = true) => {
  return useQuery({
    queryKey: ["user", "email", email],
    enabled: enabled && Boolean(email),
    queryFn: async () => {
      const res = await instance.get<UserResponse>("/users/by-email", {
        params: { email },
      });
      return res.data;
    },
  });
};

export const useListUsers = (page = 1, limit = 10, enabled = true) => {
  return useQuery({
    queryKey: ["users", page, limit],
    enabled,
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<UserResponse>>("/users", {
        params: { page, limit },
      });
      return res.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createUser"],
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await instance.post<UserResponse>("/users", { payload: data });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateUser", userId],
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await instance.patch<UserResponse>(`/users/${userId}`, data);
      return res.data;
    },
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user", userId] });
      if (user.email) {
        void queryClient.invalidateQueries({ queryKey: ["user", "email", user.email] });
      }
    },
  });
};
