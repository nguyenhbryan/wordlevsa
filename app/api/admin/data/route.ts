import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listAdminData } from "@/lib/data";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { if (!(await isAdmin(request))) return NextResponse.json({ authenticated: false }, { status: 401 }); try { return NextResponse.json({ authenticated: true, ...(await listAdminData()) }); } catch (error) { console.error(error); return NextResponse.json({ error: "Admin data is temporarily unavailable." }, { status: 503 }); } }
