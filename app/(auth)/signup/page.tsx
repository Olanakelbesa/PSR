"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTitles } from "@/lib/queries/titles";
import { useUnits } from "@/lib/queries/units";
import { useOrganizationTypes } from "@/lib/queries/organization-types";
import { useOrganizations } from "@/lib/queries/organizations";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/useAutoSave";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const STEPS = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Affiliation", icon: Building2 },
  { id: 3, title: "Security", icon: ShieldCheck },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beginOtpFlow = useAuthStore((state) => state.beginOtpFlow);

  const { data: titles = [], isLoading: isLoadingTitles } = useTitles();
  const { data: units = [], isLoading: isLoadingUnits } = useUnits();
  const { data: organizationTypes = [], isLoading: isLoadingOrgTypes } =
    useOrganizationTypes();
  const { data: organizations = [], isLoading: isLoadingOrgs } =
    useOrganizations();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      sex: "Male" as any,
      organizationType: "",
      organization: "",
      unit: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedOrgType = form.watch("organizationType");
  const selectedOrg = form.watch("organization");
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    form.setValue("organization", "");
  }, [selectedOrgType, form]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    form.setValue("unit", "");
  }, [selectedOrg, form]);

  const filteredOrganizations = selectedOrgType
    ? organizations.filter((org) => org.orgType.toString() === selectedOrgType)
    : [];

  const filteredUnits = selectedOrg
    ? units.filter((u) => u.organization.toString() === selectedOrg)
    : [];

  const values = form.watch();

  const { isSaving, lastSaved } = useAutoSave({
    data: values,
    onSave: async (data) => {
      if (typeof window !== "undefined") {
        const { password, confirmPassword, ...secureDraft } = data;
        localStorage.setItem("signupDraft", JSON.stringify(secureDraft));
      }
    },
    delay: 1000,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem("signupDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          form.reset({
            ...form.getValues(),
            ...parsed,
          });
        } catch (e) {
          console.error("Failed to parse draft:", e);
        }
      }
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 0);
    }
  }, [form]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["title", "firstName", "lastName", "sex", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["organizationType", "organization", "unit"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  async function onSubmit(data: RegisterFormData) {
    try {
      setIsLoading(true);
      setError(null);

      // Map camelCase keys to backend snake_case parameters, parsing string selections back to integers
      const payload = {
        email: data.email,
        first_name: data.firstName,
        middle_name: data.middleName || "",
        last_name: data.lastName,
        phone: data.phone,
        sex: data.sex,
        title: parseInt(data.title, 10),
        organization_type: parseInt(data.organizationType, 10),
        organization: parseInt(data.organization, 10),
        unit: parseInt(data.unit, 10),
        password: data.password,
        password2: data.confirmPassword,
      };

      console.log("Submitting registration to backend:", payload);

      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, payload);

      beginOtpFlow({ email: data.email, intent: "registration" });

      // Clear draft on successful registration so it's not restored next time they visit
      if (typeof window !== "undefined") {
        localStorage.removeItem("signupDraft");
      }

      toast.success("Verification code sent to your email!");
      router.push(`/verify-otp?intent=registration&email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      console.error("Failed to register:", err);
      
      const errorMessage = err?.message || "Registration failed";
      
      // If there are detailed field-specific errors, display them as toasts
      if (err?.errors && typeof err.errors === "object") {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => {
              // Humanize the field name (e.g. confirmPassword -> Confirm Password)
              const formattedField = field
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .replace("_", " ");
              toast.error(`${formattedField}: ${msg}`, { duration: 5000 });
            });
          } else if (typeof messages === "string") {
            toast.error(messages, { duration: 5000 });
          }
        });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
              <svg
                className="h-7 w-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">RPDMS</h2>
              <p className=" text-white/70  font-medium ">Policy & Research</p>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight lg:text-4xl mb-6 leading-[1.1]">
            Empowering Ethiopia's{" "}
            <span className="text-primary-foreground underline decoration-primary-foreground/30 underline-offset-8">
              Policy Intelligence.
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl leading-relaxed">
            Join the national ecosystem of educators, researchers, and policy
            makers working together to transform the education sector.
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
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                      step === s.id
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                        : step > s.id
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {step > s.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-[2px] w-12 sm:w-20 mx-2 transition-all duration-500",
                        step > s.id ? "bg-emerald-500" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {step === 1
                    ? "Personal Profile"
                    : step === 2
                      ? "Professional Affiliation"
                      : "Security & Account"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  {step === 1
                    ? "Tell us who you are"
                    : step === 2
                      ? "Where do you work?"
                      : "Finalize your credentials"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium transition-all duration-300 shrink-0 pt-1.5">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Saved</span>
                  </>
                ) : null}
              </div>
            </div>
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
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            Title
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoadingTitles}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 bg-muted/30 border-muted w-full">
                                <SelectValue
                                  placeholder={
                                    isLoadingTitles ? "Loading..." : "Title"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {titles.map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name}
                                </SelectItem>
                              ))}
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
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First Name"
                              className="h-11 bg-muted/30 border-muted"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            Middle (Opt)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Middle Name"
                              className="h-11 bg-muted/30 border-muted"
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
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Last Name"
                              className="h-11 bg-muted/30 border-muted"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Phone Number
                        </FormLabel>
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
                              "phone-input-container",
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
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Sex
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Organization Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingOrgTypes}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 w-full bg-muted/30 border-muted">
                              <SelectValue
                                placeholder={
                                  isLoadingOrgTypes
                                    ? "Loading..."
                                    : "Select Organization Type"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizationTypes.map((o) => (
                              <SelectItem key={o.id} value={o.id.toString()}>
                                {o.name}
                              </SelectItem>
                            ))}
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
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Organization Name
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                          disabled={!selectedOrgType || isLoadingOrgs}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 w-full bg-muted/30 border-muted">
                              <SelectValue
                                placeholder={
                                  isLoadingOrgs
                                    ? "Loading..."
                                    : !selectedOrgType
                                      ? "Select Organization Type First"
                                      : "Select Organization"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredOrganizations.map((o) => (
                              <SelectItem key={o.id} value={o.id.toString()}>
                                {o.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Unit / Department
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                          disabled={!selectedOrg || isLoadingUnits}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 bg-muted/30 border-muted w-full">
                              <SelectValue
                                placeholder={
                                  isLoadingUnits
                                    ? "Loading..."
                                    : !selectedOrg
                                      ? "Select Organization First"
                                      : "Select Unit / Department"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredUnits.map((u) => (
                              <SelectItem key={u.id} value={u.id.toString()}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="h-11 bg-muted/30 border-muted"
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter password"
                              className="h-11 bg-muted/30 border-muted pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4.5 w-4.5" />
                              ) : (
                                <Eye className="h-4.5 w-4.5" />
                              )}
                            </button>
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
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Confirm
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              className="h-11 bg-muted/30 border-muted pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4.5 w-4.5" />
                              ) : (
                                <Eye className="h-4.5 w-4.5" />
                              )}
                            </button>
                          </div>
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
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-20"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Back</span>
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                    onClick={nextStep}
                  >
                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="mt-8">
            <div className="relative flex justify-center items-center text-xs font-medium">
              <span className="bg-background px-4 text-muted-foreground">
                Already have an account?
              </span>
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
  );
}
