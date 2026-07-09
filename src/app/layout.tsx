import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Distinctive editorial pairing: Fraunces (high-contrast display serif) +
// Instrument Sans (clean grotesque) + IBM Plex Mono for labels/kickers.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sable & Iron — Custom Tattoo Studio",
    template: "%s · Sable & Iron",
  },
  description:
    "Sable & Iron is a private custom tattoo studio. Blackwork, fine line, neo-traditional and dotwork by appointment. Book online.",
  openGraph: {
    title: "Sable & Iron — Custom Tattoo Studio",
    description: "Custom tattooing, built to last. Book online.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
