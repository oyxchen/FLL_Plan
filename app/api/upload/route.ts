import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, supabaseConfig, supabaseHeaders } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Cloud file storage is not configured yet." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Files must be 25 MB or smaller." }, { status: 413 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-110) || "upload";
  const path = `${randomUUID()}-${safeName}`;
  const upload = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${path}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" }),
    body: await file.arrayBuffer(),
  });
  if (!upload.ok) return NextResponse.json({ error: "Upload failed. Check that the storage bucket exists." }, { status: 502 });
  return NextResponse.json({ path, name: file.name, mime: file.type || "application/octet-stream", size: file.size });
}
