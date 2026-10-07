import type { ReactNode } from "react";

/*
 * icons — the app's single icon family.
 *
 * The design system asks for ONE consistent set: 24×24 viewBox, 2px stroke,
 * round caps and joins, outline only, never mixed with filled or duotone
 * glyphs. Before this file, every page hand-rolled its own inline SVGs (the
 * auth screens alone defined ~12), which is exactly how a set drifts.
 *
 * These stay hand-drawn rather than pulling in an icon package: the set is
 * small, `currentColor` makes them inherit text color for free, and there's no
 * dependency to keep in sync. If the set grows past ~30, revisit that.
 *
 * Size at the call site: 24px in the tab bar and rail, 20px in the sidebar and
 * buttons, 14–16px inside badges.
 */
type IconProps = { className?: string };

function Svg({ className = "h-6 w-6", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ---- navigation --------------------------------------------------------- */

export const HomeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </Svg>
);

export const CheckSquareIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
    <path d="m9 11 3 3 8-8" />
  </Svg>
);

export const BookIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v13" />
    <path d="M6.5 16H20v3.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 4 18.5v-13" />
  </Svg>
);

export const FileTextIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Svg>
);

export const CardIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 10h19M6 15h3" />
  </Svg>
);

export const BellIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const UserIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </Svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 21c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 15.4c2.1.7 3.5 2.4 3.5 5.6" />
  </Svg>
);

export const CalendarIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const LayersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </Svg>
);

export const ChipIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
  </Svg>
);

export const ClipboardIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </Svg>
);

export const MoreIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </Svg>
);

/* ---- attendance status -------------------------------------------------- */

export const CheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const ClockIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);

export const XIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const DocumentIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const HourglassIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7 3h10M7 21h10" />
    <path d="M7 3c0 4 5 5 5 9s-5 5-5 9M17 3c0 4-5 5-5 9s5 5 5 9" />
  </Svg>
);

/* ---- chrome & feedback -------------------------------------------------- */

export const SunIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Svg>
);

export const MoonIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

export const LogOutIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const ShieldCheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const AlertIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5M12 16h.01" />
  </Svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
