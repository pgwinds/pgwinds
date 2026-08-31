import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const requestedNext = searchParams.get("next") ?? "/admin";
  const next = requestedNext.startsWith("/") ? requestedNext : "/admin";
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv();
  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    },
  });

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const result = code ? await supabase.auth.exchangeCodeForSession(code) : tokenHash && type ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" | "invite" }) : { error: new Error("Missing authentication parameters") };
  if (result.error) return NextResponse.redirect(new URL("/admin/login?error=invalid-link", origin));
  return response;
}
