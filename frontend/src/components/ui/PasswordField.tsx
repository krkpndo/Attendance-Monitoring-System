import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

/*
 * PasswordField — a labelled password input with an inline show/hide toggle.
 *
 * Mirrors TextField's accessibility contract (label ↔ id, aria-invalid,
 * aria-describedby → error) but adds a reveal button, because "did I type my
 * password right" is a real friction point — especially on mobile keyboards.
 * Extracted as its own primitive (§4) since password entry recurs across login,
 * reset-password (new + confirm), and change-password.
 *
 * The toggle is a real <button type="button"> so it never submits the form, is
 * keyboard-operable, exposes its state via aria-pressed, and gets a ≥44px hit
 * area for touch (§6).
 */
/* The bordered wrapper is the visible control, so it carries the focus ring —
   the inner input is transparent and deliberately outline-none. */
const WRAPPER_RING =
  "has-focus-visible:outline-2 has-focus-visible:outline-primary has-focus-visible:outline-offset-2";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  leadingIcon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function PasswordField({ label, error, id, ref, leadingIcon, className = "", ...rest }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label mb-1.5">
        <span className="label-text font-medium">{label}</span>
      </label>

      {/* daisyUI v5 input-as-container: the (optional) leading icon, the input,
          and the reveal button sit inside one bordered field so they read as a
          single control. */}
      <div
        className={`input input-bordered flex w-full items-center gap-2 pr-1 ${WRAPPER_RING} ${
          leadingIcon ? "bg-base-200" : ""
        } ${error ? "input-error" : ""}`}
      >
        {leadingIcon && <span className="shrink-0 text-base-content/40">{leadingIcon}</span>}
        <input
          id={id}
          ref={ref}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`grow bg-transparent outline-none ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-field text-base-content/50 transition-colors hover:text-base-content"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {error && (
        <span id={errorId} role="alert" className="label-text-alt text-error mt-1">
          {error}
        </span>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2M1 1l22 22" />
    </svg>
  );
}
