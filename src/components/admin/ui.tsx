import { clsx } from "clsx";
import type { BookingStatus, PaymentStatus } from "@prisma/client";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-bone-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const BOOKING_STYLES: Record<BookingStatus, string> = {
  PENDING: "border-bone-muted/40 text-bone-muted",
  AWAITING_PAYMENT: "border-amber-500/40 text-amber-400",
  CONFIRMED: "border-emerald-500/40 text-emerald-400",
  CANCELLED: "border-red-500/40 text-red-400",
  COMPLETED: "border-sky-500/40 text-sky-400",
  NO_SHOW: "border-red-500/40 text-red-400",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: "border-amber-500/40 text-amber-400",
  PAID: "border-emerald-500/40 text-emerald-400",
  FAILED: "border-red-500/40 text-red-400",
  REFUNDED: "border-bone-muted/40 text-bone-muted",
  PARTIALLY_REFUNDED: "border-bone-muted/40 text-bone-muted",
};

export function StatusBadge({
  status,
  kind = "booking",
}: {
  status: string;
  kind?: "booking" | "payment";
}) {
  const map = kind === "booking" ? BOOKING_STYLES : PAYMENT_STYLES;
  const cls = (map as Record<string, string>)[status] ?? "border-ink-line text-bone-muted";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        cls
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-bone">{value}</div>
      {hint && <div className="mt-1 text-xs text-bone-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="font-display text-2xl text-bone-muted">{title}</div>
      {hint && (
        <p className="mt-2 max-w-sm font-mono text-xs uppercase tracking-widest text-bone-muted">
          {hint}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
