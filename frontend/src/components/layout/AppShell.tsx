import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { useLogout } from "@/features/auth/auth.queries";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BackgroundDecoration } from "@/components/ui/BackgroundDecoration";
import { BrandMark, Wordmark } from "@/components/ui/BrandMark";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { CloseIcon, LogOutIcon, MoreIcon } from "@/components/ui/icons";

/*
 * AppShell — the frame around every authenticated page, for all three roles.
 *
 * It owns navigation, identity, theme, sign out and the page canvas. Pages
 * never solve navigation; they receive an <Outlet/> and render content.
 *
 * The shell changes PATTERN, not just size, at each breakpoint (UI-GUIDELINES
 * §6 "adaptive"), because a reflow of the same markup stops working:
 *
 *   < md   top bar + bottom tab bar (4 primary + More, thumb-reachable)
 *   md     88px rail, all items, label under icon
 *   lg+    264px sidebar
 *
 * The old shell used one horizontally-scrolling tab strip at every width, which
 * pushed items off-screen on a phone and put navigation at the far end of a
 * reach. That strip is gone and must not come back.
 *
 * IDENTITY IS A PROP, NOT A QUERY. The auth session carries only
 * { id, type, status } — no name, no photo — so identity arrives later from the
 * role's own profile endpoint. The shell takes it as data and is built to look
 * complete without it: every identity element has a loading form that occupies
 * the same box. Nothing here is structurally dependent on it.
 */
export type NavItem = {
  to: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  end?: boolean;
};

export type ShellIdentity = {
  name?: string | null;
  /** Second line: student number, employee number, etc. */
  detail?: ReactNode;
  imageUrl?: string | null;
  isLoading?: boolean;
};

type AppShellProps = {
  /** Display role — "Student", never the raw enum. */
  role: string;
  nav: NavItem[];
  identity?: ShellIdentity;
  children: ReactNode;
};

/** How many items reach the mobile tab bar before the rest go behind More. */
const PRIMARY_TAB_COUNT = 4;

function isActive(pathname: string, item: NavItem): boolean {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function AppShell({ role, nav, identity, children }: AppShellProps) {
  const logout = useLogout();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // A role with five or fewer destinations needs no More tab.
  const needsMore = nav.length > PRIMARY_TAB_COUNT + 1;
  const tabs = needsMore ? nav.slice(0, PRIMARY_TAB_COUNT) : nav;
  const overflow = needsMore ? nav.slice(PRIMARY_TAB_COUNT) : [];
  const overflowActive = overflow.some((item) => isActive(pathname, item));

  // The avatar is a second route to Profile; roles without one keep a plain avatar.
  const profileItem = nav.find((item) => item.label === "Profile");

  const signOut = (
    <SignOutButton pending={logout.isPending} onSignOut={() => logout.mutate()} />
  );

  return (
    <div className="relative min-h-screen bg-surface-page">
      {/* The shell owns ONE backdrop, on the page canvas, behind every card. */}
      <BackgroundDecoration variant="dashboard" className="fixed" />

      {/* ---- mobile top bar (< md) ---- */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border-subtle bg-surface-card pt-[env(safe-area-inset-top)] shadow-1 md:hidden">
        <div className="flex h-top-bar items-center gap-3 px-4">
          <BrandMark size="sm" />
          <Wordmark role={role} className="flex-1" />
          <ThemeToggle />
          {identity && <AvatarLink identity={identity} to={profileItem?.to} />}
        </div>
      </header>

      {/* ---- tablet rail (md only) ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-30 hidden w-rail flex-col border-r border-border-subtle bg-surface-card md:flex lg:hidden"
      >
        <div className="grid place-items-center py-4">
          <BrandMark size="lg" />
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {nav.map((item) => (
            <li key={item.to}>
              <RailLink item={item} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-1 border-t border-border-subtle p-2">
          {identity && <Avatar name={identity.name} src={identity.imageUrl} size="sm" />}
          <ThemeToggle />
          {signOut}
        </div>
      </nav>

      {/* ---- desktop sidebar (lg+) ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-border-subtle bg-surface-card lg:flex"
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <BrandMark size="md" />
          <Wordmark role={role} />
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
        <div className="border-t border-border-subtle p-3">
          {identity && (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar name={identity.name} src={identity.imageUrl} size="md" />
              <IdentityText identity={identity} />
            </div>
          )}
          <div className="mt-1 flex items-center gap-1">
            <ThemeToggle />
            {signOut}
          </div>
        </div>
      </nav>

      {/* ---- content ---- */}
      <div className="md:pl-rail lg:pl-sidebar">
        <main
          className="mx-auto max-w-content px-4 pb-[calc(var(--spacing-tab-bar)+env(safe-area-inset-bottom)+1.5rem)] pt-[calc(var(--spacing-top-bar)+env(safe-area-inset-top)+1.5rem)] md:px-6 md:pb-10 md:pt-8 lg:px-8"
        >
          <div className="page-enter relative">{children}</div>
        </main>
      </div>

      {/* ---- mobile tab bar (< md) ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-surface-card pb-[env(safe-area-inset-bottom)] shadow-1 md:hidden"
      >
        <ul className="flex h-tab-bar items-stretch">
          {tabs.map((item) => (
            <li key={item.to} className="min-w-0 flex-1">
              <TabLink item={item} />
            </li>
          ))}
          {needsMore && (
            <li className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                aria-current={overflowActive ? "page" : undefined}
                className={`flex h-full w-full flex-col items-center justify-center gap-1 px-1 transition-colors duration-[var(--duration-fast)] ease-standard ${
                  overflowActive ? "text-strong" : "text-muted"
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-field transition-colors duration-[var(--duration-fast)] ease-standard ${
                    overflowActive ? "bg-tint-primary text-primary" : ""
                  }`}
                >
                  <MoreIcon className="h-6 w-6" />
                </span>
                <span className={`text-xs leading-tight ${overflowActive ? "font-bold" : "font-medium"}`}>More</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {needsMore && (
        <MoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          items={overflow}
          identity={identity}
          signOut={signOut}
        />
      )}
    </div>
  );
}

/* ---- navigation links, one per breakpoint model ------------------------- */

/*
 * NavLink sets aria-current="page" on the active link for us, so the current
 * item is announced, not merely tinted.
 */
function TabLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive: active }) =>
        `flex h-full w-full flex-col items-center justify-center gap-1 px-1 transition-colors duration-[var(--duration-fast)] ease-standard ${
          active ? "text-strong" : "text-muted"
        }`
      }
    >
      {({ isActive: active }) => (
        <>
          <span
            className={`grid h-7 w-12 place-items-center rounded-field transition-colors duration-[var(--duration-fast)] ease-standard ${
              active ? "bg-tint-primary text-primary" : ""
            }`}
          >
            <Icon className="h-6 w-6" />
          </span>
          {/* "Excuse Letters" wraps to two lines here on purpose — don't shorten it. */}
          <span className={`text-center text-xs leading-tight ${active ? "font-bold" : "font-medium"}`}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function RailLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      className={({ isActive: active }) =>
        `flex min-h-touch flex-col items-center gap-1 rounded-field px-1 py-2 text-center transition-colors duration-[var(--duration-fast)] ease-standard ${
          active ? "bg-tint-primary text-strong" : "text-muted hover:bg-tint-primary"
        }`
      }
    >
      {({ isActive: active }) => (
        <>
          <Icon className={`h-6 w-6 ${active ? "text-primary" : ""}`} />
          <span className={`text-xs leading-tight ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive: active }) =>
        `flex min-h-touch items-center gap-3 rounded-field px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard ${
          active ? "bg-tint-primary font-bold text-strong" : "font-medium text-muted hover:bg-tint-primary"
        }`
      }
    >
      {({ isActive: active }) => (
        <>
          <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ---- identity ----------------------------------------------------------- */

function IdentityText({ identity }: { identity?: ShellIdentity }) {
  // No identity source at all (Admin has no profile endpoint) — render nothing
  // rather than a skeleton that would never resolve.
  if (!identity) return null;

  if (!identity.name) {
    // Same two-line footprint as the loaded state, so nothing shifts.
    return (
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }
  return (
    <div className="min-w-0 flex-1 leading-tight">
      <div className="truncate text-sm font-medium text-strong" title={identity.name}>
        {identity.name}
      </div>
      {identity.detail && <div className="truncate text-xs text-muted">{identity.detail}</div>}
    </div>
  );
}

function AvatarLink({ identity, to }: { identity?: ShellIdentity; to?: string }) {
  const avatar = <Avatar name={identity?.name} src={identity?.imageUrl} size="sm" />;

  if (!to) return <span className="grid h-touch w-touch place-items-center">{avatar}</span>;

  return (
    <NavLink
      to={to}
      aria-label="Profile"
      className="grid h-touch w-touch place-items-center rounded-full"
    >
      {avatar}
    </NavLink>
  );
}

/* ---- sign out ----------------------------------------------------------- */

/*
 * Sign out never navigates: clearing the session flips auth status and
 * ProtectedRoute redirects on its own. The button's only job is to report that
 * it's working — spinner in place, label swap, disabled, aria-busy.
 */
function SignOutButton({ pending, onSignOut }: { pending: boolean; onSignOut: () => void }) {
  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      aria-busy={pending}
      className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-field px-3 text-sm font-medium text-muted transition-colors duration-[var(--duration-instant)] ease-standard hover:bg-tint-primary disabled:opacity-70 md:flex-none md:flex-col md:gap-1 md:px-1 md:text-xs lg:flex-1 lg:flex-row lg:gap-2 lg:text-sm"
    >
      {pending ? (
        <span className="loading loading-spinner loading-xs shrink-0" />
      ) : (
        <LogOutIcon className="h-5 w-5 shrink-0" />
      )}
      <span className="truncate">{pending ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

/* ---- the More sheet ----------------------------------------------------- */

/*
 * Built on <dialog>, which gives focus trapping, Escape-to-close and focus
 * RETURN to the More tab for free — all of which we'd otherwise hand-roll and
 * get subtly wrong.
 */
function MoreSheet({
  open,
  onClose,
  items,
  identity,
  signOut,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  identity?: ShellIdentity;
  signOut: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="More navigation"
      // Scrim tap closes. The <dialog> box is stretched to the full viewport
      // with the sheet as its only painted child, so a click whose target is
      // the dialog ITSELF (not a descendant) landed outside the sheet.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-end bg-transparent p-0 backdrop:bg-scrim open:flex md:hidden"
    >
      <div className="w-full rounded-t-box border border-border-raised bg-surface-overlay pb-[env(safe-area-inset-bottom)] shadow-3">
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          {identity && <Avatar name={identity.name} src={identity.imageUrl} size="md" />}
          <IdentityText identity={identity} />
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-touch w-touch shrink-0 place-items-center rounded-field text-muted transition-colors duration-[var(--duration-instant)] ease-standard hover:bg-tint-primary"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <ul className="p-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  // Close on tap rather than reacting to the pathname in an
                  // effect — same result, no cascading render.
                  onClick={onClose}
                  className={({ isActive: active }) =>
                    `flex h-14 items-center gap-3 rounded-field px-3 text-sm ${
                      active ? "bg-tint-primary font-bold text-strong" : "font-medium text-muted"
                    }`
                  }
                >
                  {({ isActive: active }) => (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="flex border-t border-border-subtle p-2">{signOut}</div>
      </div>

    </dialog>
  );
}
