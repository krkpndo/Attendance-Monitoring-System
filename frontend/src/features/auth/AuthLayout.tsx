import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BackgroundDecoration } from "@/components/ui/BackgroundDecoration";

/*
 * AuthLayout — the split-screen shell shared by login / forgot / reset.
 *
 * Adaptive per §6, not merely responsive: on lg+ it's two columns — a branded
 * marketing panel beside an elevated form card. Below lg the whole panel is
 * *dropped* (a different pattern, not a reflow) and the card takes the screen,
 * so small viewports are form-first. Defining panel + card here once keeps the
 * three auth pages DRY (§4) and visually consistent.
 *
 * `footer` is an optional slot rendered below the card (e.g. login's "managed by
 * your institution" note) so page-specific chrome doesn't leak into the shell.
 *
 * Brand-token only: the panel gradient is primary→secondary (§1); the dashboard
 * preview is real markup in base tokens, so everything recolors in dark mode
 * with no hardcoded hex.
 */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Brand / marketing panel — desktop only */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-primary to-secondary text-primary-content lg:flex">
        <PanelDecor />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-12 p-10 xl:p-14">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
              Manage attendance.
              <br />
              Track classes.
              <br />
              Stay productive.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-content/80">
              A smarter way to monitor attendance, manage classes, and generate meaningful insights for your institution.
            </p>
          </div>
          <DashboardPreview />
        </div>
        <span className="absolute bottom-4 left-5 z-10 text-xs text-primary-content/60">
          © {new Date().getFullYear()} Attendance Monitoring System
        </span>
      </aside>

      {/* Form column */}
      <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 sm:p-6">
        {/* Abstract, low-opacity backdrop (guide-driven). Behind everything. */}
        <BackgroundDecoration variant="auth" />

        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex w-full max-w-lg flex-col gap-4">
          <div className="rounded-box border border-base-300 bg-base-100 p-8 shadow-xl sm:px-10 sm:py-14">{children}</div>
          {footer && <div className="px-2 text-center">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/*
 * Panel decoration — the abstract backdrop for the on-color hero (matches the
 * mock's left side). Same visual language as <BackgroundDecoration> (blobs,
 * glow, orbs, dot grid, noise, gentle motion) but tuned for a saturated
 * background: shapes are white / transparent-white (primary-content) + one
 * secondary-tinted blob, per the guide's color rules for colored surfaces.
 * Purely visual → aria-hidden, behind the panel's z-10 content.
 */
function PanelDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* ambient glow (soft luminous corner) */}
      <div className="absolute -left-16 -top-10 h-80 w-80 rounded-full bg-primary-content/10 blur-[100px]" />

      {/* large organic waves — moderate blur keeps an edge so they read as shapes */}
      <div className="absolute -right-24 top-1/2 h-130 w-130 -translate-y-1/2 rounded-[42%_58%_57%_43%/48%_38%_62%_52%] bg-primary-content/6 blur-2xl deco-float" />
      <div className="absolute -top-20 right-10 h-90 w-90 rounded-[60%_40%_45%_55%/55%_50%_50%_45%] bg-primary-content/5 blur-2xl deco-breathe" />
      <div className="absolute -bottom-24 -left-16 h-95 w-95 rounded-[55%_45%_60%_40%/50%_55%_45%_50%] bg-secondary/30 blur-[90px] deco-drift" />

      {/* glass floating orbs (crisp ring, minimal blur) */}
      <div className="absolute right-[16%] top-[20%] h-24 w-24 rounded-full bg-primary-content/10 ring-1 ring-primary-content/20 backdrop-blur-sm deco-float" />
      <div className="absolute bottom-[16%] left-[8%] h-14 w-14 rounded-full bg-primary-content/10 ring-1 ring-primary-content/15 deco-drift" />
      <div className="absolute left-[42%] top-[10%] h-3 w-3 rounded-full bg-primary-content/30" />

      {/* dot grid, upper-right, away from the headline */}
      <div className="absolute right-16 top-24 h-28 w-40 text-primary-content/25 bg-[radial-gradient(currentColor_1.2px,transparent_1.2px)] bg-size-[16px_16px]" />

      {/* deepen the far corner for text contrast against the divider */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent to-black/20" />

      {/* faint noise so the gradient doesn't band */}
      <div className="absolute inset-0 deco-noise opacity-[0.03] mix-blend-overlay" />
    </div>
  );
}

/* In-code dashboard mock (§dataviz spirit, but decorative) — evokes the product
   without a raster asset, so it stays crisp and themes correctly. aria-hidden
   because it carries no real information for assistive tech. */
function DashboardPreview() {
  return (
    <div aria-hidden className="relative w-full max-w-md">
      {/* floating check badge */}
      <div className="absolute -right-3 top-1/3 z-20 grid h-11 w-11 place-items-center rounded-xl bg-base-100 text-primary shadow-lg">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <div className="rounded-2xl bg-base-100/95 p-3 text-base-content shadow-2xl ring-1 ring-black/5 backdrop-blur">
        <div className="flex gap-3">
          {/* icon rail */}
          <div className="flex flex-col items-center gap-2.5 rounded-xl bg-base-200 px-2 py-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`grid h-6 w-6 place-items-center rounded-md ${i === 0 ? "bg-primary/15 text-primary" : "text-base-content/25"}`}
              >
                <span className="h-2.5 w-2.5 rounded-sm bg-current" />
              </span>
            ))}
          </div>

          {/* content */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Dashboard</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-base-content/20" />
                ))}
              </span>
            </div>

            {/* stat tiles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-base-300 p-2.5">
                <div className="text-[10px] text-base-content/60">Today's Attendance</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold">92%</span>
                  <span className="text-[10px] text-base-content/60">Present</span>
                </div>
                <div className="mt-1 text-[10px] font-medium text-success">↑ 8% vs yesterday</div>
              </div>
              <div className="rounded-lg border border-base-300 p-2.5">
                <div className="text-[10px] text-base-content/60">Total Students</div>
                <div className="mt-1 text-xl font-bold">1,245</div>
                <div className="mt-1 text-[10px] text-base-content/60">Active</div>
              </div>
            </div>

            {/* charts */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-base-300 p-2.5">
                <div className="mb-1 text-[10px] text-base-content/60">Attendance Overview</div>
                <LineChart />
              </div>
              <div className="rounded-lg border border-base-300 p-2.5">
                <div className="mb-1 text-[10px] text-base-content/60">By Status</div>
                <div className="flex items-center gap-2">
                  <Donut />
                  <ul className="space-y-1 text-[9px] text-base-content/70">
                    <li className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" />Present</li>
                    <li className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />Late</li>
                    <li className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-error" />Absent</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 120 44" className="h-12 w-full text-primary" preserveAspectRatio="none">
      <defs>
        <linearGradient id="auth-lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,34 L20,26 L40,30 L60,16 L80,22 L100,10 L120,14 L120,44 L0,44 Z" fill="url(#auth-lc)" />
      <path d="M0,34 L20,26 L40,30 L60,16 L80,22 L100,10 L120,14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Donut() {
  // r≈15.9 → circumference ≈ 100, so dasharray values read as percentages.
  const r = 15.9;
  return (
    <svg viewBox="0 0 36 36" className="h-12 w-12 shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-base-300" strokeWidth={4} />
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-success" strokeWidth={4} strokeDasharray="60 40" strokeDashoffset="0" />
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-warning" strokeWidth={4} strokeDasharray="15 85" strokeDashoffset="-60" />
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-error" strokeWidth={4} strokeDasharray="25 75" strokeDashoffset="-75" />
    </svg>
  );
}
