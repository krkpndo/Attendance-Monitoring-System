import { apiClient } from "@/api/client";
import { paginated, type PageParams } from "@/lib/pagination";
import { notificationSchema } from "@/features/student/student.schema";
import {
  attendanceReportSchema,
  professorClassesSchema,
  professorExcuseDetailSchema,
  professorExcuseListSchema,
  professorProfileSchema,
  rosterSchema,
  sessionRecordsSchema,
  sessionsSchema,
  weeklyScheduleSchema,
  type MarkAttendanceRequest,
  type OpenSessionRequest,
  type ReviewExcuseRequest,
} from "./professor.schema";

/* Profile */
export async function getProfile() {
  const res = await apiClient.get("/professor/profile");
  return professorProfileSchema.parse(res.data.data);
}
export async function updateProfile(form: FormData) {
  const res = await apiClient.patch("/professor/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* Classes */
export async function getClasses() {
  const res = await apiClient.get("/professor/classes");
  return professorClassesSchema.parse(res.data.data);
}
export async function getClassSchedule() {
  const res = await apiClient.get("/professor/classes/schedule");
  return weeklyScheduleSchema.parse(res.data.data);
}
export async function getRoster(classId: string) {
  const res = await apiClient.get(`/professor/classes/${classId}/roster`);
  return rosterSchema.parse(res.data.data);
}
export async function getSessions(classId: string) {
  const res = await apiClient.get(`/professor/classes/${classId}/session`);
  return sessionsSchema.parse(res.data.data);
}
export async function getReport(classId: string) {
  const res = await apiClient.get(`/professor/classes/${classId}/report`);
  return attendanceReportSchema.parse(res.data.data);
}

/* Sessions */
export async function openSession(body: OpenSessionRequest) {
  const res = await apiClient.post("/professor/sessions", body);
  return res.data.data;
}
export async function closeSession(sessionId: string) {
  const res = await apiClient.patch(`/professor/sessions/${sessionId}/close`);
  return res.data;
}
export async function cancelSession(sessionId: string) {
  const res = await apiClient.patch(`/professor/sessions/${sessionId}/cancel`);
  return res.data;
}
export async function getSessionRecords(sessionId: string) {
  const res = await apiClient.get(`/professor/sessions/${sessionId}/attendance`);
  return sessionRecordsSchema.parse(res.data.data);
}
export async function markAttendance(recordId: string, body: MarkAttendanceRequest) {
  const res = await apiClient.patch(`/professor/sessions/attendance/${recordId}`, body);
  return res.data;
}

/* Excuse letters */
export async function getExcuseLetters(params: PageParams = {}) {
  const res = await apiClient.get("/professor/excuse-letters", { params });
  return paginated(professorExcuseListSchema.element).parse(res.data.data);
}
export async function getExcuseLetter(excuseId: string) {
  const res = await apiClient.get(`/professor/excuse-letters/${excuseId}`);
  return professorExcuseDetailSchema.parse(res.data.data);
}
export async function reviewExcuseLetter(excuseId: string, body: ReviewExcuseRequest) {
  const res = await apiClient.patch(`/professor/excuse-letters/${excuseId}/review`, body);
  return res.data;
}

/* Notifications */
export async function getNotifications(params: PageParams = {}) {
  const res = await apiClient.get("/professor/notifications", { params });
  return paginated(notificationSchema).parse(res.data.data);
}
export async function markNotificationRead(notificationId: string) {
  const res = await apiClient.patch(`/professor/notifications/${notificationId}/read`);
  return res.data;
}
