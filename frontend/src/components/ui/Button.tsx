import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * Button — the one button in the app.
 *
 * A "dumb" primitive: no data fetching, no business logic. It just maps a small
 * set of intents (variant/size) onto daisyUI's `btn` classes and adds a loading
 * state. Everything else (onClick, type, disabled, aria-*) passes straight
 * through via ...rest, so it behaves like a native <button>.
 *
 * `loading` is first-class because §3 of the guidelines requires button-triggered
 * actions to show a spinner IN the button and disable it while pending — this
 * bakes that in so every call site gets it for free.
 */
type Variant = "primary" | "secondary" | "accent" | "ghost" | "error";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  ghost: "btn-ghost",
  error: "btn-error",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "btn-sm",
  md: "",       // daisyUI's default size
  lg: "btn-lg",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;      // full-width
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      // A loading button must not also be clickable, so loading implies disabled.
      disabled={disabled || loading}
      // aria-busy tells assistive tech the control is working, not just visually.
      aria-busy={loading}
      className={`btn ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${
        block ? "btn-block" : ""
      } ${className}`}
      {...rest}
    >
      {loading && <span className="loading loading-spinner loading-sm" />}
      {children}
    </button>
  );
}
