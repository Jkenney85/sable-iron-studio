"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-8 text-center">
        <div className="font-display text-3xl text-vermilion">Message sent.</div>
        <p className="mt-3 text-bone-muted">
          Thanks for reaching out — we&apos;ll get back to you within a couple of
          business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-8">
      <div>
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input id="name" name="name" required className="field" placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label htmlFor="message" className="field-label">
          Your idea
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="field resize-none"
          placeholder="Tell us what you're thinking — placement, size, style, references…"
        />
      </div>
      {status === "error" && error && (
        <p className="rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-vermilion-soft">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
      <p className="text-center text-[11px] text-bone-muted">
        For booking a specific time, use the{" "}
        <a href="/book" className="text-vermilion hover:underline">
          booking page
        </a>
        .
      </p>
    </form>
  );
}
