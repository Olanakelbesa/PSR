"use client";

import Link from "next/link";
import Image from "next/image";
import { Globe, Users, Lock, BookOpen } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-white/5 p-20">
      <div className="flex justify-between items-center">
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-background shadow-lg shadow-primary/10 ring-1 ring-border/50">
              <Image
                src="/moh_logo.png"
                alt="RPDMS"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">
              <span className="text-primary">RPDMS</span>
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            A modern digital platform for managing research and policy documents, workflows, collaboration, and institutional knowledge.
          </p>
        </div>
        <div className="text-muted-foreground">Developed by <Link href="https://www.moh.gov.et" target="_blank" className="text-primary hover:text-primary/90 transition-colors font-bold">MOH</Link></div>
      </div>
    </footer>
  );
}
