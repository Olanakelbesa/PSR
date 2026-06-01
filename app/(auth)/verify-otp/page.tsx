"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type OtpIntent = "registration" | "password-reset";

const RESEND_COOLDOWN_SECONDS = 10 * 60;

function formatResendCooldown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { otpEmail, otpIntent, beginOtpFlow, clearOtpFlow } = useAuthStore();

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [hasAttempted, setHasAttempted] = useState(false);
  const autoSubmitRef = useRef(false);

  const email = searchParams.get("email") || otpEmail || "";
  const intent = (searchParams.get("intent") ||
    otpIntent ||
    "registration") as OtpIntent;

  const copy = useMemo(() => {
    if (intent === "password-reset") {
      return {
        title: "Enter verification code",
        description:
          "We sent a 6-digit code to your email. Enter it below to reset your password.",
        verifyLabel: "Continue",
        backHref: "/forgot-password",
        backLabel: "Back to forgot password",
      };
    }
    return {
      title: "Verify your email",
      description:
        "We sent a 6-digit code to your email. Enter it below to activate your account.",
      verifyLabel: "Verify and continue",
      backHref: "/signup",
      backLabel: "Back to sign up",
    };
  }, [intent]);

  useEffect(() => {
    if (!email) {
      router.replace("/login");
      return;
    }
    beginOtpFlow({ email, intent });
  }, [beginOtpFlow, email, intent, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setResendTimer((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (error) setError(null);
  };

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6 || isVerifying) return;

    setHasAttempted(true);
    setIsVerifying(true);
    setError(null);

    try {
      if (intent === "password-reset") {
        await api.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY, {
          email,
          otp,
        });
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        return;
      }

      await api.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY, { email, otp });
      clearOtpFlow();
      toast.success("Email verified", {
        description: "You can now sign in with your new account.",
      });
      router.push("/login?registered=true");
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        apiErr.response?.data?.message ??
        apiErr.message ??
        "Invalid or expired verification code. Please try again.";

      setError(message);
      setOtp("");
      autoSubmitRef.current = false;
    } finally {
      setIsVerifying(false);
    }
  }, [clearOtpFlow, email, intent, isVerifying, otp, router]);

  useEffect(() => {
    if (otp.length !== 6 || isVerifying || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    void handleVerify();
  }, [otp, isVerifying, handleVerify]);

  async function resendCode() {
    if (resendTimer > 0 || isResending) return;

    try {
      setIsResending(true);
      setError(null);

      if (intent === "password-reset") {
        await api.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, { email });
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        toast.success("Code sent", {
          description: "Check your inbox for a new verification code.",
        });
        return;
      }

      toast.info("Use sign up to request a new code", {
        description:
          "Registration codes are sent when you submit the sign-up form.",
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message ?? "Unable to resend the verification code");
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">

      <Card className="w-full max-w-md border-border/60 shadow-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}{" "}
              Code sent to{" "}
              <span className="font-medium text-foreground break-all">
                {email}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              autoSubmitRef.current = true;
              void handleVerify();
            }}
            className="space-y-6"
            noValidate
          >
            {error && hasAttempted && (
              <div
                id="otp-error"
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="otp-input" className="sr-only">
                6-digit verification code
              </Label>
              <InputOTP
                id="otp-input"
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                disabled={isVerifying}
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                containerClassName="justify-center"
                aria-invalid={hasAttempted && !!error}
                aria-describedby={
                  error && hasAttempted ? "otp-error otp-hint" : "otp-hint"
                }
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-11 text-base" />
                  <InputOTPSlot index={1} className="h-12 w-11 text-base" />
                  <InputOTPSlot index={2} className="h-12 w-11 text-base" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-11 text-base" />
                  <InputOTPSlot index={4} className="h-12 w-11 text-base" />
                  <InputOTPSlot index={5} className="h-12 w-11 text-base" />
                </InputOTPGroup>
              </InputOTP>
              <p
                id="otp-hint"
                className="text-center text-xs text-muted-foreground"
              >
                Enter the 6-digit code from your email
              </p>
            </div>

            <Button
              type="submit"
              className="h-11 w-full font-medium"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Verifying…
                </>
              ) : (
                copy.verifyLabel
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4 border-t pt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="font-medium text-foreground tabular-nums">
                    Resend in {formatResendCooldown(resendTimer)}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 font-medium"
                    onClick={() => void resendCode()}
                    disabled={isResending || isVerifying}
                  >
                    {isResending ? "Sending…" : "Resend code"}
                  </Button>
                )}
              </p>

            <Button
              type="button"
              variant="ghost"
              className={cn(
                "mx-auto gap-2 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                clearOtpFlow();
                router.push(copy.backHref);
              }}
              disabled={isVerifying}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {copy.backLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

    </main>
  );
}
