export type UserRole = "admin" | "editor" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionPayload {
  user: SessionUser;
  issuedAt: number;
  expiresAt: number;
}
