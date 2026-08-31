"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
