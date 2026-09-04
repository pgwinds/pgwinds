import { createClient } from "@/lib/supabase/server";

export type ManagedAdministrator = {
  id: string;
  email: string;
  admin_role: "admin";
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdministratorAuditEntry = {
  id: string;
  actor_id: string;
  action: "administrator.role_granted" | "administrator.role_revoked";
  entity_id: string | null;
  metadata: { email?: string; role?: string };
  created_at: string;
  actor_email: string | null;
};

export async function getManagedAdministrators(): Promise<ManagedAdministrator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_pgwinds_admins");
  if (error) throw new Error("Could not load administrators.");
  return (data ?? []) as ManagedAdministrator[];
}

export async function getAdministratorAuditLog(): Promise<AdministratorAuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,actor_id,action,entity_id,metadata,created_at")
    .in("action", ["administrator.role_granted", "administrator.role_revoked"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Could not load administrator audit log.");

  const actorIds = [...new Set((data ?? []).map((entry) => entry.actor_id as string))];
  const { data: profiles } = actorIds.length > 0
    ? await supabase.from("profiles").select("id,email").in("id", actorIds)
    : { data: [] as { id: string; email: string | null }[] };
  const emails = new Map((profiles ?? []).map((profile) => [profile.id as string, profile.email as string | null]));

  return (data ?? []).map((entry) => ({
    id: entry.id as string,
    actor_id: entry.actor_id as string,
    action: entry.action as AdministratorAuditEntry["action"],
    entity_id: entry.entity_id as string | null,
    metadata: (entry.metadata ?? {}) as AdministratorAuditEntry["metadata"],
    created_at: entry.created_at as string,
    actor_email: emails.get(entry.actor_id as string) ?? null,
  }));
}
