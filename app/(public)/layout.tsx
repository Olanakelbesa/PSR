import { Suspense } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-grow pt-20">
        <Suspense fallback={<div className="min-h-[40vh]" />}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}
