"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({ label, pendingLabel, className = "button", disabled = false }: { label: string; pendingLabel: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={disabled || pending}>{pending ? pendingLabel : label}</button>;
}
