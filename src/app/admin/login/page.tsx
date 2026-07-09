import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Studio login",
  robots: { index: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  // Already signed in? Skip the form.
  const session = await getSession();
  if (session) redirect(searchParams.from || "/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl">
            Sable <span className="text-vermilion">&amp;</span> Iron
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-bone-muted">
            Studio dashboard
          </p>
        </div>
        <LoginForm from={searchParams.from} />
      </div>
    </div>
  );
}
