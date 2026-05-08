'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff } from 'lucide-react'

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
import { useAuthStore } from '@/stores/auth-store'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

export default function SignupPage() {
  const router = useRouter()
  const { setLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      institution: '',
    },
  })

  async function onSubmit(data: RegisterFormData) {
    try {
      setIsLoading(true)
      setError(null)
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/login?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Hero Image & Branding */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src="/images/auth/signup.jpg"
          alt="Education Research and Collaboration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <svg
                className="h-8 w-8 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">PSR Platform</h2>
              <p className="text-sm text-white/70">Policy and Research System </p>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Join the Policy and Research Community
          </h1>
          <p className="text-lg text-white/80 max-w-xl leading-relaxed">
            Collaborate with leading educators, access academic resources, and contribute to the transformation of Ethiopia's education system.
          </p>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 bg-background">
        <div className="mx-auto w-full max-w-sm lg:w-[450px]">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register as a researcher or academic partner
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">First name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Abebe"
                          className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Last name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Kebede"
                          className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Institution</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Addis Ababa University"
                        className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Confirm</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="h-11 bg-muted/50 border-muted focus:bg-background transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-0 text-xs text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </Button>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
