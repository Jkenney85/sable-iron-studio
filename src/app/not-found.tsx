import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Lost the thread.</h1>
      <p className="mt-4 max-w-md text-bone-muted">
        This page doesn&apos;t exist. Head back and start again — the ink&apos;s
        still wet elsewhere.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/book" className="btn-outline">
          Book
        </Link>
      </div>
    </div>
  );
}
