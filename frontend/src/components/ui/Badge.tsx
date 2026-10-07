/*
 * Badge — a small status pill with sensible default colors per known status
 * value. Pass an explicit `tone` to override. Color is paired with the text
 * label itself (§5: never color alone), so it's readable without the color.
 */
type Tone = "neutral" | "primary" | "success" | "warning" | "error" | "info" | "accent";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "badge-neutral",
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  accent: "badge-accent",
};

// Maps domain status strings → a tone, so PRESENT is green, ABSENT red, etc.
const STATUS_TONE: Record<string, Tone> = {
  // attendance
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "error",
  EXCUSED: "info",
  // session
  OPEN: "success",
  CLOSED: "neutral",
  SCHEDULED: "info",
  CANCELLED: "neutral",
  // excuse / rfid request
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  FULFILLED: "success",
  // user / card / device
  ACTIVE: "success",
  INACTIVE: "neutral",
  REVOKED: "error",
};

type BadgeProps = {
  children: string;
  tone?: Tone;
  outline?: boolean;
};

export function Badge({ children, tone, outline = false }: BadgeProps) {
  const resolved = tone ?? STATUS_TONE[children] ?? "neutral";
  return (
    <span className={`badge ${TONE_CLASS[resolved]} ${outline ? "badge-outline" : ""}`}>
      {children}
    </span>
  );
}
