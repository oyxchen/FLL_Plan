import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE = "fll_plan_session";
const ttl = 60 * 60 * 24 * 14;

function secret() {
  return process.env.SESSION_SECRET || `${process.env.TEAM_PASSWORD || "75798"}-change-this-session-secret`;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function issueSession(response: NextResponse) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttl })).toString("base64url");
  response.cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export function isAuthenticated(request: NextRequest) {
  const value = request.cookies.get(COOKIE)?.value;
  if (!value) return false;
  const [payload, provided] = value.split(".");
  if (!payload || !provided) return false;
  const expected = sign(payload);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key, bucket: process.env.SUPABASE_STORAGE_BUCKET || "fll-files" };
}

export function supabaseHeaders(key: string, extra: HeadersInit = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}
