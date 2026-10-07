import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-error";
import type { PageParams } from "@/lib/pagination";
import { useToast } from "@/components/ui/toast-context";
import * as api from "./professor.api";
import type { MarkAttendanceRequest, OpenSessionRequest, ReviewExcuseRequest } from "./professor.schema";

export const profKeys = {
  all: ["professor"] as const,
  profile: () => [...profKeys.all, "profile"] as const,
  classes: () => [...profKeys.all, "classes"] as const,
  schedule: () => [...profKeys.all, "schedule"] as const,
  roster: (id: string) => [...profKeys.all, "roster", id] as const,
  sessions: (id: string) => [...profKeys.all, "sessions", id] as const,
  report: (id: string) => [...profKeys.all, "report", id] as const,
  sessionRecords: (id: string) => [...profKeys.all, "session-records", id] as const,
  excuses: (p: PageParams) => [...profKeys.all, "excuses", p] as const,
  excuse: (id: string) => [...profKeys.all, "excuse", id] as const,
  notifications: (p: PageParams) => [...profKeys.all, "notifications", p] as const,
};

/* Queries */
export const useProfProfile = () => useQuery({ queryKey: profKeys.profile(), queryFn: api.getProfile });
export const useProfClasses = () => useQuery({ queryKey: profKeys.classes(), queryFn: api.getClasses });
export const useProfSchedule = () => useQuery({ queryKey: profKeys.schedule(), queryFn: api.getClassSchedule });
export const useRoster = (id: string) => useQuery({ queryKey: profKeys.roster(id), queryFn: () => api.getRoster(id), enabled: !!id });
export const useSessions = (id: string) => useQuery({ queryKey: profKeys.sessions(id), queryFn: () => api.getSessions(id), enabled: !!id });
export const useReport = (id: string) => useQuery({ queryKey: profKeys.report(id), queryFn: () => api.getReport(id), enabled: !!id });
export const useSessionRecords = (id: string) => useQuery({ queryKey: profKeys.sessionRecords(id), queryFn: () => api.getSessionRecords(id), enabled: !!id });
export const useProfExcuses = (p: PageParams) => useQuery({ queryKey: profKeys.excuses(p), queryFn: () => api.getExcuseLetters(p) });
export const useProfExcuse = (id: string) => useQuery({ queryKey: profKeys.excuse(id), queryFn: () => api.getExcuseLetter(id), enabled: !!id });
export const useProfNotifications = (p: PageParams) => useQuery({ queryKey: profKeys.notifications(p), queryFn: () => api.getNotifications(p) });

/* Mutations */
export function useUpdateProfProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, FormData>({
    mutationFn: api.updateProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: profKeys.profile() }); toast.success("Profile updated"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useOpenSession(classId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, OpenSessionRequest>({
    mutationFn: api.openSession,
    onSuccess: () => { qc.invalidateQueries({ queryKey: profKeys.sessions(classId) }); toast.success("Session opened"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useCloseSession(classId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, string>({
    mutationFn: api.closeSession,
    onSuccess: () => { qc.invalidateQueries({ queryKey: profKeys.sessions(classId) }); toast.success("Session closed"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useCancelSession(classId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, string>({
    mutationFn: api.cancelSession,
    onSuccess: () => { qc.invalidateQueries({ queryKey: profKeys.sessions(classId) }); toast.success("Session cancelled"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useMarkAttendance(sessionId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, { recordId: string; body: MarkAttendanceRequest }>({
    mutationFn: ({ recordId, body }) => api.markAttendance(recordId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: profKeys.sessionRecords(sessionId) }); toast.success("Attendance updated"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useReviewExcuse(excuseId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation<unknown, ApiError, ReviewExcuseRequest>({
    mutationFn: (body) => api.reviewExcuseLetter(excuseId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profKeys.excuse(excuseId) });
      qc.invalidateQueries({ queryKey: profKeys.all });
      toast.success("Review submitted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useMarkProfNotificationRead() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: api.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: profKeys.all }),
  });
}
