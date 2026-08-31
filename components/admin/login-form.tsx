"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  return <form className="admin-login-form" action={formAction}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{state.error && <p role="alert">{state.error}</p>}<button className="button" disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in"}</button><Link className="text-link" href="/auth/forgot-password">Forgot password?</Link></form>;
}
