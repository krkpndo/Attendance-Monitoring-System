import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-error";
import type { PageParams } from "@/lib/pagination";
import { useToast } from "@/components/ui/toast-context";
import * as api from "./admin.api";

type Filters = Record<string, string | number | undefined>;

export const adminKeys = {
  all: ["admin"] as const,
  users: (f: Filters & PageParams) => [...adminKeys.all, "users", f] as const,
  user: (id: string) => [...adminKeys.all, "user", id] as const,
  students: (f: Filters & PageParams) => [...adminKeys.all, "students", f] as const,
  professors: (f: Filters & PageParams) => [...adminKeys.all, "professors", f] as const,
  courses: () => [...adminKeys.all, "courses"] as const,
  course: (id: string) => [...adminKeys.all, "course", id] as const,
  classes: (f: Filters & PageParams) => [...adminKeys.all, "classes", f] as const,
  class: (id: string) => [...adminKeys.all, "class", id] as const,
  enrollments: (id: string) => [...adminKeys.all, "enrollments", id] as const,
  attendance: (f: Filters & PageParams) => [...adminKeys.all, "attendance", f] as const,
  excuses: (f: Filters & PageParams) => [...adminKeys.all, "excuses", f] as const,
  audit: (f: Filters & PageParams) => [...adminKeys.all, "audit", f] as const,
  notifications: (f: PageParams) => [...adminKeys.all, "notifications", f] as const,
  rfidRequests: (f: Filters & PageParams) => [...adminKeys.all, "rfid-requests", f] as const,
  devices: () => [...adminKeys.all, "devices"] as const,
  report: (id: string) => [...adminKeys.all, "report", id] as const,
};

/* Small helper: a mutation that toasts + invalidates a subtree on success. */
function useToastMutation<TArgs, TData = unknown>(
  fn: (args: TArgs) => Promise<TData>,
  opts: { success: string; invalidate?: readonly (readonly unknown[])[] },
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<TData, ApiError, TArgs>({
    mutationFn: fn,
    onSuccess: () => {
      opts.invalidate?.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      toast.success(opts.success);
    },
    onError: (e) => toast.error(e.message),
  });
}

/* ---------- Queries ---------- */
export const useAdminUsers = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.users(f), queryFn: () => api.getUsers(f) });
export const useAdminUser = (id: string) => useQuery({ queryKey: adminKeys.user(id), queryFn: () => api.getUserDetail(id), enabled: !!id });
export const useAdminStudents = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.students(f), queryFn: () => api.getStudents(f) });
export const useAdminProfessors = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.professors(f), queryFn: () => api.getProfessors(f) });
export const useAdminCourses = () => useQuery({ queryKey: adminKeys.courses(), queryFn: api.getCourses });
export const useAdminCourse = (id: string) => useQuery({ queryKey: adminKeys.course(id), queryFn: () => api.getCourseDetail(id), enabled: !!id });
export const useAdminClasses = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.classes(f), queryFn: () => api.getClasses(f) });
export const useAdminClass = (id: string) => useQuery({ queryKey: adminKeys.class(id), queryFn: () => api.getClassDetail(id), enabled: !!id });
export const useAdminEnrollments = (id: string) => useQuery({ queryKey: adminKeys.enrollments(id), queryFn: () => api.getClassEnrollments(id), enabled: !!id });
export const useAdminAttendance = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.attendance(f), queryFn: () => api.getAttendance(f) });
export const useAdminExcuses = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.excuses(f), queryFn: () => api.getExcuseLetters(f) });
export const useAdminAudit = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.audit(f), queryFn: () => api.getAuditLogs(f) });
export const useAdminNotifications = (f: PageParams) => useQuery({ queryKey: adminKeys.notifications(f), queryFn: () => api.getNotifications(f) });
export const useAdminRfidRequests = (f: Filters & PageParams) => useQuery({ queryKey: adminKeys.rfidRequests(f), queryFn: () => api.getRfidRequests(f) });
export const useAdminDevices = () => useQuery({ queryKey: adminKeys.devices(), queryFn: api.getDevices });
export const useAdminReport = (id: string) => useQuery({ queryKey: adminKeys.report(id), queryFn: () => api.getAttendanceReport(id), enabled: !!id });

/* ---------- Mutations ---------- */
export const useCreateUser = () => useToastMutation((b: unknown) => api.createUser(b), { success: "User created", invalidate: [adminKeys.all] });
export const useUpdateUser = (id: string) => useToastMutation((b: unknown) => api.updateUser(id, b), { success: "User updated", invalidate: [adminKeys.user(id), adminKeys.all] });
export const useDeactivateUser = (id: string) => useToastMutation(() => api.deactivateUser(id), { success: "User deactivated", invalidate: [adminKeys.user(id), adminKeys.all] });
export const useUpdateStudent = (id: string) => useToastMutation((b: unknown) => api.updateStudent(id, b), { success: "Student updated", invalidate: [adminKeys.user(id)] });
export const useUpdateProfessor = (id: string) => useToastMutation((b: unknown) => api.updateProfessor(id, b), { success: "Professor updated", invalidate: [adminKeys.user(id)] });
export const useRevokeRfid = (id: string) => useToastMutation((reason: string | undefined) => api.revokeRfid(id, reason), { success: "RFID revoked", invalidate: [adminKeys.user(id)] });

export const useCreateCourse = () => useToastMutation((b: unknown) => api.createCourse(b), { success: "Course created", invalidate: [adminKeys.courses()] });
export const useUpdateCourse = (id: string) => useToastMutation((b: unknown) => api.updateCourse(id, b), { success: "Course updated", invalidate: [adminKeys.course(id), adminKeys.courses()] });

export const useCreateClass = () => useToastMutation((b: unknown) => api.createClass(b), { success: "Class created", invalidate: [adminKeys.all] });
export const useUpdateClass = (id: string) => useToastMutation((b: unknown) => api.updateClass(id, b), { success: "Class updated", invalidate: [adminKeys.class(id), adminKeys.all] });
export const useSetClassSchedule = (id: string) => useToastMutation((schedules: unknown) => api.setClassSchedule(id, schedules), { success: "Schedule saved", invalidate: [adminKeys.class(id)] });
export const useEnrollStudent = (id: string) => useToastMutation((studentId: string) => api.enrollStudent(id, studentId), { success: "Student enrolled", invalidate: [adminKeys.class(id), adminKeys.enrollments(id)] });
export const useDropStudent = (id: string) => useToastMutation((studentId: string) => api.dropStudent(id, studentId), { success: "Student dropped", invalidate: [adminKeys.class(id), adminKeys.enrollments(id)] });

export const useReviewExcuse = () => useToastMutation((a: { excuseId: string; body: unknown }) => api.reviewExcuseLetter(a.excuseId, a.body), { success: "Excuse reviewed", invalidate: [adminKeys.all] });
export const useRejectRfidRequest = () => useToastMutation((a: { requestId: string; reason: string }) => api.rejectRfidRequest(a.requestId, a.reason), { success: "Request rejected", invalidate: [adminKeys.all] });

export const useRegisterDevice = () => useToastMutation((label: string) => api.registerDevice(label), { success: "Device registered", invalidate: [adminKeys.devices()] });
export const useRevokeDevice = () => useToastMutation((a: { deviceId: string; reason?: string }) => api.revokeDevice(a.deviceId, a.reason), { success: "Device revoked", invalidate: [adminKeys.devices()] });

export function useMarkAdminNotificationRead() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: api.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
