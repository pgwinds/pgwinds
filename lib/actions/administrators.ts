"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();
const userIdSchema = z.string().uuid();

async function getAdministratorClient() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return { user, supabase: await createClient() };
}

function redirectWithFeedback(type: "status" | "error", message: string): never {
  redirect(`/admin/administrators?${type}=${encodeURIComponent(message)}`);
}

export async function grantAdministratorRole(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirectWithFeedback("error", "Enter a valid email address.");

  const { supabase } = await getAdministratorClient();
  const { error } = await supabase.rpc("grant_pgwinds_admin_role", { target_email: parsed.data });
  if (error) {
    const message = error.message.includes("No Supabase Authentication account")
      ? "This email does not have a Supabase Authentication account yet. Create the account first."
      : "Could not grant administrator access. Please try again.";
    redirectWithFeedback("error", message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/administrators");
  redirectWithFeedback("status", "Administrator access granted. The person should sign out and sign in again.");
}

export async function revokeAdministratorRole(formData: FormData) {
  const parsed = userIdSchema.safeParse(formData.get("userId"));
  if (!parsed.success) redirectWithFeedback("error", "This administrator record is invalid.");

  const { supabase } = await getAdministratorClient();
  const { error } = await supabase.rpc("revoke_pgwinds_admin_role", { target_user_id: parsed.data });
  if (error) {
    const message = error.message.includes("own administrator role")
      ? "You cannot remove your own administrator role."
      : error.message.includes("At least one administrator")
        ? "At least one administrator must remain."
        : "Could not remove administrator access. Please try again.";
    redirectWithFeedback("error", message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/administrators");
  redirectWithFeedback("status", "Administrator access removed. The change takes effect when that person refreshes their session.");
}
