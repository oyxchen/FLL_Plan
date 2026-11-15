import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, supabaseConfig, supabaseHeaders } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ configured: false }, { status: 503 });
  const response = await fetch(`${config.url}/rest/v1/fll_plan_state?id=eq.shared&select=payload`, {
    headers: supabaseHeaders(config.key),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Could not load the shared team data." }, { status: 502 });
  const rows = await response.json();
  return NextResponse.json({ configured: true, state: rows[0]?.payload ?? null });
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ configured: false }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Invalid team data." }, { status: 400 });
  }
  const response = await fetch(`${config.url}/rest/v1/fll_plan_state?on_conflict=id`, {
    method: "POST",
    headers: supabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ id: "shared", payload: body.state, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not save the shared team data." }, { status: 502 });
  return NextResponse.json({ configured: true, saved: true });
}
