import type { InputHTMLAttributes, ReactNode, Ref } from "react";

/*
 * TextField — a labelled text input with an inline error slot.
 *
 * §3 says field-level validation errors go inline, right under the field. This
 * bundles label + input + error into one accessible unit so every form gets that
 * for free and can't forget the wiring:
 *   - label's htmlFor ↔ input's id           (click label focuses input)
 *   - aria-invalid when there's an error       (announces "invalid" to screen readers)
 *   - aria-describedby ↔ the error's id        (reads the error text on focus)
 *
 * `leadingIcon` is optional. When provided, the input renders inside a bordered
 * container (daisyUI v5's input-as-wrapper pattern) with the icon in front;
 * without it, the plain input is used so existing forms are visually unchanged.
 *
 * `ref` is a normal prop here (React 19) so `{...register("field")}` from
 * react-hook-form — which includes a ref — spreads directly onto this component.
 */
/*
 * Keyboard focus. The inner input is transparent inside a bordered wrapper, so
 * the wrapper is what reads as "the field" — it takes the ring via
 * has-focus-visible. The plain (icon-less) variant is itself the bordered
 * box, so it takes the ring directly.
 *
 * :focus-visible rather than :focus means the reveal button and other controls
 * don't flash a ring on a mouse click. (A text input still shows one when
 * clicked — per spec it always matches :focus-visible because it takes keyboard
 * input — which is the native behaviour we want.)
 */
const WRAPPER_RING =
  "has-focus-visible:outline-2 has-focus-visible:outline-primary has-focus-visible:outline-offset-2";
const SELF_RING = "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  leadingIcon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  error,
  id,
  ref,
  leadingIcon,
  className = "",
  ...rest
}: TextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  const input = (
    <input
      id={id}
      ref={ref}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      className={
        leadingIcon
          ? // The wrapper below is the control the user sees, so it carries the
            // focus ring; suppressing it here avoids a ring inside a ring.
            `grow bg-transparent outline-none ${className}`
          : `input input-bordered w-full ${SELF_RING} ${error ? "input-error" : ""} ${className}`
      }
      {...rest}
    />
  );

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label mb-1.5">
        <span className="label-text font-medium">{label}</span>
      </label>

      {leadingIcon ? (
        <div
          className={`input input-bordered flex w-full items-center gap-2 bg-base-200 ${WRAPPER_RING} ${
            error ? "input-error" : ""
          }`}
        >
          <span className="shrink-0 text-base-content/40">{leadingIcon}</span>
          {input}
        </div>
      ) : (
        input
      )}

      {/* Error text pairs color WITH words, never color alone (§5). */}
      {error && (
        <span id={errorId} role="alert" className="label-text-alt text-error mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
