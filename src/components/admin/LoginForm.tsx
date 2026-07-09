"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email")).toLowerCase(),
          password: form.get("password"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sign-in failed.");
      }
      router.replace(from || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-8">
      <div>
        <label className="field-label">Email</label>
        <input name="email" type="email" required className="field" autoComplete="username" />
      </div>
      <div>
        <label className="field-label">Password</label>
        <input
          name="password"
          type="password"
          required
          className="field"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-2.5 text-sm text-vermilion-soft">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
