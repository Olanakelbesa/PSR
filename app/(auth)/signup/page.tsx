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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
] as const;

const SECURITY_FIELDS: (keyof RegisterFormData)[] = [
  "email",
  "password",
  "confirmPassword",
];

const STEP_FIELDS: Record<1 | 2 | 3, (keyof RegisterFormData)[]> = {
  1: ["title", "firstName", "lastName", "sex", "phone"],
  2: ["organizationType", "organization", "unit"],
  3: SECURITY_FIELDS,
};

function fieldInputClassName(hasError: boolean) {
  return cn(
    "h-11 bg-muted/30 border-muted focus:bg-background transition-colors",
    hasError && "border-destructive focus-visible:ring-destructive/25",
  );
}

const STEP_COPY: Record<number, { heading: string; description: string }> = {
  1: {
    heading: "Personal details",
    description: "Your name and contact information",
  },
  2: {
    heading: "Professional affiliation",
    description: "Your organization and department",
  },
  3: {
    heading: "Account security",
    description: "Email and password for sign-in",
  },
};

function SignupProgress({ currentStep }: { currentStep: number }) {
  const progressValue = Math.round((currentStep / STEPS.length) * 100);

  return (
    <nav aria-label="Registration progress" className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {progressValue}%
        </span>
      </div>
      <Progress value={progressValue} className="h-1.5" aria-hidden />
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((s) => {
          const isComplete = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          const Icon = s.icon;

          return (
            <li
              key={s.id}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  !isComplete &&
                    !isCurrent &&
                    "border-border bg-muted/50 text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium leading-tight",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepValidated, setStepValidated] = useState<Record<1 | 2 | 3, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const beginOtpFlow = useAuthStore((state) => state.beginOtpFlow);

  const { data: titles = [], isLoading: isLoadingTitles } = useTitles();
  const { data: units = [], isLoading: isLoadingUnits } = useUnits();
  const { data: organizationTypes = [], isLoading: isLoadingOrgTypes } =
    useOrganizationTypes();
  const { data: organizations = [], isLoading: isLoadingOrgs } =
    useOrganizations();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
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

  const securityStepAttempted = stepValidated[3];

  const revalidateCurrentStep = (stepNumber: 1 | 2 | 3) => {
    void form.trigger(STEP_FIELDS[stepNumber]);
  };

  const markStepValidated = (stepNumber: 1 | 2 | 3) => {
    setStepValidated((prev) => ({ ...prev, [stepNumber]: true }));
  };

  const resetStepValidation = (stepNumber: 1 | 2 | 3) => {
    setStepValidated((prev) => ({ ...prev, [stepNumber]: false }));
    form.clearErrors(STEP_FIELDS[stepNumber]);
  };

  const handleSecurityFieldChange = (
    onChange: (value: string) => void,
    value: string,
  ) => {
    onChange(value);
    if (!stepValidated[3]) return;
    if (error) setError(null);
    revalidateCurrentStep(3);
  };

  const handleStepFieldChange = (
    stepNumber: 1 | 2,
    onChange: (value: string) => void,
    value: string,
  ) => {
    onChange(value);
    if (!stepValidated[stepNumber]) return;
    revalidateCurrentStep(stepNumber);
  };

  const selectedOrgType = form.watch("organizationType");
  const selectedOrg = form.watch("organization");
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    form.setValue("organization", "");
    if (stepValidated[2]) revalidateCurrentStep(2);
  }, [selectedOrgType, form, stepValidated]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    form.setValue("unit", "");
    if (stepValidated[2]) revalidateCurrentStep(2);
  }, [selectedOrg, form, stepValidated]);

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
    if (!isValid) {
      markStepValidated(step as 1 | 2);
      return;
    }

    if (step === 2) {
      resetStepValidation(3);
      setError(null);
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step === 3) {
      resetStepValidation(3);
      setError(null);
    }
    setStep((prev) => prev - 1);
  };

  const handleCreateAccount = async () => {
    markStepValidated(3);
    const isValid = await form.trigger(SECURITY_FIELDS);
    if (!isValid) return;

    await onSubmit(form.getValues());
  };

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

      const apiError = err as {
        message?: string;
        errors?: Record<string, string[]>;
        error?: Record<string, string[]>;
        response?: { data?: any };
      };

      const rawFieldErrors =
        apiError.errors ??
        apiError.error ??
        apiError.response?.data?.errors ??
        apiError.response?.data?.error;

      const fieldErrorMessages = rawFieldErrors && typeof rawFieldErrors === "object"
        ? Object.entries(rawFieldErrors).flatMap(([field, messages]) => {
            const normalizedMessages = Array.isArray(messages)
              ? messages
              : [String(messages)];
            return normalizedMessages.map((message) => {
              const formattedField = field
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .replace(/_/g, " ");
              return `${formattedField}: ${message}`;
            });
          })
        : [];

      const errorMessage =
        fieldErrorMessages.length > 0
          ? fieldErrorMessages.join(" ")
          : apiError.message || "Registration failed";

      if (fieldErrorMessages.length > 0) {
        fieldErrorMessages.forEach((message) =>
          toast.error(message, { duration: 5000 }),
        );
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const stepMeta = STEP_COPY[step];

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col items-center gap-3">
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

      <Card className="w-full max-w-lg border-border/60 shadow-md">
        <CardHeader className="space-y-6 pb-4">
          <div className="space-y-1 text-center sm:text-left">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create account
            </CardTitle>
            <CardDescription>
              Register with your institutional details. Progress is saved
              automatically as you go.
            </CardDescription>
          </div>

          <SignupProgress currentStep={step} />

          <div className="flex items-start justify-between gap-4 border-t pt-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {stepMeta.heading}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stepMeta.description}
              </p>
            </div>
            <div
              className="shrink-0 text-xs text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Saving…
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Draft saved
                </span>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (step !== 3 || securityStepAttempted) && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 3) void handleCreateAccount();
              }}
              className="space-y-5"
            >
              {/* STEP 1: Personal */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>
                            Title
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              handleStepFieldChange(1, field.onChange, value)
                            }
                            value={field.value}
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
                          {stepValidated[1] && <FormMessage />}
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First Name"
                              className={fieldInputClassName(!!fieldState.error)}
                              aria-invalid={fieldState.invalid}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) =>
                                handleStepFieldChange(
                                  1,
                                  field.onChange,
                                  e.target.value,
                                )
                              }
                            />
                          </FormControl>
                          {stepValidated[1] && <FormMessage />}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Father's Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Father's Name"
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
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>
                            Grandfather's Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Grandfather's Name"
                              className={fieldInputClassName(!!fieldState.error)}
                              aria-invalid={fieldState.invalid}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) =>
                                handleStepFieldChange(
                                  1,
                                  field.onChange,
                                  e.target.value,
                                )
                              }
                            />
                          </FormControl>
                          {stepValidated[1] && <FormMessage />}
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            international
                            defaultCountry="ET"
                            limitMaxLength={true}
                            placeholder="Enter phone number"
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value ?? "");
                              if (stepValidated[1]) revalidateCurrentStep(1);
                            }}
                            className={cn(
                              "flex h-11 w-full rounded-md border bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              "phone-input-container",
                              fieldState.error
                                ? "border-destructive focus-visible:ring-destructive/25"
                                : "border-muted",
                            )}
                          />
                        </FormControl>
                        {stepValidated[1] && <FormMessage />}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Sex
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            handleStepFieldChange(1, field.onChange, value)
                          }
                          value={field.value}
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
                        {stepValidated[1] && <FormMessage />}
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
                        <FormLabel>
                          Organization Type
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            handleStepFieldChange(2, field.onChange, value)
                          }
                          value={field.value}
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
                        {stepValidated[2] && <FormMessage />}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Organization Name
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            handleStepFieldChange(2, field.onChange, value)
                          }
                          value={field.value}
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
                        {stepValidated[2] && <FormMessage />}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Unit / Department
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            handleStepFieldChange(2, field.onChange, value)
                          }
                          value={field.value}
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
                        {stepValidated[2] && <FormMessage />}
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
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@institution.edu"
                            autoComplete="email"
                            className={fieldInputClassName(!!fieldState.error)}
                            aria-invalid={fieldState.invalid}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value}
                            onChange={(e) =>
                              handleSecurityFieldChange(
                                field.onChange,
                                e.target.value,
                              )
                            }
                          />
                        </FormControl>
                        {securityStepAttempted && <FormMessage />}
                      </FormItem>
                    )}
                  />

                   <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="At least 8 characters"
                              autoComplete="new-password"
                              className={cn(
                                fieldInputClassName(!!fieldState.error),
                                "pr-10",
                              )}
                              aria-invalid={fieldState.invalid}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) =>
                                handleSecurityFieldChange(
                                  field.onChange,
                                  e.target.value,
                                )
                              }
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
                        {securityStepAttempted && <FormMessage />}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Re-enter your password"
                              autoComplete="new-password"
                              className={cn(
                                fieldInputClassName(!!fieldState.error),
                                "pr-10",
                              )}
                              aria-invalid={fieldState.invalid}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) =>
                                handleSecurityFieldChange(
                                  field.onChange,
                                  e.target.value,
                                )
                              }
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
                        {securityStepAttempted && <FormMessage />}
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 border-t pt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                    Back
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    className="h-11 flex-1 font-medium"
                    onClick={nextStep}
                    disabled={isLoading}
                  >
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 flex-1 font-medium"
                    disabled={isLoading}
                    onClick={() => void handleCreateAccount()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden
                        />
                        Creating account…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link
          href="/"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
