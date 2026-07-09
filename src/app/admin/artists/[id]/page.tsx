import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { minutesToLabel } from "@/lib/format";
import {
  updateArtistProfile,
  addAvailabilityWindow,
  deleteAvailabilityWindow,
} from "@/lib/admin-actions";
import { DeleteArtistButton } from "@/components/admin/DeleteArtistButton";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminArtistDetail({
  params,
}: {
  params: { id: string };
}) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    include: { availability: { orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] } },
  });
  if (!artist) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/artists"
        className="font-mono text-[11px] uppercase tracking-widest text-bone-muted hover:text-bone"
      >
        ← All artists
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">{artist.name}</h1>

      {/* Profile form */}
      <form action={updateArtistProfile} className="card mt-6 space-y-5 p-6">
        <input type="hidden" name="id" value={artist.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Name</label>
            <input name="name" defaultValue={artist.name} className="field" />
          </div>
          <div>
            <label className="field-label">Title</label>
            <input name="title" defaultValue={artist.title ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label">Pronouns</label>
            <input name="pronouns" defaultValue={artist.pronouns ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label">Instagram</label>
            <input name="instagram" defaultValue={artist.instagram ?? ""} className="field" />
          </div>
        </div>
        <div>
          <label className="field-label">Styles (comma-separated)</label>
          <input name="styles" defaultValue={artist.styles.join(", ")} className="field" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Avatar image URL</label>
            <input
              name="avatarUrl"
              defaultValue={artist.avatarUrl ?? ""}
              className="field"
              placeholder="https://…/portrait.jpg"
            />
          </div>
          <div>
            <label className="field-label">Hero image URL</label>
            <input
              name="heroUrl"
              defaultValue={artist.heroUrl ?? ""}
              className="field"
              placeholder="https://…/work.jpg"
            />
          </div>
        </div>
        {artist.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={`${artist.name} avatar preview`}
            className="h-16 w-16 rounded-full border border-ink-line object-cover"
          />
        )}
        <div>
          <label className="field-label">Bio</label>
          <textarea name="bio" rows={4} defaultValue={artist.bio} className="field resize-none" />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-bone-muted">
            <input type="checkbox" name="active" defaultChecked={artist.active} className="accent-vermilion" />
            Visible on site
          </label>
          <label className="flex items-center gap-2 text-sm text-bone-muted">
            <input
              type="checkbox"
              name="bookingOpen"
              defaultChecked={artist.bookingOpen}
              className="accent-vermilion"
            />
            Accepting bookings
          </label>
        </div>
        <button type="submit" className="btn-primary">
          Save profile
        </button>
      </form>

      {/* Availability */}
      <div className="card mt-6 p-6">
        <h2 className="mb-1 font-display text-xl">Weekly availability</h2>
        <p className="mb-5 text-sm text-bone-muted">
          Recurring working hours. Booking slots are generated from these windows,
          minus existing appointments and time off.
        </p>

        {artist.availability.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-line px-4 py-6 text-center text-sm text-bone-muted">
            No hours set yet — add a window below to open this artist&apos;s calendar.
          </p>
        ) : (
          <ul className="space-y-2">
            {artist.availability.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-ink-line bg-ink px-4 py-2.5"
              >
                <span className="text-sm text-bone">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                    {DAYS[w.dayOfWeek]}
                  </span>
                  <span className="ml-3">
                    {minutesToLabel(w.startMinutes)} – {minutesToLabel(w.endMinutes)}
                  </span>
                </span>
                <form action={deleteAvailabilityWindow.bind(null, w.id, artist.id)}>
                  <button
                    type="submit"
                    className="font-mono text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Add window */}
        <form
          action={addAvailabilityWindow}
          className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink-line pt-5"
        >
          <input type="hidden" name="artistId" value={artist.id} />
          <div>
            <label className="field-label">Day</label>
            <select name="dayOfWeek" className="field" defaultValue="2">
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Start</label>
            <input type="time" name="start" defaultValue="12:00" className="field" />
          </div>
          <div>
            <label className="field-label">End</label>
            <input type="time" name="end" defaultValue="20:00" className="field" />
          </div>
          <button type="submit" className="btn-outline">
            Add window
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6">
        <h2 className="font-display text-xl text-red-300">Delete artist</h2>
        <p className="mb-4 mt-1 max-w-lg text-sm text-bone-muted">
          Permanently removes this artist and their availability and portfolio.
          Artists with existing bookings can&apos;t be deleted — hide them with
          “Visible on site” / “Accepting bookings” instead to keep booking history.
        </p>
        <DeleteArtistButton artistId={artist.id} artistName={artist.name} />
      </div>
    </div>
  );
}
