import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured) return <main className="admin-setup"><p className="eyebrow">Admin setup required</p><h1>Connect Supabase to enable the dashboard.</h1><p>Add the public Supabase URL and anon key to the deployment environment, then provision an account with the <code>pgwinds_role=admin</code> claim.</p></main>;
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return <AdminShell email={user.email ?? "Admin user"}>{children}</AdminShell>;
}
