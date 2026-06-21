"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useChangePassword } from "@/hooks/useProfile";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/api/client";

function PasswordField({
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  visible,
  onToggleVisible,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className={cn("h-11 pr-10", invalid && "border-destructive")}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-11 w-10 text-muted-foreground hover:bg-transparent"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const checks = useMemo(
    () => [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
    ],
    [password],
  );

  if (!password) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Password requirements
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.label}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              check.met ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                check.met ? "bg-primary" : "bg-muted-foreground/50",
              )}
            />
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function applyServerFieldErrors(
  setError: ReturnType<typeof useForm<ChangePasswordFormData>>["setError"],
  errors?: Record<string, string[]>,
) {
  if (!errors) return;

  const fieldMap: Record<string, keyof ChangePasswordFormData> = {
    currentPassword: "currentPassword",
    newPassword: "newPassword",
    confirmPassword: "confirmPassword",
    current_password: "currentPassword",
    new_password: "newPassword",
    confirm_password: "confirmPassword",
  };

  for (const [field, messages] of Object.entries(errors)) {
    const mappedField = fieldMap[field];
    if (!mappedField) continue;
    const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
    setError(mappedField, { message });
  }
}

export function SecuritySettingsCard() {
  const changePassword = useChangePassword();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const onSubmit = async (values: ChangePasswordFormData) => {
    try {
      await changePassword.mutateAsync(values);
      form.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      toast.success("Your password has been updated.");
    } catch (error) {
      const apiError = error as ApiError;
      applyServerFieldErrors(form.setError, apiError.errors);
      toast.error(apiError.message ?? "Failed to update password.");
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Update your password regularly and use a strong, unique passphrase.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                      visible={showCurrentPassword}
                      onToggleVisible={() =>
                        setShowCurrentPassword((prev) => !prev)
                      }
                      invalid={fieldState.invalid}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        visible={showNewPassword}
                        onToggleVisible={() =>
                          setShowNewPassword((prev) => !prev)
                        }
                        invalid={fieldState.invalid}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <PasswordRequirements password={newPassword} />
              </div>

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <PasswordField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        visible={showConfirmPassword}
                        onToggleVisible={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        invalid={fieldState.invalid}
                      />
                    </FormControl>
                    {passwordsMatch && !fieldState.error ? (
                      <p className="text-xs text-primary">Passwords match</p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <KeyRound className="h-4 w-4" />
                Forgot your current password?
              </Link>
              <Button
                type="submit"
                disabled={changePassword.isPending}
                className="sm:min-w-[180px]"
              >
                {changePassword.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Update password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
