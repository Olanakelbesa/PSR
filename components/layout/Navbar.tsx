"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Thematic Areas", href: "/thematic-areas" },
  { label: "Attachments", href: "/attachments" },
  { label: "Research Calls", href: "/calls" },
  { label: "Publications", href: "/publications" },
  { label: "Manuals", href: "/manuals" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 h-20 border-b border-white/5",
          isScrolled || isOpen
            ? "bg-background/90 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-300 h-10 w-10">
              <FileText className="text-primary-foreground transition-all h-5 w-5" />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="font-bold tracking-tighter uppercase transition-all text-xl">
                PSR <span className="text-primary">Global</span>
              </span>
              <span className="text-[8px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
                Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-muted-foreground/75">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "hover:text-primary transition-all relative group py-2",
                    isActive ? "text-primary" : "text-muted-foreground/70",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="font-bold hover:bg-primary/5 rounded-full px-4 text-sm h-9"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-9 px-6 font-bold shadow-md shadow-primary/10 hover:scale-105 active:scale-95 transition-all text-sm rounded-full"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
              className="h-10 w-10 rounded-xl bg-muted/20 hover:bg-muted/40 border border-white/5"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden bg-background/95 backdrop-blur-2xl transition-all duration-300 pt-24",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <nav className="container mx-auto px-6 py-8 flex flex-col gap-6 text-lg font-bold text-muted-foreground/80">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "hover:text-primary transition-all border-b border-white/5 pb-2",
                  isActive ? "text-primary border-primary/20" : "",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="flex flex-col gap-4 mt-8">
            <Button
              variant="outline"
              asChild
              onClick={() => setIsOpen(false)}
              className="w-full h-12 font-bold rounded-2xl"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              onClick={() => setIsOpen(false)}
              className="w-full h-12 font-bold rounded-2xl shadow-lg shadow-primary/20"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
