import { Outlet } from "react-router";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import {
  BellIcon,
  BookIcon,
  CardIcon,
  CheckSquareIcon,
  ChipIcon,
  ClipboardIcon,
  FileTextIcon,
  HomeIcon,
  LayersIcon,
  UsersIcon,
} from "@/components/ui/icons";

/*
 * AdminLayout — same shell, ten destinations.
 *
 * No `identity` is passed, and that's deliberate: there is no admin profile
 * endpoint (admins are User rows with no profile extension), so there is no
 * name or photo to show. The shell degrades to theme + sign out rather than
 * rendering a skeleton that would never resolve.
 *
 * This area keeps its existing pages and behavior; only the shell changed.
 */
const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: HomeIcon, end: true },
  { to: "/admin/users", label: "Users", icon: UsersIcon },
  { to: "/admin/courses", label: "Courses", icon: LayersIcon },
  { to: "/admin/classes", label: "Classes", icon: BookIcon },
  { to: "/admin/attendance", label: "Attendance", icon: CheckSquareIcon },
  { to: "/admin/excuses", label: "Excuses", icon: FileTextIcon },
  { to: "/admin/rfid", label: "RFID", icon: CardIcon },
  { to: "/admin/devices", label: "Devices", icon: ChipIcon },
  { to: "/admin/audit", label: "Audit", icon: ClipboardIcon },
  { to: "/admin/notifications", label: "Notifications", icon: BellIcon },
];

export function AdminLayout() {
  return (
    <AppShell role="Admin" nav={NAV}>
      <Outlet />
    </AppShell>
  );
}
