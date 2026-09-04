import { grantAdministratorRole, revokeAdministratorRole } from "@/lib/actions/administrators";
import { getAdminUser } from "@/lib/auth";
import { getAdministratorAuditLog, getManagedAdministrators } from "@/lib/queries/admin-users";

export const metadata = { title: "Administrators · PGWINDS Admin" };

function formatDate(value: string | null) {
  if (!value) return "Not signed in yet";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdministratorsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const [user, administrators, auditLog, params] = await Promise.all([
    getAdminUser(), getManagedAdministrators(), getAdministratorAuditLog(), searchParams,
  ]);
  const status = params.status;
  const error = params.error;

  return <>
    <header className="admin-page-header"><p className="eyebrow">Administration</p><h1>Administrators</h1><p>Grant access only to existing Supabase Authentication accounts. Every role change is recorded below.</p>{status && <p className="admin-success" role="status">{status}</p>}{error && <p className="admin-form-feedback is-error" role="alert">{error}</p>}</header>
    <section className="admin-note admin-note--wide"><h2>Add an administrator</h2><p>The person must first exist in Supabase Authentication. After access is granted, they should sign out and sign in again before opening the dashboard.</p><form className="admin-inline-form" action={grantAdministratorRole}><label>Email address<input name="email" type="email" placeholder="name@example.com" required /></label><button className="button" type="submit">Grant admin access</button></form></section>
    <section className="admin-records admin-records--wide"><h2>Current administrators</h2><div>{administrators.map((administrator) => {
      const isCurrentUser = administrator.id === user?.id;
      return <article key={administrator.id} className="administrator-record"><div><strong>{administrator.email}</strong><span>Role: {administrator.admin_role} · Last sign-in: {formatDate(administrator.last_sign_in_at)}</span></div><div className="admin-record-actions">{isCurrentUser ? <em>You</em> : <form action={revokeAdministratorRole}><input type="hidden" name="userId" value={administrator.id} /><button className="admin-text-button" type="submit">Remove access</button></form>}</div></article>;
    })}</div></section>
    <section className="admin-records admin-records--wide"><h2>Role-change log</h2>{auditLog.length === 0 ? <p>No administrator role changes have been recorded yet.</p> : <div>{auditLog.map((entry) => <article key={entry.id}><div><strong>{entry.action === "administrator.role_granted" ? "Admin access granted" : "Admin access removed"}</strong><span>{entry.metadata.email ?? "Administrator"} · by {entry.actor_email ?? entry.actor_id} · {formatDate(entry.created_at)}</span></div></article>)}</div>}</section>
  </>;
}
