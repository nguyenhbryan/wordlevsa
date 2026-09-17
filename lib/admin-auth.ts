import type { NextRequest } from "next/server";
export const ADMIN_COOKIE = "weekword_admin"; const MAX_AGE = 60 * 60 * 24 * 7;
function accessCode() { return process.env.ADMIN_ACCESS_CODE || "weekword-admin"; }
function toHex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function signature(value: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(accessCode()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))); }
export async function codesMatch(candidate: string) { const [a, b] = await Promise.all([signature(candidate), signature(accessCode())]); if (a.length !== b.length) return false; let difference = 0; for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i); return difference === 0; }
export async function createAdminSession() { const expires = Math.floor(Date.now() / 1000) + MAX_AGE; return `${expires}.${await signature(String(expires))}`; }
export async function isAdmin(request: NextRequest) { const value = request.cookies.get(ADMIN_COOKIE)?.value; if (!value) return false; const [expires, proof] = value.split("."); if (!expires || !proof || Number(expires) < Date.now() / 1000) return false; return (await signature(expires)) === proof; }
export const adminCookieOptions = { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE };
