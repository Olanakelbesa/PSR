'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import api from '@/lib/axios'
import { API_ENDPOINTS } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth-store'

type OtpIntent = 'registration' | 'password-reset'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { otpEmail, otpIntent, beginOtpFlow, clearOtpFlow } = useAuthStore()
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(30)

  const email = searchParams.get('email') || otpEmail || ''
  const intent = (searchParams.get('intent') || otpIntent || 'registration') as OtpIntent

  useEffect(() => {
    if (!email) {
      router.replace('/login')
      return
    }

    beginOtpFlow({ email, intent })

    const timer = window.setInterval(() => {
      setResendTimer((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [beginOtpFlow, email, intent, router])

  const title = useMemo(
    () => (intent === 'password-reset' ? 'Verify your reset code' : 'Verify your account'),
    [intent],
  )

  const description =
    intent === 'password-reset'
      ? "Enter the 6-digit code we sent to your email to continue resetting your password."
      : "Enter the 6-digit code we sent to finish creating your account."

  async function resendCode() {
    try {
      setIsLoading(true)
      setError(null)

      if (intent === 'password-reset') {
        await api.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, { email })
      } else {
        toast.info('Registration code was already sent during sign up.')
        return
      }

      setResendTimer(30)
      toast.success('A new verification code was sent')
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to resend the verification code')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit() {
    if (otp.length !== 6) return

    setIsLoading(true)
    setError(null)

    try {
      if (intent === 'password-reset') {
        await api.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY, { email, otp })
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
        return
      }

      await api.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY, { email, otp })
      clearOtpFlow()
      toast.success('Account verified successfully')
      router.push('/login?registered=true')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Invalid or expired verification code'
      setError(message)
      setOtp('')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {description}{' '}
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleSubmit}
            className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify code'}
          </Button>

          <div className="space-y-5 text-center">
            {intent === 'password-reset' ? (
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className="font-medium text-foreground">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={resendCode}
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Resend code
                  </button>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Need a new code? Go back to sign up and submit again.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                clearOtpFlow()
                router.push(intent === 'password-reset' ? '/forgot-password' : '/signup')
              }}
              className="group mx-auto flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {intent === 'password-reset' ? 'Back to reset request' : 'Back to sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
