import type { ReactNode } from "react";
import type { AttendanceStatus } from "@/lib/enums";
import { CheckIcon, ChevronRightIcon, ClockIcon, DocumentIcon, HourglassIcon, XIcon } from "./icons";

/*
 * StatusBadge — how attendance state is shown, everywhere.
 *
 * Two families, and keeping them visually distinct is the whole point:
 *
 *   RECORDED (PRESENT / LATE / ABSENT / EXCUSED) come from the API. They get a
 *   solid tinted disc with a ring in the status hue.
 *
 *   DERIVED (UPCOMING / PENDING) are computed on the client from the timetable
 *   and the clock — they are never sent to or read from the API. They get a
 *   DASHED ring and a muted word, so a student can't mistake "we haven't
 *   recorded anything yet" for "we recorded you absent".
 *
 * Accessibility, and the reason the glyph is never tinted: `info` is 2.14:1 on
 * white, `warning` 3.19:1 and `success` 3.30:1 — all below the 3:1 non-text
 * floor or too close to it. So the hue is used ONLY for the disc fill and its
 * ring, while the glyph and the word stay base-content. Status is therefore
 * carried by shape + word + hue together, never by hue alone.
 */
export type DisplayStatus = AttendanceStatus | "UPCOMING" | "PENDING";

type StatusConfig = {
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  /** Recorded statuses fill the disc; derived ones outline it with a dash. */
  disc: string;
  word: string;
};

const CONFIG: Record<DisplayStatus, StatusConfig> = {
  PRESENT: {
    label: "Present",
    icon: CheckIcon,
    disc: "bg-tint-success ring-1 ring-success/45 text-strong",
    word: "text-strong",
  },
  LATE: {
    label: "Late",
    icon: ClockIcon,
    disc: "bg-tint-warning ring-1 ring-warning/45 text-strong",
    word: "text-strong",
  },
  ABSENT: {
    label: "Absent",
    icon: XIcon,
    disc: "bg-tint-error ring-1 ring-error/45 text-strong",
    word: "text-strong",
  },
  EXCUSED: {
    label: "Excused",
    icon: DocumentIcon,
    disc: "bg-tint-info ring-1 ring-info/55 text-strong",
    word: "text-strong",
  },
  UPCOMING: {
    label: "Upcoming",
    icon: ChevronRightIcon,
    disc: "border border-dashed border-border-strong text-muted",
    word: "text-muted",
  },
  PENDING: {
    label: "Pending",
    icon: HourglassIcon,
    disc: "border border-dashed border-border-strong text-muted",
    word: "text-muted",
  },
};

const DISC_SIZE = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
};

const GLYPH_SIZE = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

type StatusBadgeProps = {
  status: DisplayStatus;
  size?: keyof typeof DISC_SIZE;
  /** Disc only — for the rare place the word is already adjacent. */
  hideLabel?: boolean;
};

export function StatusBadge({ status, size = "md", hideLabel = false }: StatusBadgeProps) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid shrink-0 place-items-center rounded-full ${DISC_SIZE[size]} ${config.disc}`}>
        <Icon className={GLYPH_SIZE[size]} />
      </span>
      {hideLabel ? (
        <span className="sr-only">{config.label}</span>
      ) : (
        <span className={`text-sm font-medium ${config.word}`}>{config.label}</span>
      )}
    </span>
  );
}
