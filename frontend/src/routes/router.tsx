import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RootRedirect } from "./RootRedirect";

// Student
import { StudentLayout } from "@/features/student/StudentLayout";
import { StudentDashboard } from "@/features/student/pages/StudentDashboard";
import { StudentAttendancePage } from "@/features/student/pages/StudentAttendancePage";
import { StudentClassesPage } from "@/features/student/pages/StudentClassesPage";
import { StudentExcusesPage } from "@/features/student/pages/StudentExcusesPage";
import { StudentExcuseDetailPage } from "@/features/student/pages/StudentExcuseDetailPage";
import { StudentRfidPage } from "@/features/student/pages/StudentRfidPage";
import { StudentNotificationsPage } from "@/features/student/pages/StudentNotificationsPage";
import { StudentProfilePage } from "@/features/student/pages/StudentProfilePage";

// Professor
import { ProfessorLayout } from "@/features/professor/ProfessorLayout";
import { ProfessorDashboard } from "@/features/professor/pages/ProfessorDashboard";
import { ProfessorClassesPage } from "@/features/professor/pages/ProfessorClassesPage";
import { ProfessorClassDetailPage } from "@/features/professor/pages/ProfessorClassDetailPage";
import { ProfessorSchedulePage } from "@/features/professor/pages/ProfessorSchedulePage";
import { ProfessorSessionPage } from "@/features/professor/pages/ProfessorSessionPage";
import { ProfessorExcusesPage } from "@/features/professor/pages/ProfessorExcusesPage";
import { ProfessorExcuseDetailPage } from "@/features/professor/pages/ProfessorExcuseDetailPage";
import { ProfessorNotificationsPage } from "@/features/professor/pages/ProfessorNotificationsPage";
import { ProfessorProfilePage } from "@/features/professor/pages/ProfessorProfilePage";

// Admin
import { AdminLayout } from "@/features/admin/AdminLayout";
import { AdminDashboard } from "@/features/admin/pages/AdminDashboard";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { AdminUserDetailPage } from "@/features/admin/pages/AdminUserDetailPage";
import { AdminCoursesPage } from "@/features/admin/pages/AdminCoursesPage";
import { AdminCourseDetailPage } from "@/features/admin/pages/AdminCourseDetailPage";
import { AdminClassesPage } from "@/features/admin/pages/AdminClassesPage";
import { AdminClassDetailPage } from "@/features/admin/pages/AdminClassDetailPage";
import { AdminAttendancePage } from "@/features/admin/pages/AdminAttendancePage";
import { AdminExcusesPage } from "@/features/admin/pages/AdminExcusesPage";
import { AdminRfidPage } from "@/features/admin/pages/AdminRfidPage";
import { AdminDevicesPage } from "@/features/admin/pages/AdminDevicesPage";
import { AdminAuditPage } from "@/features/admin/pages/AdminAuditPage";
import { AdminNotificationsPage } from "@/features/admin/pages/AdminNotificationsPage";

/*
 * Route table. Each role area is nested under <ProtectedRoute allow={[ROLE]}> so
 * authorization is declared once per group. The role's Layout provides the
 * persistent shell/nav; its sub-pages render into the layout's <Outlet/>.
 */
export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  {
    element: <ProtectedRoute allow={["STUDENT"]} />,
    children: [
      {
        path: "/student",
        element: <StudentLayout />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: "attendance", element: <StudentAttendancePage /> },
          { path: "classes", element: <StudentClassesPage /> },
          { path: "excuses", element: <StudentExcusesPage /> },
          { path: "excuses/:excuseId", element: <StudentExcuseDetailPage /> },
          { path: "rfid", element: <StudentRfidPage /> },
          { path: "notifications", element: <StudentNotificationsPage /> },
          { path: "profile", element: <StudentProfilePage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allow={["PROFESSOR"]} />,
    children: [
      {
        path: "/professor",
        element: <ProfessorLayout />,
        children: [
          { index: true, element: <ProfessorDashboard /> },
          { path: "classes", element: <ProfessorClassesPage /> },
          { path: "classes/:classId", element: <ProfessorClassDetailPage /> },
          { path: "schedule", element: <ProfessorSchedulePage /> },
          { path: "sessions/:sessionId", element: <ProfessorSessionPage /> },
          { path: "excuses", element: <ProfessorExcusesPage /> },
          { path: "excuses/:excuseId", element: <ProfessorExcuseDetailPage /> },
          { path: "notifications", element: <ProfessorNotificationsPage /> },
          { path: "profile", element: <ProfessorProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allow={["ADMIN"]} />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "users/:userId", element: <AdminUserDetailPage /> },
          { path: "courses", element: <AdminCoursesPage /> },
          { path: "courses/:courseId", element: <AdminCourseDetailPage /> },
          { path: "classes", element: <AdminClassesPage /> },
          { path: "classes/:classId", element: <AdminClassDetailPage /> },
          { path: "attendance", element: <AdminAttendancePage /> },
          { path: "excuses", element: <AdminExcusesPage /> },
          { path: "rfid", element: <AdminRfidPage /> },
          { path: "devices", element: <AdminDevicesPage /> },
          { path: "audit", element: <AdminAuditPage /> },
          { path: "notifications", element: <AdminNotificationsPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
