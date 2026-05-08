'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'

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
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = form.watch('password')

  // Password strength indicators
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  async function onSubmit() {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Success!</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your password has been successfully reset. You can now sign in with your new credentials.
          </p>

          <div className="mt-10">
            <Button 
              className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
              onClick={() => router.push('/login')}
            >
              Continue to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Set new password</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please choose a strong password that you haven't used before.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="h-12 bg-muted/50 border-muted focus:bg-background transition-all pr-12"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password strength indicators */}
            {password && (
              <div className="rounded-xl bg-muted/30 p-4 border border-muted/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Security Requirements</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className={cn('flex items-center gap-2 transition-colors', hasMinLength ? 'text-primary' : 'text-muted-foreground')}>
                    <div className={cn('h-1.5 w-1.5 rounded-full', hasMinLength ? 'bg-primary' : 'bg-muted-foreground')} />
                    8+ characters
                  </div>
                  <div className={cn('flex items-center gap-2 transition-colors', hasUppercase ? 'text-primary' : 'text-muted-foreground')}>
                    <div className={cn('h-1.5 w-1.5 rounded-full', hasUppercase ? 'bg-primary' : 'bg-muted-foreground')} />
                    Uppercase letter
                  </div>
                  <div className={cn('flex items-center gap-2 transition-colors', hasLowercase ? 'text-primary' : 'text-muted-foreground')}>
                    <div className={cn('h-1.5 w-1.5 rounded-full', hasLowercase ? 'bg-primary' : 'bg-muted-foreground')} />
                    Lowercase letter
                  </div>
                  <div className={cn('flex items-center gap-2 transition-colors', hasNumber ? 'text-primary' : 'text-muted-foreground')}>
                    <div className={cn('h-1.5 w-1.5 rounded-full', hasNumber ? 'bg-primary' : 'bg-muted-foreground')} />
                    At least one number
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="h-12 bg-muted/50 border-muted focus:bg-background transition-all pr-12"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
