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
