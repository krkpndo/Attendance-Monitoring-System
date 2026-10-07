import { apiClient } from "@/api/client";
import { paginated, type PageParams } from "@/lib/pagination";
import {
  attendanceSummarySchema,
  notificationSchema,
  registerRfidRequestSchema,
  rfidRequestsSchema,
  studentAbsencesSchema,
  studentAttendanceRecordSchema,
  studentClassesSchema,
  studentExcuseDetailSchema,
  studentExcuseListSchema,
  studentProfileSchema,
  studentScheduleSchema,
  type RegisterRfidRequest,
  type SubmitExcuseRequest,
  type SubmitRfidRequest,
} from "./student.schema";

/*
 * Student API — the only place student endpoints are called. Each function does
 * the HTTP and parses `res.data.data` through its schema, so callers get a typed,
 * validated result (or a loud throw if the backend drifts). Failures are already
 * ApiError by the time they surface (client interceptor).
 */

/* Profile */
export async function getProfile() {
  const res = await apiClient.get("/student/profile");
  return studentProfileSchema.parse(res.data.data);
}

export async function updateProfile(form: FormData) {
  // Multipart because it can carry a profileImage file. Let the browser set the
  // multipart boundary — overriding Content-Type here would break the upload.
  const res = await apiClient.patch("/student/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* Classes / schedule */
export async function getClasses() {
  const res = await apiClient.get("/student/classes");
  return studentClassesSchema.parse(res.data.data);
}

export async function getSchedule() {
  const res = await apiClient.get("/student/classes/schedule");
  return studentScheduleSchema.parse(res.data.data);
}

/* Attendance */
// The endpoint also accepts an optional date range (both bounds together) and a
// classId — the dashboard uses the range to pull a whole year for client-side
// trend/weekly aggregation.
export type AttendanceQuery = PageParams & { startDate?: string; endDate?: string; classId?: string };

export async function getAttendance(params: AttendanceQuery = {}) {
  const res = await apiClient.get("/student/attendance", { params });
  return paginated(studentAttendanceRecordSchema).parse(res.data.data);
}

export async function getAttendanceSummary() {
  const res = await apiClient.get("/student/attendance/summary");
  return attendanceSummarySchema.parse(res.data.data);
}

export async function getAbsences(range: { startDate: string; endDate: string }) {
  const res = await apiClient.get("/student/attendance/absences", { params: range });
  return studentAbsencesSchema.parse(res.data.data);
}

/* Excuse letters */
export async function getExcuseLetters() {
  const res = await apiClient.get("/student/excuse-letters");
  return studentExcuseListSchema.parse(res.data.data);
}

export async function getExcuseLetter(excuseId: string) {
  const res = await apiClient.get(`/student/excuse-letters/${excuseId}`);
  return studentExcuseDetailSchema.parse(res.data.data);
}

export async function submitExcuseLetter(body: SubmitExcuseRequest) {
  const res = await apiClient.post("/student/excuse-letters/submit", body);
  return res.data.data;
}

export async function uploadExcuseAttachments(excuseId: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await apiClient.post(`/student/excuse-letters/${excuseId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* Notifications */
export async function getNotifications(params: PageParams = {}) {
  const res = await apiClient.get("/student/notifications", { params });
  return paginated(notificationSchema).parse(res.data.data);
}

export async function markNotificationRead(notificationId: string) {
  const res = await apiClient.patch(`/student/notifications/${notificationId}/read`);
  return res.data;
}

/* RFID */
export async function registerRfid(body: RegisterRfidRequest) {
  registerRfidRequestSchema.parse(body); // guard before the network call
  const res = await apiClient.patch("/student/rfid/register", body);
  return res.data.data;
}

export async function submitRfidRequest(body: SubmitRfidRequest) {
  const res = await apiClient.post("/student/rfid/requests", body);
  return res.data.data;
}

export async function getRfidRequests() {
  const res = await apiClient.get("/student/rfid/requests");
  return rfidRequestsSchema.parse(res.data.data);
}
