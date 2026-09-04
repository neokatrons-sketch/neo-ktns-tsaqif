"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({ children = "Simpan", pendingLabel = "Menyimpan…", className = "" }: { children?: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} type="submit">{pending ? pendingLabel : children}</button>;
}

export function ConfirmSubmitButton({ children, message, className = "" }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }} type="submit">{children}</button>;
}
