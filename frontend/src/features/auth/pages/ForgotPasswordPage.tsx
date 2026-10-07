import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useForgotPassword } from "../auth.queries";
import { forgotPasswordSchema, type ForgotPasswordRequest } from "../auth.schema";
import { AuthLayout } from "../AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";

/*
 * Forgot password — enter an email, we send a reset link.
 *
 * Security note: the backend returns 200 even when the email matches no account
 * (no enumeration). So on success we show ONE neutral message regardless — never
 * "no such user". Only a genuine request failure (network/validation) surfaces an
 * error. `isSuccess` therefore == "the request went through," not "the email exists."
 */
export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotPasswordRequest) => forgot.mutate(data);

  if (forgot.isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-start gap-4">
          <SuccessMark />
          <div>
            <h1 className="text-2xl font-bold text-base-content">Check your email</h1>
            <p className="mt-2 text-sm text-base-content/70">
              If an account exists for <span className="font-medium text-base-content">{getValues("email")}</span>, we've
              sent a link to reset your password. The link expires in 30 minutes.
            </p>
          </div>
          <p className="text-sm text-base-content/60">
            Didn't get it? Check your spam folder, or{" "}
            <button type="button" onClick={() => forgot.reset()} className="link link-hover text-primary">
              try a different email
            </button>
            .
          </p>
          <Link to="/login" className="link link-hover mt-2 text-sm text-primary">
            ← Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Forgot password?</h1>
        <p className="mt-1.5 text-sm text-base-content/60">
          Enter the email on your account and we'll send you a reset link.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        {forgot.isError && <Banner variant="error">{forgot.error.message}</Banner>}

        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@school.edu"
          leadingIcon={<MailIcon />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button
          type="submit"
          block
          loading={forgot.isPending}
          className="border-0 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-md hover:brightness-105"
        >
          {forgot.isPending ? "Sending…" : "Send reset link"}
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

function MailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
