"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv();
    client = createBrowserClient(supabaseUrl, supabasePublishableKey);
  }
  return client;
}
