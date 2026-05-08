'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'

export default function VerifyOTPPage() {
  const router = useRouter()
  const { verifyOTP, otpEmail, isLoading, setOtpEmail } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Redirect if no email is set (user navigated directly)
    if (!otpEmail) {
      router.push('/login')
      return
    }

    // Focus first input
    inputRefs.current[0]?.focus()

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [otpEmail, router])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every((digit) => digit)) {
      handleSubmit(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit
    })
    setOtp(newOtp)

    // Focus last filled input or submit
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()

    if (pastedData.length === 6) {
      handleSubmit(pastedData)
    }
  }

  async function handleSubmit(code?: string) {
    const otpCode = code || otp.join('')
    if (otpCode.length !== 6 || !otpEmail) return

    try {
      setError(null)
      await verifyOTP({ email: otpEmail, otp: otpCode })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = () => {
    // In a real app, this would trigger a new OTP send
    setResendTimer(30)
    setError(null)
    console.log('[Demo] Resending OTP to:', otpEmail)
  }

  const handleBack = () => {
    setOtpEmail(null)
    router.push('/login')
  }

  if (!otpEmail) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify your identity</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {"We've sent a 6-digit security code to"}{' '}
            <span className="font-semibold text-foreground">{otpEmail}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="flex justify-between gap-2 sm:gap-4">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-14 w-full border-muted bg-muted/50 text-center text-2xl font-bold transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 sm:h-16"
                disabled={isLoading}
              />
            ))}
          </div>

          <Button
            onClick={() => handleSubmit()}
            className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading || otp.some((digit) => !digit)}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Verify Account'
            )}
          </Button>

          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              {"Didn't receive the code?"}{' '}
              {resendTimer > 0 ? (
                <span className="font-medium text-foreground">Resend in {resendTimer}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Resend code
                </button>
              )}
            </p>

            <button
              onClick={handleBack}
              className="group flex items-center justify-center gap-2 mx-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </button>
          </div>
        </div>

        {/* <div className="mt-12 rounded-2xl bg-muted/30 p-4 text-center border border-muted/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Demo Access</p>
          <p className="text-sm text-muted-foreground">
            Use OTP: <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded">123456</span>
          </p>
        </div> */}
      </div>
    </div>
  )
}
