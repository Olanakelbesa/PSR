import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, FileText } from "lucide-react";

export default async function CallsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Open Grant Calls
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse available funding opportunities
            </p>
          </div>
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">
              No open calls at the moment
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back later for new funding opportunities
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
