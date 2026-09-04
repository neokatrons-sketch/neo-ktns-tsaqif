"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form action={action} className="mt-8 space-y-5"><FormField autoCapitalize="none" autoComplete="email" label="Email admin" name="email" placeholder="admin@neoktns.com" required spellCheck={false} type="email" /><FormField autoComplete="current-password" label="Password" name="password" required type="password" />{state.error && <p aria-live="polite" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]" role="alert">{state.error}</p>}<Button className="w-full" disabled={pending} type="submit">{pending ? "Memeriksa akses…" : "Masuk ke dashboard"}</Button></form>;
}
