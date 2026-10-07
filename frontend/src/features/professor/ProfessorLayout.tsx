import { Outlet } from "react-router";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useProfProfile } from "./professor.queries";
import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  FileTextIcon,
  HomeIcon,
  UserIcon,
} from "@/components/ui/icons";

/*
 * ProfessorLayout — same shell, this role's six destinations. Four reach the
 * mobile tab bar and the rest go behind More, exactly as for Student.
 *
 * This area keeps its existing pages and behavior; only the shell around them
 * changed in this slice.
 */
const NAV: NavItem[] = [
  { to: "/professor", label: "Overview", icon: HomeIcon, end: true },
  { to: "/professor/classes", label: "Classes", icon: BookIcon },
  { to: "/professor/schedule", label: "Schedule", icon: CalendarIcon },
  { to: "/professor/excuses", label: "Excuse Letters", icon: FileTextIcon },
  { to: "/professor/notifications", label: "Notifications", icon: BellIcon },
  { to: "/professor/profile", label: "Profile", icon: UserIcon },
];

export function ProfessorLayout() {
  const profile = useProfProfile();

  return (
    <AppShell
      role="Professor"
      nav={NAV}
      identity={{
        name: profile.data?.user.name,
        detail: profile.data?.employeeNumber,
        imageUrl: profile.data?.user.profileImage,
        isLoading: profile.isPending,
      }}
    >
      <Outlet />
    </AppShell>
  );
}
