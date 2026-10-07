import { Outlet } from "react-router";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useStudentProfile } from "./student.queries";
import {
  BellIcon,
  BookIcon,
  CardIcon,
  CheckSquareIcon,
  FileTextIcon,
  HomeIcon,
  UserIcon,
} from "@/components/ui/icons";

/*
 * StudentLayout — persistent shell + nav for the whole /student area. Nested
 * routes render into <Outlet/>, so switching tabs swaps only the content while
 * the header/nav stay mounted.
 *
 * NAV ORDER IS LOAD-BEARING on mobile: the shell puts the first four items in
 * the bottom tab bar and the rest behind More. Overview, Attendance, Classes
 * and Excuse Letters lead because they answer the recurring questions — what do
 * I have today, did my tap register, what did I miss, was my letter approved.
 * RFID Card, Notifications and Profile sit behind More: the card is set-and-
 * forget (and the dashboard surfaces it when it matters), and Notifications
 * can't signal anything without an unread count, which the API doesn't expose.
 * Reordering this list silently changes which destinations are thumb-reachable.
 *
 * Identity is fetched HERE and passed down, because the auth session carries no
 * name or photo. The shell renders fine before this resolves.
 */
const NAV: NavItem[] = [
  { to: "/student", label: "Overview", icon: HomeIcon, end: true },
  { to: "/student/attendance", label: "Attendance", icon: CheckSquareIcon },
  { to: "/student/classes", label: "Classes", icon: BookIcon },
  { to: "/student/excuses", label: "Excuse Letters", icon: FileTextIcon },
  { to: "/student/rfid", label: "RFID Card", icon: CardIcon },
  { to: "/student/notifications", label: "Notifications", icon: BellIcon },
  { to: "/student/profile", label: "Profile", icon: UserIcon },
];

export function StudentLayout() {
  const profile = useStudentProfile();

  return (
    <AppShell
      role="Student"
      nav={NAV}
      identity={{
        name: profile.data?.user.name,
        detail: profile.data?.studentNumber,
        imageUrl: profile.data?.user.profileImage,
        isLoading: profile.isPending,
      }}
    >
      <Outlet />
    </AppShell>
  );
}
