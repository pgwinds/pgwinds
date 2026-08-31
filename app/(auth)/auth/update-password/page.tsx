import Link from "next/link";
import { UpdatePasswordForm } from "@/components/admin/password-reset-form";

export const metadata = { title: "Set password" };

export default function UpdatePasswordPage() { return <main className="admin-login"><div><Link className="wordmark" href="/">PG<span>WINDS</span></Link><p className="eyebrow">Admin access</p><h1>Set a password</h1><p>Choose a unique password with at least 12 characters.</p><UpdatePasswordForm /></div></main>; }
