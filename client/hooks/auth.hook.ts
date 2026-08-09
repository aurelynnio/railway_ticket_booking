import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AuthSessionResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
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

export const useGoogleCallback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const res = await instance.get("/auth/google/callback", {
        params: { code },
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
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
      const res = await instance.post("/auth/refresh-token");
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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const res = await instance.post("/auth/changePassword", data);
      return res.data;
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      const res = await instance.post("/auth/verifyEmail", data);
      return res.data;
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (data: ResendVerificationRequest) => {
      const res = await instance.post("/auth/resendVerification", data);
      return res.data;
    },
  });
};

export const useRevokeAllSessions = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await instance.post("/auth/revokeAllSessions");
      return res.data;
    },
  });
};
