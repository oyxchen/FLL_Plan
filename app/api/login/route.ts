import { NextRequest, NextResponse } from "next/server";
import { issueSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const submitted = typeof body?.password === "string" ? body.password : "";
  if (process.env.NODE_ENV === "production" && (!process.env.TEAM_PASSWORD || !process.env.SESSION_SECRET)) {
    return NextResponse.json({ error: "The team workspace is not configured yet. Add TEAM_PASSWORD and SESSION_SECRET in the hosting settings." }, { status: 503 });
  }
  const expected = "75798";
  if (submitted !== expected) return NextResponse.json({ error: "That passcode did not match." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  issueSession(response);
  return response;
}
