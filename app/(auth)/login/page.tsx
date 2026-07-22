"use client";

// ============================================================================
// PSR Platform — Login Page (NextAuth v5)
// ============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getSignInErrorMessage } from "@/lib/api/parse-backend-error";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function ensureMinDelay(startTime: number, ms = 800) {
    const elapsed = Date.now() - startTime;
    if (elapsed < ms) {
      await new Promise((r) => setTimeout(r, ms - elapsed));
    }
  }

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // Auth.js returns HTTP 200 with error details in the redirect URL, so `ok` alone
      // is not reliable — always check `error` before treating sign-in as successful.
      if (result?.error) {
        const message = getSignInErrorMessage(
          result,
          "Invalid email or password.",
        );
        await ensureMinDelay(startTime);
        toast.error("Sign in failed", { description: message });
        setIsLoading(false);
        return;
      }

      if (!result?.ok) {
        await ensureMinDelay(startTime);
        toast.error("Sign in failed", {
          description: "Invalid email or password.",
        });
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back", {
        description: "You have been signed in successfully.",
      });
      queryClient.clear();
      // Keep spinner alive — router.replace doesn't return a Promise in App Router,
      // so the spinner must stay visible until this component unmounts on navigation.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      await ensureMinDelay(startTime);
      toast.error("Something went wrong", {
        description: "Please try again in a moment.",
      });
      setIsLoading(false);
    }
    // Intentionally no finally block — on success isLoading stays true
    // until the page unmounts during navigation to /dashboard.
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border">
            <Image
              src="/moh_logo.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-cover"
              priority
            />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold tracking-tight text-foreground">
              RPDMS
            </span>
            <p className="text-xs text-muted-foreground">
              Research &amp; Policy Documents
            </p>
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border/60 shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription>
            Use your institutional email and password to access your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="name@institution.edu"
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                        className={cn(
                          "h-11",
                          fieldState.error &&
                            "border-destructive focus-visible:ring-destructive/25",
                        )}
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href={`/forgot-password${form.getValues("email") ? `?email=${encodeURIComponent(form.getValues("email"))}` : ""}`}
                        className="text-sm font-medium text-primary hover:underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          className={cn(
                            "h-11 pr-10",
                            fieldState.error &&
                              "border-destructive focus-visible:ring-destructive/25",
                          )}
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-11 w-full font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden
                    />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
