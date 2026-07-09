import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="relative z-10 min-h-screen pt-16 md:pt-20">{children}</main>
      <SiteFooter />
    </>
  );
}
