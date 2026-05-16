"use client";

import Link from "next/link";
import { MoveLeft, Home, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Visual Element */}
        <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-8xl font-black tracking-tighter text-primary">
              404
            </span>
          </div>
         
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-foreground tracking-tight sm:text-4xl">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The page you're looking for has been moved, deleted, or never existed in the first place.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-8 h-12 rounded-xl border-primary/20 hover:bg-primary/5 transition-all group"
            onClick={() => window.history.back()}
          >
            <MoveLeft className="w-2 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            asChild
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
