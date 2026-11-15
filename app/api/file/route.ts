import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, supabaseConfig, supabaseHeaders } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Cloud file storage is not configured." }, { status: 503 });
  const path = request.nextUrl.searchParams.get("path") || "";
  if (!/^[\w.-]+$/.test(path)) return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  const file = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${path}`, {
    headers: supabaseHeaders(config.key),
    cache: "no-store",
  });
  if (!file.ok) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
