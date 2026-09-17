import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
export const metadata: Metadata = { title: "Admin · Weekword", description: "Manage weekly puzzles and review player results." };
export default function AdminPage() { return <AdminPanel />; }
