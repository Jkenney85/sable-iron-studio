"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { updateBookingStatus } from "@/lib/admin-actions";
import type { BookingStatus } from "@prisma/client";

const ACTIONS: { status: BookingStatus; label: string; tone?: "danger" }[] = [
  { status: "CONFIRMED", label: "Confirm" },
  { status: "COMPLETED", label: "Mark completed" },
  { status: "NO_SHOW", label: "No-show", tone: "danger" },
  { status: "CANCELLED", label: "Cancel", tone: "danger" },
];

export function BookingStatusActions({
  bookingId,
  current,
}: {
  bookingId: string;
  current: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.filter((a) => a.status !== current).map((a) => (
        <button
          key={a.status}
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              updateBookingStatus(bookingId, a.status);
            })
          }
          className={clsx(
            "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50",
            a.tone === "danger"
              ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
              : "border-ink-line text-bone-muted hover:border-bone hover:text-bone"
          )}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
