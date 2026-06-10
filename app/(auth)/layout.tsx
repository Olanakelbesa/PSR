import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        {children}
      </Suspense>
    </div>
  );
}
