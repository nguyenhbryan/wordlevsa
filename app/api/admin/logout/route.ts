import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
export async function POST() { const response = NextResponse.json({ authenticated: false }); response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 }); return response; }
