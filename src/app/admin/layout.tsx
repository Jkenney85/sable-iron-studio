import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

// The admin login page renders without the shell (no session yet). All other
// /admin routes are protected by middleware and rendered inside the shell.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    // Login page (middleware lets it through). Render bare.
    return <>{children}</>;
  }
  return <AdminShell name={session.name}>{children}</AdminShell>;
}
