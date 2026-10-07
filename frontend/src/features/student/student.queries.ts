import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-error";
import type { PageParams } from "@/lib/pagination";
import { useToast } from "@/components/ui/toast-context";
import * as api from "./student.api";
import type { RegisterRfidRequest, SubmitExcuseRequest, SubmitRfidRequest } from "./student.schema";

/*
 * Query keys — one namespaced tree so mutations can invalidate precisely.
 * A component reads via a hook and branches on isPending/isError/data; it never
 * touches axios directly (§4).
 */
export const studentKeys = {
  all: ["student"] as const,
  profile: () => [...studentKeys.all, "profile"] as const,
  classes: () => [...studentKeys.all, "classes"] as const,
  schedule: () => [...studentKeys.all, "schedule"] as const,
  attendance: (p: api.AttendanceQuery) => [...studentKeys.all, "attendance", p] as const,
  attendanceRange: (r: { startDate: string; endDate: string }) =>
    [...studentKeys.all, "attendance", "range", r] as const,
  summary: () => [...studentKeys.all, "attendance", "summary"] as const,
  absences: (r: { startDate: string; endDate: string }) => [...studentKeys.all, "absences", r] as const,
  excuses: () => [...studentKeys.all, "excuses"] as const,
  excuse: (id: string) => [...studentKeys.all, "excuse", id] as const,
  notifications: (p: PageParams) => [...studentKeys.all, "notifications", p] as const,
  rfidRequests: () => [...studentKeys.all, "rfid-requests"] as const,
};

/* ---------- Queries ---------- */
export const useStudentProfile = () =>
  useQuery({ queryKey: studentKeys.profile(), queryFn: api.getProfile });

export const useStudentClasses = () =>
  useQuery({ queryKey: studentKeys.classes(), queryFn: api.getClasses });

export const useStudentSchedule = () =>
  useQuery({ queryKey: studentKeys.schedule(), queryFn: api.getSchedule });

export const useStudentAttendance = (params: api.AttendanceQuery) =>
  useQuery({ queryKey: studentKeys.attendance(params), queryFn: () => api.getAttendance(params) });

/*
 * Every attendance record in a date range, across all pages.
 *
 * /student/attendance is paginated and `limit` is a PAGE SIZE, capped at 100 by
 * the backend validator — not a result cap. `pagination.total` counts every
 * matching row, so asking for limit:100 and reading page 1 silently discards
 * anything past the hundredth record.
 *
 * That matters here because the rows are ordered `sessionDate: 'desc'`: a
 * truncated week would drop its EARLIEST days, and weekStats() would then
 * compute both `present` and `total` from a partial week while looking
 * perfectly healthy. A student's weekly record count is not bounded by the
 * schema either — a record exists per (session, student), and a professor can
 * open more than one session per class per day — so "100 is surely enough" is
 * an assumption, not a guarantee.
 *
 * So we drain the range. Page 1 tells us `totalPages`; we fetch the rest and
 * concatenate. One query, one cache entry, complete data — and no backend
 * change. In the overwhelmingly common case there is exactly one page and this
 * costs exactly one request.
 */
const RANGE_PAGE_SIZE = 100; // the backend validator's maximum

export const useStudentAttendanceRange = (range: { startDate: string; endDate: string }) =>
  useQuery({
    queryKey: studentKeys.attendanceRange(range),
    queryFn: async () => {
      const first = await api.getAttendance({ ...range, page: 1, limit: RANGE_PAGE_SIZE });
      const items = [...first.items];

      for (let page = 2; page <= first.pagination.totalPages; page++) {
        const next = await api.getAttendance({ ...range, page, limit: RANGE_PAGE_SIZE });
        items.push(...next.items);
      }

      return items;
    },
  });

export const useAttendanceSummary = () =>
  useQuery({ queryKey: studentKeys.summary(), queryFn: api.getAttendanceSummary });

export const useAbsences = (range: { startDate: string; endDate: string }, enabled: boolean) =>
  useQuery({
    queryKey: studentKeys.absences(range),
    queryFn: () => api.getAbsences(range),
    enabled, // don't fire until the range is valid/submitted
  });

export const useExcuseLetters = () =>
  useQuery({ queryKey: studentKeys.excuses(), queryFn: api.getExcuseLetters });

export const useExcuseLetter = (id: string) =>
  useQuery({ queryKey: studentKeys.excuse(id), queryFn: () => api.getExcuseLetter(id), enabled: !!id });

export const useNotifications = (params: PageParams) =>
  useQuery({ queryKey: studentKeys.notifications(params), queryFn: () => api.getNotifications(params) });

export const useRfidRequests = () =>
  useQuery({ queryKey: studentKeys.rfidRequests(), queryFn: api.getRfidRequests });

/* ---------- Mutations ---------- */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, FormData>({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.profile() });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSubmitExcuse() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, SubmitExcuseRequest>({
    mutationFn: api.submitExcuseLetter,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.excuses() });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Excuse letter submitted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUploadAttachments(excuseId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, File[]>({
    mutationFn: (files) => api.uploadExcuseAttachments(excuseId, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.excuse(excuseId) });
      toast.success("Attachment uploaded");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: api.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useRegisterRfid() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, RegisterRfidRequest>({
    mutationFn: api.registerRfid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.profile() });
      qc.invalidateQueries({ queryKey: studentKeys.rfidRequests() });
      toast.success("RFID card registered");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSubmitRfidRequest() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, SubmitRfidRequest>({
    mutationFn: api.submitRfidRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.rfidRequests() });
      qc.invalidateQueries({ queryKey: studentKeys.profile() });
      toast.success("Request submitted");
    },
    onError: (e) => toast.error(e.message),
  });
}
