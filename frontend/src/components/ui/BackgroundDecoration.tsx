import type { CSSProperties, ReactNode } from "react";

/*
 * BackgroundDecoration — a premium, calm, layered backdrop (see the
 * "Background Decoration Design Guide" in UI-GUIDELINES).
 *
 * Composition of subtle layers: organic blurred blobs (mesh + depth), an ambient
 * glow, a few floating orbs, one dot grid, soft concentric rings, and a faint
 * noise overlay. Everything is:
 *   - aria-hidden + pointer-events-none  → invisible to AT, never intercepts input
 *   - absolutely positioned, clipped     → lives entirely behind content
 *   - theme-token colored (primary / secondary / primary-content), low opacity,
 *     heavily blurred → recolors in both themes, never competes with the UI
 *
 * The parent must be `position: relative` (and usually `overflow-hidden`), with
 * real content raised above via `relative z-10`.
 *
 * `variant` only changes DENSITY — the visual language is identical everywhere.
 */
type DecoVariant = "auth" | "dashboard" | "landing" | "empty" | "modal";

export function BackgroundDecoration({
  variant = "auth",
  className = "",
}: {
  variant?: DecoVariant;
  className?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {LAYERS[variant]}
      {/* Noise sits on top of the color layers to break up any banding. */}
      <div className="absolute inset-0 deco-noise opacity-[var(--deco-noise)]" />
    </div>
  );
}

/* ---- building blocks ---------------------------------------------------- */

/** Large, heavily-blurred organic shape. Irregular border-radius reads as a blob. */
function Blob({ className = "", style, animate }: { className?: string; style?: CSSProperties; animate?: string }) {
  return (
    <div
      className={`absolute rounded-[60%_40%_55%_45%/50%_60%_40%_50%] blur-[80px] ${animate ?? ""} ${className}`}
      style={style}
    />
  );
}

/** Small soft circle. */
function Orb({ className = "", animate }: { className?: string; animate?: string }) {
  return <div className={`absolute rounded-full blur-[6px] ${animate ?? ""} ${className}`} />;
}

/** A low-opacity dot matrix, clipped to its box and kept away from headings. */
function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px] ${className}`}
    />
  );
}

/** Concentric hairline rings for extra depth in a corner. */
function Rings({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-[12%] rounded-full border border-primary/10" />
      <div className="absolute inset-[26%] rounded-full border border-primary/[0.07]" />
    </div>
  );
}

/* ---- per-variant compositions (density only) ---------------------------- */

const AUTH: ReactNode = (
  <>
    <Blob className="-right-24 -top-28 h-[420px] w-[420px] bg-primary/10" animate="deco-breathe" />
    <Blob className="-bottom-32 -left-24 h-[460px] w-[460px] bg-secondary/10" animate="deco-float" />
    <Blob className="right-1/3 top-1/2 h-[300px] w-[300px] bg-primary/[0.06]" />
    <DotGrid className="right-10 top-16 h-40 w-56 text-primary/15" />
    <Rings className="-bottom-16 -right-10 h-72 w-72" />
    <Orb className="left-[12%] top-[22%] h-16 w-16 bg-primary/15" animate="deco-drift" />
    <Orb className="right-[18%] bottom-[20%] h-10 w-10 bg-secondary/20" animate="deco-float" />
    <Orb className="left-[45%] top-[12%] h-6 w-6 bg-primary/20" />
  </>
);

/*
 * DASHBOARD — the authenticated canvas: about a third of auth's density.
 * Exactly two blobs, one dot grid, two orbs, one set of rings, plus the noise
 * layer the wrapper always adds.
 *
 * Opacity comes from the --deco-* tokens rather than fixed Tailwind values,
 * because dark needs nearly twice light for the same shapes to register at all
 * against #10131C. One class, two theme-correct results.
 */
const DASHBOARD: ReactNode = (
  <>
    <Blob
      className="-right-32 -top-32 h-[380px] w-[380px] bg-primary opacity-[var(--deco-blob)]"
      animate="deco-breathe"
    />
    <Blob
      className="-bottom-40 left-1/4 h-[420px] w-[420px] bg-secondary opacity-[var(--deco-blob)]"
      animate="deco-float"
    />
    <DotGrid className="right-10 top-24 h-40 w-56 text-primary opacity-[var(--deco-dots)]" />
    <Rings className="-bottom-20 -right-16 h-72 w-72 opacity-[var(--deco-ring)]" />
    <Orb className="right-[10%] top-[30%] h-12 w-12 bg-primary opacity-[var(--deco-ring)]" animate="deco-drift" />
    <Orb className="left-[8%] bottom-[22%] h-8 w-8 bg-secondary opacity-[var(--deco-ring)]" animate="deco-float" />
  </>
);

const LANDING: ReactNode = (
  <>
    <Blob className="-left-24 -top-24 h-[500px] w-[500px] bg-primary/10" animate="deco-float" />
    <Blob className="-right-32 top-1/4 h-[440px] w-[440px] bg-secondary/10" animate="deco-breathe" />
    <Blob className="-bottom-40 left-1/3 h-[520px] w-[520px] bg-primary/[0.07]" animate="deco-drift" />
    <DotGrid className="left-8 bottom-24 h-44 w-60 text-primary/15" />
    <DotGrid className="right-12 top-20 h-40 w-52 text-secondary/15" />
    <Rings className="-top-20 right-1/4 h-80 w-80" />
    <Orb className="left-[20%] top-[30%] h-20 w-20 bg-primary/15" animate="deco-float" />
    <Orb className="right-[24%] bottom-[26%] h-12 w-12 bg-secondary/20" animate="deco-drift" />
    <Orb className="left-[52%] top-[18%] h-8 w-8 bg-primary/20" />
  </>
);

const EMPTY: ReactNode = (
  <>
    <Blob className="-right-24 -top-24 h-[320px] w-[320px] bg-primary/[0.06]" animate="deco-breathe" />
    <Orb className="left-[16%] bottom-[24%] h-10 w-10 bg-primary/10" animate="deco-float" />
  </>
);

const MODAL: ReactNode = (
  <Blob className="-right-16 -top-16 h-[220px] w-[220px] bg-primary/[0.06]" />
);

const LAYERS: Record<DecoVariant, ReactNode> = {
  auth: AUTH,
  dashboard: DASHBOARD,
  landing: LANDING,
  empty: EMPTY,
  modal: MODAL,
};
