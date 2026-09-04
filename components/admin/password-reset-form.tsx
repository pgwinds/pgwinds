"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function resetErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "over_email_send_rate_limit" || error.message?.toLowerCase().includes("rate limit")) {
    return "A reset email was requested recently. Please wait before trying again, or ask a site administrator to configure SMTP for reliable delivery.";
  }
  if (error.code === "over_request_rate_limit") {
    return "Too many reset requests were made from this connection. Please wait and try again.";
  }
  return "We could not send the reset email. Please try again later.";
}

export function PasswordResetRequestForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
    setPending(false);
    if (resetError) setError(resetErrorMessage(resetError));
    else setMessage("Check your email for a secure link to set a new password.");
  }

  return <form className="admin-login-form" onSubmit={requestReset}><label>Email<input name="email" type="email" autoComplete="email" required /></label>{error && <p role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="button" disabled={pending} type="submit">{pending ? "Sending…" : "Send reset link"}</button><Link className="text-link" href="/admin/login">Back to sign in</Link></form>;
}

export function UpdatePasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 12 || password !== confirmation) { setError("Use a matching password of at least 12 characters."); setPending(false); return; }
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) setError("Your secure link has expired. Request another password reset.");
    else { setMessage("Password updated. You can now sign in."); event.currentTarget.reset(); }
  }

  return <form className="admin-login-form" onSubmit={updatePassword}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>{error && <p role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="button" disabled={pending} type="submit">{pending ? "Saving…" : "Set password"}</button>{message && <Link className="text-link" href="/admin/login">Go to sign in</Link>}</form>;
}
