import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { useResetPassword } from "../auth.queries";
import { resetPasswordFormSchema, type ResetPasswordForm } from "../auth.schema";
import { AuthLayout } from "../AuthLayout";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";

/*
 * Reset password — the landing page for the emailed link
 * (/reset-password?token=…). The token is read from the query string, never
 * typed. Three states: no/invalid token → dead-end banner; the form; success.
 *
 * On success the backend kills all sessions, so we don't auto-authenticate — we
 * send the user to sign in fresh with the new password.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Reached without a token (e.g. link truncated, opened bare URL) — there's
  // nothing to submit against, so don't render a form that can only 400.
  if (!token) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-bold text-base-content">Invalid reset link</h1>
          <Banner variant="error">This password reset link is missing or malformed. Request a new one to continue.</Banner>
          <Link to="/forgot-password" className="link link-hover text-sm text-primary">
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-start gap-4">
          <SuccessMark />
          <div>
            <h1 className="text-2xl font-bold text-base-content">Password updated</h1>
            <p className="mt-2 text-sm text-base-content/70">
              Your password has been changed. For your security you've been signed out everywhere — sign in again with
              your new password.
            </p>
          </div>
          <Link to="/login" className="mt-2">
            <Button>Go to sign in</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = (data: ResetPasswordForm) => reset.mutate({ token, newPassword: data.newPassword });

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Set a new password</h1>
        <p className="mt-1.5 text-sm text-base-content/60">Choose a password you don't use anywhere else.</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Token rejection (expired/used/unknown) is request-level, not field-level. */}
        {reset.isError && <Banner variant="error">{reset.error.message}</Banner>}

        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          autoFocus
          leadingIcon={<LockIcon />}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          leadingIcon={<LockIcon />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          block
          loading={reset.isPending}
          className="border-0 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-md hover:brightness-105"
        >
          {reset.isPending ? "Updating…" : "Reset password"}
        </Button>

        <Link to="/login" className="link link-hover text-center text-sm text-primary">
          ← Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}

function SuccessMark() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>
    </span>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
