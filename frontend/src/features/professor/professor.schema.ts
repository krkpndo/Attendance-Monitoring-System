import { z } from "zod";
import {
  attendanceStatusSchema,
  excuseStatusSchema,
  excuseTypeSchema,
  sessionStatusSchema,
} from "@/lib/enums";
import { classSummarySchema, courseSummarySchema, scheduleSummarySchema } from "@/lib/entities";

/* Profile */
export const professorProfileSchema = z.object({
  employeeNumber: z.string(),
  department: z.string(),
  position: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    username: z.string(),
    status: z.string(),
    profileImage: z.string().nullish(),
  }),
});
export type ProfessorProfile = z.infer<typeof professorProfileSchema>;

/* Assigned classes */
export const professorClassSchema = classSummarySchema.extend({
  classSchedules: z.array(scheduleSummarySchema).optional(),
  _count: z.object({ classEnrollments: z.number() }).optional(),
});
export const professorClassesSchema = z.array(professorClassSchema);
export type ProfessorClass = z.infer<typeof professorClassSchema>;

/* Roster */
export const rosterEntrySchema = z.object({
  status: z.string(),
  enrollmentDate: z.string().nullish(),
  student: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});
export const rosterSchema = z.array(rosterEntrySchema);
export type RosterEntry = z.infer<typeof rosterEntrySchema>;

/* Sessions */
export const sessionSchema = z.object({
  id: z.string(),
  scheduleId: z.string().nullish(),
  sessionDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: sessionStatusSchema,
  openedAt: z.string().nullish(),
  closedAt: z.string().nullish(),
  deviceId: z.string().nullish(),
  _count: z.object({ attendanceRecords: z.number() }).optional(),
});
export const sessionsSchema = z.array(sessionSchema);
export type Session = z.infer<typeof sessionSchema>;

/* Attendance records within a session */
export const sessionRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  status: attendanceStatusSchema,
  timeIn: z.string().nullish(),
  isManual: z.boolean().optional(),
  remarks: z.string().nullish(),
  student: z.object({ name: z.string() }),
});
export const sessionRecordsSchema = z.array(sessionRecordSchema);
export type SessionRecord = z.infer<typeof sessionRecordSchema>;

/* Report (shared shape with admin) */
export const attendanceReportSchema = z.object({
  class: z.object({
    id: z.string(),
    courseCode: z.string(),
    courseName: z.string(),
    section: z.string(),
    schoolYear: z.string(),
    semester: z.string(),
  }),
  students: z.array(
    z.object({
      studentId: z.string(),
      studentName: z.string(),
      studentNumber: z.string().nullish(),
      totalSessions: z.number(),
      present: z.number(),
      late: z.number(),
      absent: z.number(),
      excused: z.number(),
    }),
  ),
});
export type AttendanceReport = z.infer<typeof attendanceReportSchema>;

/* Weekly schedule — every active class's schedule slots for this professor.
 * Display-only: the backend omits the class/schedule IDs, so rows don't link. */
export const weeklyScheduleItemSchema = z.object({
  dayOfWeek: z.array(z.number()),
  startTime: z.string(),
  endTime: z.string(),
  class: z.object({
    section: z.string(),
    room: z.string().nullish(),
    schoolYear: z.string().optional(),
    semester: z.string().optional(),
    course: z.object({ courseCode: z.string(), courseName: z.string() }),
  }),
});
export const weeklyScheduleSchema = z.array(weeklyScheduleItemSchema);
export type WeeklyScheduleItem = z.infer<typeof weeklyScheduleItemSchema>;

/* Excuse letters (professor view) */
export const professorExcuseListItemSchema = z.object({
  id: z.string(),
  excuseType: excuseTypeSchema,
  description: z.string(),
  submittedAt: z.string(),
  student: z.object({ name: z.string() }),
  excuseDates: z.array(
    z.object({
      status: excuseStatusSchema.optional(),
      attendanceRecord: z.object({
        session: z.object({ class: z.object({ course: courseSummarySchema }) }),
      }),
    }),
  ),
});
export const professorExcuseListSchema = z.array(professorExcuseListItemSchema);
export type ProfessorExcuseListItem = z.infer<typeof professorExcuseListItemSchema>;

export const professorExcuseDetailSchema = z.object({
  id: z.string(),
  excuseType: excuseTypeSchema,
  description: z.string(),
  submittedAt: z.string(),
  student: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  excuseDates: z.array(
    z.object({
      status: excuseStatusSchema,
      reviewedAt: z.string().nullish(),
      rejectionReason: z.string().nullish(),
      reviewedByUser: z.object({ name: z.string() }).nullish(),
      attendanceRecord: z.object({
        id: z.string(),
        status: attendanceStatusSchema,
        session: z.object({
          sessionDate: z.string(),
          startTime: z.string(),
          class: z.object({ section: z.string(), course: courseSummarySchema }),
        }),
      }),
    }),
  ),
  attachments: z.array(
    z.object({ id: z.string(), fileName: z.string(), fileType: z.string(), fileSize: z.number() }),
  ),
});
export type ProfessorExcuseDetail = z.infer<typeof professorExcuseDetailSchema>;

/* Requests */
export const openSessionRequestSchema = z.object({
  classId: z.string(),
  scheduleId: z.string(),
  deviceId: z.string().optional(),
});
export type OpenSessionRequest = z.infer<typeof openSessionRequestSchema>;

export const markAttendanceRequestSchema = z.object({
  status: attendanceStatusSchema,
  remarks: z.string().max(500).optional(),
});
export type MarkAttendanceRequest = z.infer<typeof markAttendanceRequestSchema>;

export const reviewExcuseRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});
export type ReviewExcuseRequest = z.infer<typeof reviewExcuseRequestSchema>;
