"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled || open
          ? "border-b border-ink-line bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <div className="container-editorial flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="Sable & Iron home">
          <span className="font-display text-xl tracking-tight md:text-2xl">
            Sable <span className="text-vermilion">&amp;</span> Iron
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "font-mono text-[11px] uppercase tracking-widest transition-colors",
                isActive(item.href)
                  ? "text-bone"
                  : "text-bone-muted hover:text-bone"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/book" className="btn-primary">
            Book Now
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="relative h-4 w-6">
            <span
              className={clsx(
                "absolute left-0 h-px w-6 bg-bone transition-all",
                open ? "top-2 rotate-45" : "top-0"
              )}
            />
            <span
              className={clsx(
                "absolute left-0 top-2 h-px w-6 bg-bone transition-all",
                open && "opacity-0"
              )}
            />
            <span
              className={clsx(
                "absolute left-0 h-px w-6 bg-bone transition-all",
                open ? "top-2 -rotate-45" : "top-4"
              )}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={clsx(
          "overflow-hidden border-t border-ink-line bg-ink/95 backdrop-blur-md transition-[max-height] duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="container-editorial flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "py-3 font-display text-2xl",
                isActive(item.href) ? "text-bone" : "text-bone-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/book" className="btn-primary mt-3 w-full">
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
