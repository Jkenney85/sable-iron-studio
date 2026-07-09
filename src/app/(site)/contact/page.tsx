import type { Metadata } from "next";
import { getStudio } from "@/lib/queries";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Sable & Iron tattoo studio.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const studio = await getStudio();
  const hours = (studio.hoursJson as Record<string, string> | null) ?? null;

  return (
    <div className="container-editorial py-16 md:py-24">
      <div className="grid gap-14 md:grid-cols-2">
        <div>
          <p className="kicker">Get in touch</p>
          <h1 className="mt-4 text-balance font-display text-5xl md:text-7xl">
            Come say hello.
          </h1>
          <p className="mt-6 max-w-md text-lg text-bone-muted">
            Questions about a piece, pricing, or aftercare? Send a note. Ready to
            lock in a time?{" "}
            <a href="/book" className="text-vermilion hover:underline">
              Book online
            </a>
            .
          </p>

          <dl className="mt-12 space-y-8">
            <div>
              <dt className="kicker">Studio</dt>
              <dd className="mt-3 text-bone-soft">
                {studio.addressLine1}
                {studio.addressLine2 ? `, ${studio.addressLine2}` : ""}
                <br />
                {studio.city}, {studio.region} {studio.postalCode}
              </dd>
            </div>
            <div>
              <dt className="kicker">Reach us</dt>
              <dd className="mt-3 space-y-1 text-bone-soft">
                {studio.phone && (
                  <div>
                    <a href={`tel:${studio.phone}`} className="hover:text-vermilion">
                      {studio.phone}
                    </a>
                  </div>
                )}
                {studio.email && (
                  <div>
                    <a href={`mailto:${studio.email}`} className="hover:text-vermilion">
                      {studio.email}
                    </a>
                  </div>
                )}
                {studio.instagram && (
                  <div>
                    <a
                      href={`https://instagram.com/${studio.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-vermilion"
                    >
                      {studio.instagram}
                    </a>
                  </div>
                )}
              </dd>
            </div>
            {hours && (
              <div>
                <dt className="kicker">Hours</dt>
                <dd className="mt-3 grid max-w-xs grid-cols-2 gap-x-8 gap-y-1 font-mono text-sm">
                  {Object.entries(hours).map(([day, val]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-bone-muted">{day}</span>
                      <span className="text-bone-soft">{val}</span>
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="md:pt-16">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
