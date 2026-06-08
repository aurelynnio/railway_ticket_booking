import { useMutation, useQuery } from "@tanstack/react-query";

import instance from "@/lib/http";

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  userId: string;
  email: string;
  role?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const useAuthSession = () => {
  return useQuery({
    queryKey: ["auth-session"],
    retry: false,
    queryFn: async () => {
      const res = await instance.get<AuthSessionResponse>("/auth/session");
      return res.data;
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const res = await instance.post("/auth/login", data);
      return res.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const res = await instance.post("/auth/register", data);
      return res.data;
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await instance.post("/auth/refreshToken");
      return res.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordPayload) => {
      const res = await instance.post("/auth/forgotPassword", data);
      return res.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordPayload) => {
      const res = await instance.post("/auth/resetPassword", data);
      return res.data;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await instance.post("/auth/logout");
      return res.data;
    },
  });
};
