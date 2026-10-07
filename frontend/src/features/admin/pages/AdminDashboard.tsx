import { Link } from "react-router";

/*
 * Overview — entry points into every admin area. There's no aggregate-stats
 * endpoint, so this is a navigation hub rather than a metrics dashboard.
 */
const LINKS = [
  { to: "/admin/users", title: "Users", desc: "Create & manage students, professors, admins" },
  { to: "/admin/courses", title: "Courses", desc: "Course catalog" },
  { to: "/admin/classes", title: "Classes", desc: "Sections, schedules, enrollment" },
  { to: "/admin/attendance", title: "Attendance", desc: "Cross-class attendance oversight" },
  { to: "/admin/excuses", title: "Excuse Letters", desc: "Override excuse decisions" },
  { to: "/admin/rfid", title: "RFID Requests", desc: "Card request queue" },
  { to: "/admin/devices", title: "Devices", desc: "Register & revoke scanners" },
  { to: "/admin/audit", title: "Audit Logs", desc: "Privileged-action trail" },
];

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-base-content">Admin</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-box border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary">
            <div className="font-medium text-base-content">{l.title}</div>
            <div className="text-sm text-base-content/60">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
