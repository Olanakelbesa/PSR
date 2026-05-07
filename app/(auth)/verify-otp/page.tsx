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
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Verify your identity</h1>
        <p className="text-muted-foreground">
          {"We've sent a 6-digit code to"}{' '}
          <span className="font-medium text-foreground">{otpEmail}</span>
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-center gap-2">
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
              className="w-12 h-14 text-center text-2xl font-bold"
              disabled={isLoading}
            />
          ))}
        </div>

        <Button
          onClick={() => handleSubmit()}
          className="w-full"
          disabled={isLoading || otp.some((digit) => !digit)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {"Didn't receive the code?"}{' '}
          {resendTimer > 0 ? (
            <span>Resend in {resendTimer}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="text-primary hover:underline font-medium"
            >
              Resend code
            </button>
          )}
        </p>

        <button
          onClick={handleBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to login
        </button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Demo OTP: <span className="font-mono font-medium text-foreground">123456</span>
        </p>
      </div>
    </div>
  )
}
