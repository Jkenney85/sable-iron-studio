"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/appointment-types", label: "Services" },
];

export function AdminShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const navLinks = (
    <>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={clsx(
            "rounded-lg px-3 py-2 text-sm transition-colors",
            isActive(item.href, item.exact)
              ? "bg-bone/10 text-bone"
              : "text-bone-muted hover:bg-bone/5 hover:text-bone"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-ink text-bone md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r border-ink-line bg-ink-soft md:flex md:flex-col">
        <div className="border-b border-ink-line px-6 py-5">
          <Link href="/admin" className="font-display text-xl">
            Sable <span className="text-vermilion">&amp;</span> Iron
          </Link>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            Studio dashboard
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">{navLinks}</nav>
        <div className="border-t border-ink-line p-4">
          <div className="px-3 pb-3 text-sm text-bone-muted">
            <span className="text-bone">{name}</span>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-bone-muted transition-colors hover:bg-bone/5 hover:text-bone"
          >
            Sign out
          </button>
          <Link
            href="/"
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-bone-muted transition-colors hover:bg-bone/5 hover:text-bone"
          >
            View site ↗
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-ink-line bg-ink-soft px-5 py-3 md:hidden">
        <Link href="/admin" className="font-display text-lg">
          Sable <span className="text-vermilion">&amp;</span> Iron
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="font-mono text-[11px] uppercase tracking-widest text-bone-muted"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-b border-ink-line bg-ink-soft p-4 md:hidden">
          {navLinks}
          <button
            onClick={logout}
            className="rounded-lg px-3 py-2 text-left text-sm text-bone-muted hover:text-bone"
          >
            Sign out
          </button>
        </nav>
      )}

      <main className="min-w-0 p-5 md:p-8">{children}</main>
    </div>
  );
}
