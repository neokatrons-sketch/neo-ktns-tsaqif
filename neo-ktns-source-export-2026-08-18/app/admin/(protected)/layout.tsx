import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminAccess } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: React.PropsWithChildren) {
  const access = await getAdminAccess();
  if (access.kind === "not_admin") redirect("/admin/access-denied");
  if (access.kind !== "admin") redirect("/admin/login");

  return <AdminShell identity={access.admin.display_name || access.admin.email}>{children}</AdminShell>;
}
