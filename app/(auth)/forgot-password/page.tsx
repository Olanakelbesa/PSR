'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import api from '@/lib/axios'
import { API_ENDPOINTS } from '@/api/endpoints'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { useAuthStore } from '@/stores/auth-store'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const beginOtpFlow = useAuthStore((state) => state.beginOtpFlow)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    try {
      await api.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
        email: data.email,
      })
      beginOtpFlow({ email: data.email, intent: 'password-reset' })
      toast.success('Verification code sent')
      router.push(`/verify-otp?intent=password-reset&email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to request password reset code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Forgot password?</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            No worries, we will send you a 6-digit verification code.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="h-12 bg-muted/50 border-muted focus:bg-background transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
