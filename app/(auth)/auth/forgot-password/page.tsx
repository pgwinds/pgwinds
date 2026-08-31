import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/admin/password-reset-form";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() { return <main className="admin-login"><div><Link className="wordmark" href="/">PG<span>WINDS</span></Link><p className="eyebrow">Admin access</p><h1>Reset password</h1><p>We will send a secure password-reset link to your email address.</p><PasswordResetRequestForm /></div></main>; }
