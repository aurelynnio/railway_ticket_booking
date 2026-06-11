import { useMutation, useQuery } from "@tanstack/react-query";

import {
  AuthSessionResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/lib/api-types";
import instance from "@/lib/http";

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
    mutationFn: async (data: LoginRequest) => {
      const res = await instance.post("/auth/login", data);
      return res.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
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
    mutationFn: async (data: ForgotPasswordRequest) => {
      const res = await instance.post("/auth/forgotPassword", data);
      return res.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
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
