import { z } from "zod";
import {
  attendanceStatusSchema,
  excuseStatusSchema,
  excuseTypeSchema,
  rfidCardStatusSchema,
  rfidRequestStatusSchema,
  rfidRequestTypeSchema,
} from "@/lib/enums";
import {
  classSummarySchema,
  courseSummarySchema,
  professorSummarySchema,
  scheduleSummarySchema,
} from "@/lib/entities";

/* ---------- Profile ---------- */
export const studentProfileSchema = z.object({
  studentNumber: z.string(),
  yearLevel: z.number(),
  program: z.string(),
  section: z.string(),
  department: z.string().nullish(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string(),
    status: z.string(),
    profileImage: z.string().nullish(),
    mustChangePassword: z.boolean().optional(),
    lastLoginAt: z.string().nullish(),
  }),
  rfidCards: z.array(
    z.object({
      rfidNumber: z.string(),
      status: rfidCardStatusSchema,
      issuedAt: z.string(),
    }),
  ),
});
export type StudentProfile = z.infer<typeof studentProfileSchema>;

/* ---------- Classes / schedule ---------- */
export const studentEnrollmentSchema = z.object({
  status: z.string(),
  enrollmentDate: z.string().nullish(),
  class: classSummarySchema.extend({
    classSchedules: z.array(scheduleSummarySchema).optional(),
  }),
});
export const studentClassesSchema = z.array(studentEnrollmentSchema);
export type StudentEnrollment = z.infer<typeof studentEnrollmentSchema>;

export const studentScheduleItemSchema = scheduleSummarySchema.extend({
  class: z.object({
    section: z.string(),
    room: z.string().nullish(),
    course: courseSummarySchema,
    professor: professorSummarySchema.optional(),
  }),
});
export const studentScheduleSchema = z.array(studentScheduleItemSchema);
export type StudentScheduleItem = z.infer<typeof studentScheduleItemSchema>;

/* ---------- Attendance ---------- */
export const studentAttendanceRecordSchema = z.object({
  sessionId: z.string(),
  status: attendanceStatusSchema,
  timeIn: z.string().nullish(),
  isManual: z.boolean().optional(),
  remarks: z.string().nullish(),
  session: z.object({
    sessionDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string().optional(),
    class: z.object({
      section: z.string(),
      room: z.string().nullish(),
      course: courseSummarySchema,
      professor: professorSummarySchema.optional(),
    }),
  }),
});
export type StudentAttendanceRecord = z.infer<typeof studentAttendanceRecordSchema>;

export const attendanceSummarySchema = z.object({
  present: z.number(),
  late: z.number(),
  absent: z.number(),
  excused: z.number(),
});
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;

export const studentAbsenceSchema = z.object({
  id: z.string(),
  status: attendanceStatusSchema,
  session: z.object({
    id: z.string(),
    sessionDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    schedule: z
      .object({
        class: z.object({
          section: z.string(),
          room: z.string().nullish(),
          course: courseSummarySchema,
          professor: z.object({ id: z.string().optional(), name: z.string() }).optional(),
        }),
      })
      .nullish(),
  }),
});
export const studentAbsencesSchema = z.array(studentAbsenceSchema);
export type StudentAbsence = z.infer<typeof studentAbsenceSchema>;

/* ---------- Excuse letters ---------- */
export const studentExcuseListItemSchema = z.object({
  id: z.string(),
  excuseType: excuseTypeSchema,
  description: z.string(),
  submittedAt: z.string(),
  excuseDates: z.array(
    z.object({
      attendanceRecord: z.object({
        session: z.object({ class: z.object({ course: courseSummarySchema }) }),
      }),
    }),
  ),
  _count: z.object({ attachments: z.number() }),
});
export const studentExcuseListSchema = z.array(studentExcuseListItemSchema);
export type StudentExcuseListItem = z.infer<typeof studentExcuseListItemSchema>;

export const studentExcuseDetailSchema = z.object({
  id: z.string(),
  excuseType: excuseTypeSchema,
  description: z.string(),
  submittedAt: z.string(),
  excuseDates: z.array(
    z.object({
      status: excuseStatusSchema,
      reviewedAt: z.string().nullish(),
      rejectionReason: z.string().nullish(),
      reviewedByUser: z.object({ name: z.string() }).nullish(),
      attendanceRecord: z.object({
        id: z.string(),
        timeIn: z.string().nullish(),
        status: attendanceStatusSchema,
        session: z.object({
          sessionDate: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          class: z.object({
            section: z.string(),
            room: z.string().nullish(),
            course: courseSummarySchema,
            professor: z.object({ name: z.string() }).optional(),
          }),
        }),
      }),
    }),
  ),
  attachments: z.array(
    z.object({
      id: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    }),
  ),
});
export type StudentExcuseDetail = z.infer<typeof studentExcuseDetailSchema>;

// Request — submit an excuse. Mirrors the backend validator.
export const submitExcuseRequestSchema = z.object({
  excuseType: excuseTypeSchema,
  description: z.string().min(1, "Description is required").max(1000),
  attendanceRecordIds: z.array(z.string()).min(1, "Pick at least one absence/late record"),
});
export type SubmitExcuseRequest = z.infer<typeof submitExcuseRequestSchema>;

/* ---------- RFID ---------- */
export const rfidRequestSchema = z.object({
  id: z.string(),
  type: rfidRequestTypeSchema,
  status: rfidRequestStatusSchema,
  note: z.string().nullish(),
  rejectionReason: z.string().nullish(),
  resolvedAt: z.string().nullish(),
  createdAt: z.string(),
});
export const rfidRequestsSchema = z.array(rfidRequestSchema);
export type RfidRequest = z.infer<typeof rfidRequestSchema>;

// Register mirrors the backend regex: hex + separators only.
export const registerRfidRequestSchema = z.object({
  rfidNumber: z
    .string()
    .min(1, "Scan a card to fill this in")
    .regex(/^[0-9A-Fa-f:-]+$/, "RFID must contain only hex characters (0-9, A-F)"),
});
export type RegisterRfidRequest = z.infer<typeof registerRfidRequestSchema>;

export const submitRfidRequestSchema = z.object({
  type: rfidRequestTypeSchema,
});
export type SubmitRfidRequest = z.infer<typeof submitRfidRequestSchema>;

/* ---------- Notifications ---------- */
export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  readAt: z.string().nullish(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

/* ---------- Profile update request ---------- */
export const studentProfileUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(50).optional().or(z.literal("")),
  username: z.string().min(5, "At least 5 characters").max(50).optional().or(z.literal("")),
  password: z.string().min(1, "Your current password is required to save changes"),
});
export type StudentProfileUpdate = z.infer<typeof studentProfileUpdateSchema>;
