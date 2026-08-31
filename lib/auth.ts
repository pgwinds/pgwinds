import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export function isAdmin(user: User | null): boolean {
  return user?.app_metadata.pgwinds_role === "admin";
}

export async function getAdminUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isAdmin(user) ? user : null;
}
