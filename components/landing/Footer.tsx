"use client";

import Link from "next/link";
import { FileText, Globe, Users, Lock, BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tighter uppercase">
                PSR <span className="text-primary">Global</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-bold max-w-xs">
              The world's most advanced operating system for policy
              intelligence and research lifecycles.
            </p>
            <div className="flex items-center gap-4">
              {[Globe, Users, Lock, BookOpen].map((Icon, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                title: "Platform",
                links: [
                  { label: "Repository", href: "/" },
                  { label: "Grant Calls", href: "/calls" },
                  { label: "Review System", href: "/login" },
                  { label: "Impact Labs", href: "/" },
                ],
              },
              {
                title: "Solutions",
                links: [
                  { label: "Government", href: "/about" },
                  { label: "Education", href: "/about" },
                  { label: "Health", href: "/about" },
                  { label: "Enterprise", href: "/about" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Docs", href: "/manuals" },
                  { label: "Case Studies", href: "/about" },
                  { label: "Attachments", href: "/attachments" },
                  { label: "Publications", href: "/publications" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/about" },
                  { label: "Privacy", href: "#" },
                  { label: "Audits", href: "#" },
                ],
              },
            ].map((col, i) => (
              <div key={i} className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  {col.title}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground font-bold hover:text-primary transition-all flex items-center group"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
          <p>© 2026 PSR Global Intelligence.</p>
          <div className="flex items-center gap-10">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
