import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {/* pt-20 matches header height to prevent content overlap */}
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
}
