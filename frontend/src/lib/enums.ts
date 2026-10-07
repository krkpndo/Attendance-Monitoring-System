import { z } from "zod";

/*
 * Shared domain enums — the single frontend mirror of the backend's Postgres
 * enums. Lifted here (out of auth.schema) the moment a second feature needed
 * them, per the "don't copy-paste, lift" rule.
 *
 * Closed sets we style/branch on are real z.enum()s. Open-ended sets that we
 * only ever DISPLAY (notification type, audit action) are left as z.string() so
 * a new backend variant renders as-is instead of throwing a parse error on an
 * otherwise-fine screen.
 */
export const userTypeSchema = z.enum(["STUDENT", "PROFESSOR", "ADMIN"]);
export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const semesterSchema = z.enum(["FIRST", "SECOND", "THIRD", "SUMMER"]);
export const classStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const attendanceStatusSchema = z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]);
export const sessionStatusSchema = z.enum(["SCHEDULED", "OPEN", "CLOSED", "CANCELLED"]);

export const excuseTypeSchema = z.enum(["MEDICAL", "EMERGENCY", "SCHOOL_BUSINESS", "PERSONAL", "OTHERS"]);
export const excuseStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const rfidCardStatusSchema = z.enum(["ACTIVE", "REVOKED"]);
export const rfidRequestTypeSchema = z.enum(["LOST", "DAMAGED", "NEW"]);
export const rfidRequestStatusSchema = z.enum(["PENDING", "FULFILLED", "REJECTED"]);

export const deviceStatusSchema = z.enum(["ACTIVE", "REVOKED"]);

export type UserType = z.infer<typeof userTypeSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type Semester = z.infer<typeof semesterSchema>;
export type ClassStatus = z.infer<typeof classStatusSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type ExcuseType = z.infer<typeof excuseTypeSchema>;
export type ExcuseStatus = z.infer<typeof excuseStatusSchema>;
export type RfidCardStatus = z.infer<typeof rfidCardStatusSchema>;
export type RfidRequestType = z.infer<typeof rfidRequestTypeSchema>;
export type RfidRequestStatus = z.infer<typeof rfidRequestStatusSchema>;
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;
