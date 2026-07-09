"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { formatTime } from "@/lib/format";
import type { Slot } from "./types";

// Renders a horizontal date strip + a grid of available/unavailable time slots
// for the chosen artist & appointment type.

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SlotPicker({
  artistId,
  appointmentTypeId,
  selected,
  onSelect,
}: {
  artistId: string;
  appointmentTypeId: string;
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const out: Date[] = [];
    const base = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const [activeDate, setActiveDate] = useState(() => localDateStr(days[0]));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/availability?artistId=${artistId}&appointmentTypeId=${appointmentTypeId}&date=${activeDate}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setSlots(data.slots ?? []);
      })
      .catch(() => !cancelled && setError("Could not load times."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [artistId, appointmentTypeId, activeDate]);

  const available = slots.filter((s) => s.available);

  return (
    <div>
      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const ds = localDateStr(d);
          const isActive = ds === activeDate;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => setActiveDate(ds)}
              className={clsx(
                "flex min-w-[60px] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 transition-colors",
                isActive
                  ? "border-vermilion bg-vermilion text-ink"
                  : "border-ink-line text-bone-muted hover:border-bone-muted"
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className="font-display text-xl leading-tight">{d.getDate()}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">
                {d.toLocaleDateString("en-US", { month: "short" })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slot grid */}
      <div className="mt-6 min-h-[140px]">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-ink-raised" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-vermilion-soft">
            {error}
          </p>
        ) : available.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-line px-6 py-10 text-center">
            <p className="font-display text-xl text-bone-muted">No openings this day.</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-bone-muted">
              Try another date
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const isSel = selected === s.start;
              return (
                <button
                  key={s.start}
                  type="button"
                  disabled={!s.available}
                  onClick={() => onSelect(s.start)}
                  className={clsx(
                    "rounded-lg border px-2 py-3 font-mono text-xs tracking-wide transition-colors",
                    !s.available
                      ? "cursor-not-allowed border-ink-line/60 text-bone-muted/40 line-through"
                      : isSel
                        ? "border-vermilion bg-vermilion text-ink"
                        : "border-ink-line text-bone hover:border-vermilion"
                  )}
                  title={s.available ? undefined : "Unavailable"}
                >
                  {formatTime(s.start)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
