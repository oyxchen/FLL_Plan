import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, supabaseConfig, supabaseHeaders } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ deleted: true, localOnly: true });
  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";
  if (!/^[\w.-]+$/.test(path)) return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  const response = await fetch(`${config.url}/storage/v1/object/${config.bucket}`, {
    method: "DELETE",
    headers: supabaseHeaders(config.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not remove the stored file." }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
