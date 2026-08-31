import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return <main className="admin-login"><div><Link className="wordmark" href="/">PG<span>WINDS</span></Link><p className="eyebrow">Private area</p><h1>Admin sign in</h1>{isSupabaseConfigured ? <LoginForm /> : <p>Supabase environment variables have not been configured for this deployment.</p>}</div></main>;
}
