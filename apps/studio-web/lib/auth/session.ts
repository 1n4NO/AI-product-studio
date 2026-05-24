import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionPayload, SessionUser, UserRole } from "./types";

export const AUTH_COOKIE_NAME = "ps_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface CreateSessionOptions {
  ttlSeconds?: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("AUTH_COOKIE_SECRET is required for authentication");
  }
  return secret;
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string): string {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

function verifySignature(data: string, signature: string): boolean {
  const expected = sign(data);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function encodeSession(payload: SessionPayload): string {
  const serialized = JSON.stringify(payload);
  const encoded = base64urlEncode(serialized);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!verifySignature(encoded, signature)) return null;

  try {
    const parsed = JSON.parse(base64urlDecode(encoded)) as SessionPayload;
    if (!parsed?.user?.id || !parsed?.user?.email || !parsed?.user?.role) return null;
    if (Date.now() >= parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser, options: CreateSessionOptions = {}): Promise<void> {
  const now = Date.now();
  const ttl = (options.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS) * 1000;
  const payload: SessionPayload = {
    user,
    issuedAt: now,
    expiresAt: now + ttl
  };

  const token = encodeSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(payload.expiresAt)
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function isValidRole(role: string): role is UserRole {
  return role === "admin" || role === "editor" || role === "viewer";
}
