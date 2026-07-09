"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { BookingStatus } from "@prisma/client";

// All admin mutations funnel through here. Even though middleware guards /admin,
// each action re-checks the session (defense in depth — server actions have their
// own request surface).

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not authorized.");
  return session;
}

// Build a URL-safe, unique slug from a name (appends -2, -3, … on collision).
async function uniqueArtistSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "artist";
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.artist.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createArtist(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Please enter the artist's name.");

  const styles = String(formData.get("styles") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const slug = await uniqueArtistSlug(name);
  const max = await prisma.artist.aggregate({ _max: { sortOrder: true } });

  const artist = await prisma.artist.create({
    data: {
      name,
      slug,
      title: String(formData.get("title") || "").trim() || null,
      styles,
      bio: "",
      // New artists start hidden + closed so they aren't public until finished.
      active: false,
      bookingOpen: false,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/artists");
  revalidatePath("/artists");
  // Continue straight to the full editor to add bio, images, availability, etc.
  redirect(`/admin/artists/${artist.id}`);
}

export async function deleteArtist(artistId: string) {
  await requireAdmin();

  // Preserve booking history: block hard-deletion of an artist who has bookings.
  // Staff can instead deactivate / close bookings from the profile editor.
  const bookings = await prisma.booking.count({ where: { artistId } });
  if (bookings > 0) {
    throw new Error(
      `This artist has ${bookings} booking${bookings > 1 ? "s" : ""} and can't be deleted. ` +
        "Uncheck “Visible on site” and “Accepting bookings” to retire them instead."
    );
  }

  // Availability, time off, portfolio links and appointment-type links cascade
  // (or null out) via the schema relations.
  await prisma.artist.delete({ where: { id: artistId } });

  revalidatePath("/admin/artists");
  revalidatePath("/artists");
  redirect("/admin/artists");
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  await requireAdmin();
  if (!Object.values(BookingStatus).includes(status)) {
    throw new Error("Invalid status.");
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
}

export async function toggleArtistBooking(artistId: string, open: boolean) {
  await requireAdmin();
  await prisma.artist.update({ where: { id: artistId }, data: { bookingOpen: open } });
  revalidatePath("/admin/artists");
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function updateArtistProfile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const styles = String(formData.get("styles") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.artist.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      title: String(formData.get("title") || "").trim() || null,
      pronouns: String(formData.get("pronouns") || "").trim() || null,
      bio: String(formData.get("bio") || "").trim(),
      instagram: String(formData.get("instagram") || "").trim() || null,
      avatarUrl: String(formData.get("avatarUrl") || "").trim() || null,
      heroUrl: String(formData.get("heroUrl") || "").trim() || null,
      styles,
      active: formData.get("active") === "on",
      bookingOpen: formData.get("bookingOpen") === "on",
    },
  });
  revalidatePath(`/admin/artists/${id}`);
  revalidatePath("/admin/artists");
  revalidatePath("/artists");
}

export async function addAvailabilityWindow(formData: FormData) {
  await requireAdmin();
  const artistId = String(formData.get("artistId"));
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startMinutes = timeToMinutes(String(formData.get("start")));
  const endMinutes = timeToMinutes(String(formData.get("end")));

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
    throw new Error("End time must be after start time.");
  }
  await prisma.availabilityWindow.create({
    data: { artistId, dayOfWeek, startMinutes, endMinutes },
  });
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function deleteAvailabilityWindow(id: string, artistId: string) {
  await requireAdmin();
  await prisma.availabilityWindow.delete({ where: { id } });
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function updateAppointmentType(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const priceCents = Math.round(Number(formData.get("price") || 0) * 100);
  const depositCents = Math.round(Number(formData.get("deposit") || 0) * 100);

  await prisma.appointmentType.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      durationMinutes: Math.max(15, Number(formData.get("duration") || 60)),
      priceCents: Math.max(0, priceCents),
      depositCents: Math.max(0, depositCents),
      paymentPolicy: String(formData.get("paymentPolicy")) as never,
      requiresIntake: formData.get("requiresIntake") === "on",
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/admin/appointment-types");
  revalidatePath("/book");
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}
