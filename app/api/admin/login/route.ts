import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, codesMatch, createAdminSession } from "@/lib/admin-auth";
export async function POST(request: NextRequest) {
  const body = await request.json() as { code?: string };
  if (!(await codesMatch(String(body.code || "")))) return NextResponse.json({ error: "That access code isn’t right." }, { status: 401 });
  const response = NextResponse.json({ authenticated: true }); response.cookies.set(ADMIN_COOKIE, await createAdminSession(), adminCookieOptions); return response;
}
