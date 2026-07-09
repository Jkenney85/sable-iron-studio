import { prisma } from "./prisma";

// Read helpers for public pages + booking flow. Kept here so pages stay lean and
// queries are reused consistently. All are server-only (Prisma).

const STUDIO_FALLBACK = {
  id: "studio",
  name: "Sable & Iron",
  tagline: "Custom tattooing, built to last.",
  about: "",
  email: "hello@sableiron.studio",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  instagram: "",
  hoursJson: null,
  depositPolicy: "",
  cancellationPolicy: "",
  currency: "usd",
  timezone: "America/Los_Angeles",
  updatedAt: new Date(),
};

export async function getStudio() {
  const studio = await prisma.studioSetting.findUnique({ where: { id: "studio" } });
  return studio ?? STUDIO_FALLBACK;
}

export async function getArtists() {
  return prisma.artist.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { portfolio: { orderBy: { sortOrder: "asc" }, take: 3 } },
  });
}

export async function getArtistBySlug(slug: string) {
  return prisma.artist.findUnique({
    where: { slug },
    include: {
      portfolio: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] },
      appointmentTypes: { include: { appointmentType: true } },
      availability: { orderBy: { dayOfWeek: "asc" } },
    },
  });
}

export async function getAppointmentTypes() {
  return prisma.appointmentType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      artists: { include: { artist: true } },
    },
  });
}

export async function getPortfolio(limit?: number) {
  return prisma.portfolioItem.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: { artist: true },
  });
}

// Booking flow needs types + the artists that offer each.
export async function getBookingOptions() {
  const types = await prisma.appointmentType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      artists: {
        include: { artist: true },
        where: { artist: { active: true, bookingOpen: true } },
      },
    },
  });
  return types;
}
