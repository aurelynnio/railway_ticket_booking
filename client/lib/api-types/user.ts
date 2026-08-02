export interface UserResponse {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
  role?: number;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  name?: string;
  role?: number;
}
