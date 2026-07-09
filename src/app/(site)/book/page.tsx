import type { Metadata } from "next";
import { getBookingOptions, getStudio } from "@/lib/queries";
import { allowedChoices } from "@/lib/pricing";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { WizardType } from "@/components/booking/types";

export const metadata: Metadata = {
  title: "Book an appointment",
  description:
    "Book a custom tattoo appointment at Sable & Iron. Choose a service, artist, and time, then hold your chair with a secure deposit.",
};

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { artist?: string; canceled?: string };
}) {
  const [options, studio] = await Promise.all([getBookingOptions(), getStudio()]);

  const types: WizardType[] = options
    // Only offer types that at least one bookable artist provides.
    .filter((t) => t.artists.length > 0)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      durationMinutes: t.durationMinutes,
      priceCents: t.priceCents,
      depositCents: t.depositCents,
      paymentPolicy: t.paymentPolicy,
      requiresIntake: t.requiresIntake,
      color: t.color,
      allowedChoices: allowedChoices(t),
      artists: t.artists.map((a) => ({
        id: a.artist.id,
        slug: a.artist.slug,
        name: a.artist.name,
        title: a.artist.title,
        styles: a.artist.styles,
        avatarUrl: a.artist.avatarUrl,
      })),
    }));

  return (
    <div className="container-editorial py-14 md:py-20">
      <header className="max-w-2xl">
        <p className="kicker">Booking</p>
        <h1 className="mt-4 text-balance font-display text-5xl md:text-6xl">
          Hold your chair.
        </h1>
        <p className="mt-5 text-lg text-bone-muted">
          A few quick steps: choose a service and artist, pick a real open time,
          share your idea, and secure it with a deposit.
        </p>
        {studio.cancellationPolicy && (
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-bone-muted">
            {studio.cancellationPolicy}
          </p>
        )}
      </header>

      {searchParams.canceled && (
        <div className="mt-8 rounded-xl border border-ink-line bg-ink-soft px-5 py-4 text-sm text-bone-muted">
          Your checkout was canceled — no payment was taken. Your details are
          below; pick up where you left off whenever you&apos;re ready.
        </div>
      )}

      <div className="mt-12">
        {types.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="font-display text-2xl text-bone-muted">
              Booking is temporarily closed.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-bone-muted">
              Please check back soon or contact the studio
            </p>
          </div>
        ) : (
          <BookingWizard
            types={types}
            preselectedArtistSlug={searchParams.artist}
          />
        )}
      </div>
    </div>
  );
}
