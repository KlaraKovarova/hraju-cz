import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminConditionsClient from "./AdminConditionsClient";

export const dynamic = "force-dynamic";

export default async function AdminConditionsPage() {
  // Defense in depth: proxy already guards /admin, but we also verify here
  // so Prisma never runs for unauthenticated users (SIL-627 pattern).
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }

  return <AdminConditionsClient />;
}
