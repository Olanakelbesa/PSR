"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileUp,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createContactUsMessage } from "@/api/services/contact-us.service";

const contactChannels = [
  {
    icon: Mail,
    label: "Email",
    value: "support@psr.global",
  },
];

export default function ContactPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const attachment = formData.get("attachment");
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      attachment:
        attachment instanceof File && attachment.size > 0 ? attachment : null,
    };

    try {
      const created = await createContactUsMessage(payload);
      setSuccessMessage(
        "Message submitted successfully. Our team will respond shortly.",
      );
      form.reset();
      setAttachmentName(null);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
      setErrorMessage(message || "We could not submit your request right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--background)))] text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-[-5rem] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-black tracking-tight leading-[0.95] sm:text-4xl md:text-6xl">
                Contact us
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground font-medium sm:text-base md:text-lg">
                Send your message using the form below.
              </p>
            </div>

            <Card className="border-border/70 bg-card/90 shadow-2xl backdrop-blur overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-cyan-500 to-emerald-400" />
              <CardHeader className="space-y-2 border-b border-border/70 px-4 pt-5 pb-4 sm:px-6 md:px-8">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <Send className="h-4 w-4 text-primary" />
                  Contact form
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                  Start your message
                </CardTitle>
                <CardDescription>
                  Keep it brief or include attachments if you need a faster response.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" name="name" placeholder="Your name" required />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input id="phone" name="phone" placeholder="Optional" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="What do you need help with?"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Describe your request, issue, or follow-up details..."
                      rows={7}
                      required
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="attachment">Attachment</Label>
                    <input
                      ref={fileInputRef}
                      id="attachment"
                      name="attachment"
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setAttachmentName(file?.name ?? null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                          <FileUp className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {attachmentName ?? "Choose a file"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PDF, image, or document attachment
                          </span>
                        </span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground sm:ml-auto">
                        Browse
                      </span>
                    </button>
                  </div>

                  {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-1">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 flex-1 rounded-2xl font-bold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Send message"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>{contactChannels[0].value}</span>
              </div>
              <Button asChild variant="outline" className="rounded-2xl font-bold">
                <Link href="/">
                  Back to home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}