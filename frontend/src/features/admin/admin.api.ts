import { apiClient } from "@/api/client";
import { paginated, type PageParams } from "@/lib/pagination";
import { notificationSchema } from "@/features/student/student.schema";
import { attendanceReportSchema } from "@/features/professor/professor.schema";
import {
  adminAttendanceRowSchema,
  adminClassDetailSchema,
  adminClassRowSchema,
  adminCourseDetailSchema,
  adminCoursesSchema,
  adminEnrollmentsSchema,
  adminExcuseSchema,
  adminProfessorRowSchema,
  adminRfidRequestSchema,
  adminStudentRowSchema,
  adminUserDetailSchema,
  adminUserRowSchema,
  auditLogSchema,
  devicesSchema,
  registeredDeviceSchema,
} from "./admin.schema";

type Filters = Record<string, string | number | undefined>;

/* ---------- Users ---------- */
export async function getUsers(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/users", { params });
  return paginated(adminUserRowSchema).parse(res.data.data);
}
export async function getUserDetail(userId: string) {
  const res = await apiClient.get(`/admin/users/${userId}`);
  return adminUserDetailSchema.parse(res.data.data);
}
export async function createUser(body: unknown) {
  const res = await apiClient.post("/admin/users/create", body);
  return res.data.data;
}
export async function updateUser(userId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/users/${userId}`, body);
  return res.data.data;
}
export async function deactivateUser(userId: string) {
  const res = await apiClient.patch(`/admin/users/${userId}/deactivate`);
  return res.data;
}
export async function updateStudent(userId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/users/students/${userId}`, body);
  return res.data;
}
export async function updateProfessor(userId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/users/professors/${userId}`, body);
  return res.data;
}
export async function getStudents(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/students", { params });
  return paginated(adminStudentRowSchema).parse(res.data.data);
}
export async function getProfessors(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/professors", { params });
  return paginated(adminProfessorRowSchema).parse(res.data.data);
}

/* ---------- Courses ---------- */
export async function getCourses() {
  const res = await apiClient.get("/admin/courses");
  return adminCoursesSchema.parse(res.data.data);
}
export async function getCourseDetail(courseId: string) {
  const res = await apiClient.get(`/admin/courses/${courseId}`);
  return adminCourseDetailSchema.parse(res.data.data);
}
export async function createCourse(body: unknown) {
  const res = await apiClient.post("/admin/courses/create", body);
  return res.data.data;
}
export async function updateCourse(courseId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/courses/${courseId}/update`, body);
  return res.data.data;
}

/* ---------- Classes ---------- */
export async function getClasses(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/classes", { params });
  return paginated(adminClassRowSchema).parse(res.data.data);
}
export async function getClassDetail(classId: string) {
  const res = await apiClient.get(`/admin/classes/${classId}`);
  return adminClassDetailSchema.parse(res.data.data);
}
export async function createClass(body: unknown) {
  const res = await apiClient.post("/admin/classes/create", body);
  return res.data.data;
}
export async function updateClass(classId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/classes/${classId}/update`, body);
  return res.data.data;
}
export async function setClassSchedule(classId: string, schedules: unknown) {
  const res = await apiClient.put(`/admin/classes/${classId}/schedule`, { schedules });
  return res.data.data;
}
export async function enrollStudent(classId: string, studentId: string) {
  const res = await apiClient.post(`/admin/classes/${classId}/enroll`, { studentId });
  return res.data.data;
}
export async function dropStudent(classId: string, studentId: string) {
  const res = await apiClient.patch(`/admin/classes/${classId}/students/${studentId}/drop`);
  return res.data;
}
export async function getClassEnrollments(classId: string) {
  const res = await apiClient.get(`/admin/classes/${classId}/enrollments`);
  return adminEnrollmentsSchema.parse(res.data.data);
}

/* ---------- Attendance ---------- */
export async function getAttendance(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/attendance", { params });
  return paginated(adminAttendanceRowSchema).parse(res.data.data);
}
export async function getAttendanceReport(classId: string) {
  const res = await apiClient.get(`/admin/attendance/${classId}/report`);
  return attendanceReportSchema.parse(res.data.data);
}

/* ---------- Excuse oversight ---------- */
export async function getExcuseLetters(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/excuse-letters", { params });
  return paginated(adminExcuseSchema).parse(res.data.data);
}
export async function reviewExcuseLetter(excuseId: string, body: unknown) {
  const res = await apiClient.patch(`/admin/excuse-letters/${excuseId}/review`, body);
  return res.data;
}

/* ---------- Audit ---------- */
export async function getAuditLogs(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/audit-logs", { params });
  return paginated(auditLogSchema).parse(res.data.data);
}

/* ---------- Notifications ---------- */
export async function getNotifications(params: PageParams = {}) {
  const res = await apiClient.get("/admin/notifications", { params });
  return paginated(notificationSchema).parse(res.data.data);
}
export async function markNotificationRead(id: string) {
  const res = await apiClient.patch(`/admin/notifications/${id}/read`);
  return res.data;
}

/* ---------- RFID ---------- */
export async function revokeRfid(userId: string, reason?: string) {
  const res = await apiClient.patch(`/admin/students/${userId}/rfid/revoke`, { reason });
  return res.data;
}
export async function getRfidRequests(params: Filters & PageParams = {}) {
  const res = await apiClient.get("/admin/rfid/requests", { params });
  return paginated(adminRfidRequestSchema).parse(res.data.data);
}
export async function rejectRfidRequest(requestId: string, reason: string) {
  const res = await apiClient.patch(`/admin/rfid/requests/${requestId}/reject`, { reason });
  return res.data;
}

/* ---------- Devices ---------- */
export async function getDevices() {
  const res = await apiClient.get("/admin/devices");
  return devicesSchema.parse(res.data.data);
}
export async function registerDevice(label: string) {
  const res = await apiClient.post("/admin/devices", { label });
  return registeredDeviceSchema.parse(res.data.data);
}
export async function revokeDevice(deviceId: string, reason?: string) {
  const res = await apiClient.patch(`/admin/devices/${deviceId}/revoke`, { reason });
  return res.data;
}
