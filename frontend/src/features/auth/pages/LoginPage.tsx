import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { useLogin } from "../auth.queries";
import { useAuth } from "../auth.context";
import { loginRequestSchema, type LoginRequest } from "../auth.schema";
import { landingPathFor } from "@/routes/landing";
import { AuthLayout } from "../AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";

export function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    // One schema, two jobs (§4): loginRequestSchema drives both the request type
    // and the form's client-side rules ("did you type something").
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // Already signed in (e.g. navigated to /login manually) → go to their landing.
  if (isAuthenticated && user) {
    return <Navigate to={landingPathFor(user.type)} replace />;
  }

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data, {
      // On success the mutation already stored the session; now route them to the
      // page for their role. replace: true so Back doesn't return to the login form.
      onSuccess: (res) => navigate(landingPathFor(res.user.type), { replace: true }),
    });
  };

  return (
    <AuthLayout footer={<InstitutionNote />}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-base-content">Sign in</h1>
        <p className="mt-1.5 text-sm text-base-content/60">Enter your credentials to continue</p>
      </div>

      <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/*
          Request-level failure (bad credentials, deactivated account, network).
          Already normalized to ApiError by the axios interceptor. A banner, not a
          field error, because it isn't tied to one field (§2/§3).
        */}
        {login.isError && <Banner variant="error">{login.error.message}</Banner>}

        <TextField
          id="identifier"
          label="Username"
          type="text"
          autoComplete="username"
          autoFocus
          placeholder="Student No. / Employee No. / Username"
          leadingIcon={<UserIcon />}
          error={errors.identifier?.message}
          {...register("identifier")}
        />

        <div className="flex flex-col gap-3">
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            leadingIcon={<LockIcon />}
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="link link-hover text-sm font-medium text-primary">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Gradient primary button with a trailing arrow (matches the mock);
            still built on the Button primitive so loading/disabled/a11y come free. */}
        <Button
          type="submit"
          block
          loading={login.isPending}
          className="border-0 bg-linear-to-r from-primary to-secondary text-primary-content shadow-md hover:brightness-105"
        >
          {login.isPending ? (
            "Signing in…"
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign in
              <ArrowRightIcon />
            </span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

/* No self-registration — accounts are provisioned by an administrator. Rendered
   below the card via AuthLayout's footer slot (matches the mock). */
function InstitutionNote() {
  return (
    <p className="inline-flex items-center justify-center gap-1.5 text-xs text-base-content/50">
      <svg className="h-4 w-4 shrink-0 text-primary/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      Managed by your institution. Contact your administrator if you can't sign in.
    </p>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
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

function ArrowRightIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
