import { prisma } from "./prisma";
import { BookingStatus } from "@prisma/client";

// Slot generation.
//
// NOTE on timezones: for the MVP we treat times in the server's local timezone,
// which should be set to the studio timezone (see TZ env / README "Production
// hardening"). Times are persisted as absolute Date values, so a later move to a
// fully tz-aware engine (Temporal / Luxon) is a drop-in replacement here.

export const SLOT_STEP_MINUTES = 30;

// Statuses that occupy an artist's calendar (block the slot).
export const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export type Slot = {
  start: string; // ISO
  end: string; // ISO
  available: boolean;
};

type Interval = { start: number; end: number }; // epoch ms

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Build a Date from a YYYY-MM-DD string + minutes-from-midnight, in server local time. */
function dateAtMinutes(dateStr: string, minutes: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

/**
 * Compute the bookable slots for one artist on one calendar date.
 * Returns every candidate start with an `available` flag so the UI can show
 * both open and taken slots clearly.
 */
export async function getAvailableSlots(params: {
  artistId: string;
  dateStr: string; // YYYY-MM-DD
  durationMinutes: number;
}): Promise<Slot[]> {
  const { artistId, dateStr, durationMinutes } = params;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  const dayOfWeek = dayStart.getDay();

  const [windows, timeOff, bookings] = await Promise.all([
    prisma.availabilityWindow.findMany({ where: { artistId, dayOfWeek } }),
    prisma.timeOff.findMany({
      where: { artistId, startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
    }),
    prisma.booking.findMany({
      where: {
        artistId,
        status: { in: BLOCKING_STATUSES },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  if (windows.length === 0) return [];

  const busy: Interval[] = [
    ...timeOff.map((t) => ({
      start: t.startAt.getTime(),
      end: t.endAt.getTime(),
    })),
    ...bookings.map((b) => ({
      start: b.startTime.getTime(),
      end: b.endTime.getTime(),
    })),
  ];

  const now = Date.now();
  const slots: Slot[] = [];

  for (const w of windows) {
    for (
      let mins = w.startMinutes;
      mins + durationMinutes <= w.endMinutes;
      mins += SLOT_STEP_MINUTES
    ) {
      const start = dateAtMinutes(dateStr, mins);
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const interval = { start: start.getTime(), end: end.getTime() };

      const isPast = interval.start <= now;
      const isBusy = busy.some((b) => overlaps(interval, b));

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available: !isPast && !isBusy,
      });
    }
  }

  // De-dupe (overlapping windows) and sort chronologically.
  const seen = new Set<string>();
  return slots
    .filter((s) => (seen.has(s.start) ? false : (seen.add(s.start), true)))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Authoritative check used at booking time inside a transaction: is this exact
 * slot still free for the artist? Guards against races / double-booking.
 */
export async function isSlotFree(
  tx: {
    booking: {
      findFirst: (args: unknown) => Promise<unknown | null>;
    };
  },
  artistId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  const conflict = await tx.booking.findFirst({
    where: {
      artistId,
      status: { in: BLOCKING_STATUSES },
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { id: true },
  } as never);
  return conflict === null;
}
