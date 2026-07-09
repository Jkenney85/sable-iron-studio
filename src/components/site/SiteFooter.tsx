import Link from "next/link";
import { getStudio } from "@/lib/queries";

export async function SiteFooter() {
  const studio = await getStudio();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-24 border-t border-ink-line bg-ink-soft">
      <div className="container-editorial grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl">
            Sable <span className="text-vermilion">&amp;</span> Iron
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-muted">
            {studio.tagline || "Custom tattooing, built to last."} A private,
            appointment-only studio.
          </p>
          <Link href="/book" className="btn-primary mt-6">
            Book an appointment
          </Link>
        </div>

        <div>
          <div className="kicker">Visit</div>
          <address className="mt-4 space-y-1 text-sm not-italic text-bone-muted">
            {studio.addressLine1 && <div>{studio.addressLine1}</div>}
            {studio.addressLine2 && <div>{studio.addressLine2}</div>}
            {(studio.city || studio.region) && (
              <div>
                {studio.city}
                {studio.city && studio.region ? ", " : ""}
                {studio.region} {studio.postalCode}
              </div>
            )}
            {studio.phone && (
              <div className="pt-3">
                <a href={`tel:${studio.phone}`} className="hover:text-bone">
                  {studio.phone}
                </a>
              </div>
            )}
            {studio.email && (
              <div>
                <a href={`mailto:${studio.email}`} className="hover:text-bone">
                  {studio.email}
                </a>
              </div>
            )}
          </address>
        </div>

        <div>
          <div className="kicker">Explore</div>
          <ul className="mt-4 space-y-2 text-sm text-bone-muted">
            {[
              ["/artists", "Artists"],
              ["/gallery", "Gallery"],
              ["/book", "Book"],
              ["/contact", "Contact"],
              ["/admin", "Studio login"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-bone">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          {studio.instagram && (
            <a
              href={`https://instagram.com/${studio.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-xs text-bone-muted hover:text-vermilion"
            >
              {studio.instagram} ↗
            </a>
          )}
        </div>
      </div>

      <div className="container-editorial flex flex-col items-start justify-between gap-2 border-t border-ink-line py-6 font-mono text-[11px] uppercase tracking-widest text-bone-muted md:flex-row md:items-center">
        <span>© {year} Sable &amp; Iron Tattoo</span>
        <span>Must be 18+ with valid ID · Custom work by appointment</span>
      </div>
    </footer>
  );
}
