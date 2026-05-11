'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, User, Building2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth-store'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { cn } from '@/lib/utils'

import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const STEPS = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Affiliation', icon: Building2 },
  { id: 3, title: 'Security', icon: ShieldCheck },
]

const TITLES = ['Dr.', 'Prof.', 'Ato', 'W/ro', 'W/rt', 'Mr.', 'Ms.']
const ORG_TYPES = ['Ministry', 'University', 'Research Institute', 'Hospital', 'Private Sector', 'NGO', 'Other']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      sex: 'Male' as any,
      organizationType: '',
      organization: '',
      unit: '',
      password: '',
      confirmPassword: '',
    },
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = []
    if (step === 1) {
      fieldsToValidate = ['title', 'firstName', 'lastName', 'sex', 'phone']
    } else if (step === 2) {
      fieldsToValidate = ['organizationType', 'organization', 'unit']
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setStep(prev => prev + 1)
  }

  const prevStep = () => setStep(prev => prev - 1)

  async function onSubmit(data: RegisterFormData) {
    try {
      setIsLoading(true)
      setError(null)
      // Simulate registration based on the new model
      console.log('Registering user with data:', data)
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/login?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left side - Hero Image & Branding */}
      <div className="relative hidden lg:block lg:w-1/2 h-full">
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
            <div className="h-12 w-12 rounded-xl bg-primary/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
               <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
               </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">PSR Platform</h2>
              <p className=" text-white/70  font-medium ">Policy & Research</p>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight lg:text-4xl mb-6 leading-[1.1]">
            Empowering Ethiopia's <span className="text-primary-foreground underline decoration-primary-foreground/30 underline-offset-8">Policy Intelligence.</span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl leading-relaxed">
            Join the national ecosystem of educators, researchers, and policy makers working together to transform the education sector.
          </p>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex flex-1 flex-col px-6 py-12 lg:w-1/2 bg-background h-full overflow-y-auto">
        <div className="mx-auto my-auto w-full max-w-sm lg:w-[500px]">
          
          {/* Progress Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center group">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                    step === s.id ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : 
                    step > s.id ? "border-emerald-500 bg-emerald-500 text-white" : 
                    "border-muted bg-muted/30 text-muted-foreground"
                  )}>
                    {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "h-[2px] w-12 sm:w-20 mx-2 transition-all duration-500",
                      step > s.id ? "bg-emerald-500" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {step === 1 ? 'Personal Profile' : step === 2 ? 'Professional Affiliation' : 'Security & Account'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              {step === 1 ? 'Tell us who you are' : step === 2 ? 'Where do you work?' : 'Finalize your credentials'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/5 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-3 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              {/* STEP 1: Personal */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Title</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-muted/30 border-muted w-full">
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">First Name</FormLabel>
                          <FormControl><Input placeholder="First Name" className="h-11 bg-muted/30 border-muted" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Middle (Opt)</FormLabel>
                          <FormControl><Input placeholder="Middle Name" className="h-11 bg-muted/30 border-muted" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Last Name</FormLabel>
                          <FormControl><Input placeholder="Last Name" className="h-11 bg-muted/30 border-muted" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <PhoneInput
                            international
                            defaultCountry="ET"
                            limitMaxLength={true}
                            placeholder="Enter phone number"
                            value={field.value}
                            onChange={field.onChange}
                            className={cn(
                              "flex h-11 w-full rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              "phone-input-container"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Sex</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-muted/30 border-muted w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              )}

              {/* STEP 2: Affiliation */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 w-full bg-muted/30 border-muted">
                              <SelectValue placeholder="Select Organization Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ORG_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ministry of Education" className="h-11 bg-muted/30 border-muted" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Unit / Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Research Directorate" className="h-11 bg-muted/30 border-muted" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 3: Security */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" className="h-11 bg-muted/30 border-muted" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                className="h-11 bg-muted/30 border-muted"
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
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Confirm</FormLabel>
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              className="h-11 bg-muted/30 border-muted"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" className="h-12 w-20" onClick={prevStep} disabled={isLoading}>
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Back</span>
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button type="button" className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]" onClick={nextStep}>
                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Registration'}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="mt-8">
            <div className="relative flex justify-center items-center text-xs font-medium">
              <span className="bg-background px-4 text-muted-foreground">Already have an account?</span>
              <Link
                href="/login"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors "
              >
                Sign in 
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
