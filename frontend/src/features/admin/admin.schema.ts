import { z } from "zod";
import {
  attendanceStatusSchema,
  classStatusSchema,
  deviceStatusSchema,
  excuseStatusSchema,
  excuseTypeSchema,
  rfidRequestStatusSchema,
  rfidRequestTypeSchema,
  semesterSchema,
  userStatusSchema,
  userTypeSchema,
} from "@/lib/enums";
import { courseSummarySchema, professorSummarySchema } from "@/lib/entities";

/* ---------- Users ---------- */
export const adminUserRowSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  type: userTypeSchema,
  status: userStatusSchema,
  createdAt: z.string().nullish(),
});
export type AdminUserRow = z.infer<typeof adminUserRowSchema>;

export const adminUserDetailSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  type: userTypeSchema,
  status: userStatusSchema,
  profileImage: z.string().nullish(),
  student: z
    .object({
      studentNumber: z.string(),
      yearLevel: z.number(),
      program: z.string(),
      section: z.string(),
      department: z.string().nullish(),
    })
    .nullish(),
  professor: z
    .object({ employeeNumber: z.string(), department: z.string(), position: z.string() })
    .nullish(),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

export const adminStudentRowSchema = z.object({
  studentNumber: z.string(),
  yearLevel: z.number(),
  program: z.string(),
  section: z.string(),
  department: z.string().nullish(),
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), status: userStatusSchema }),
});
export type AdminStudentRow = z.infer<typeof adminStudentRowSchema>;

export const adminProfessorRowSchema = z.object({
  employeeNumber: z.string(),
  department: z.string(),
  position: z.string(),
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), status: userStatusSchema }),
});
export type AdminProfessorRow = z.infer<typeof adminProfessorRowSchema>;

/* ---------- Courses ---------- */
export const adminCourseSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  courseDescription: z.string().nullish(),
  units: z.number(),
  _count: z.object({ classes: z.number() }).optional(),
});
export const adminCoursesSchema = z.array(adminCourseSchema);
export type AdminCourse = z.infer<typeof adminCourseSchema>;

export const adminCourseDetailSchema = adminCourseSchema.extend({
  classes: z.array(
    z.object({
      id: z.string(),
      section: z.string(),
      schoolYear: z.string(),
      semester: semesterSchema,
      room: z.string().nullish(),
      status: classStatusSchema,
      professor: z.object({ name: z.string() }).optional(),
      _count: z.object({ classEnrollments: z.number() }).optional(),
    }),
  ),
});
export type AdminCourseDetail = z.infer<typeof adminCourseDetailSchema>;

/* ---------- Classes ---------- */
export const adminClassRowSchema = z.object({
  id: z.string(),
  section: z.string(),
  schoolYear: z.string(),
  semester: semesterSchema,
  room: z.string().nullish(),
  status: classStatusSchema,
  course: z.object({ id: z.string().optional(), courseCode: z.string(), courseName: z.string() }),
  professor: z.object({ id: z.string().optional(), name: z.string() }),
  _count: z.object({ classEnrollments: z.number() }).optional(),
});
export type AdminClassRow = z.infer<typeof adminClassRowSchema>;

export const adminClassDetailSchema = z.object({
  id: z.string(),
  section: z.string(),
  schoolYear: z.string(),
  semester: semesterSchema,
  room: z.string().nullish(),
  status: classStatusSchema,
  course: courseSummarySchema,
  professor: professorSummarySchema.optional(),
  classSchedules: z.array(
    z.object({ id: z.string(), dayOfWeek: z.array(z.number()), startTime: z.string(), endTime: z.string() }),
  ),
  classEnrollments: z.array(
    z.object({
      status: z.string(),
      student: z.object({ name: z.string(), profileImage: z.string().nullish() }),
    }),
  ),
});
export type AdminClassDetail = z.infer<typeof adminClassDetailSchema>;

export const adminEnrollmentSchema = z.object({
  status: z.string(),
  enrollmentDate: z.string().nullish(),
  droppedDate: z.string().nullish(),
  student: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});
export const adminEnrollmentsSchema = z.array(adminEnrollmentSchema);
export type AdminEnrollment = z.infer<typeof adminEnrollmentSchema>;

/* ---------- Attendance ---------- */
export const adminAttendanceRowSchema = z.object({
  status: attendanceStatusSchema,
  timeIn: z.string().nullish(),
  isManual: z.boolean().optional(),
  student: z.object({ id: z.string(), name: z.string() }),
  session: z.object({
    sessionDate: z.string(),
    startTime: z.string(),
    status: z.string().optional(),
    class: z.object({
      section: z.string(),
      course: z.object({ courseCode: z.string(), courseName: z.string() }),
      professor: z.object({ id: z.string().optional(), name: z.string() }).optional(),
    }),
  }),
});
export type AdminAttendanceRow = z.infer<typeof adminAttendanceRowSchema>;

/* ---------- Excuse letters (admin oversight) ---------- */
export const adminExcuseSchema = z.object({
  id: z.string(),
  excuseType: excuseTypeSchema,
  description: z.string(),
  submittedAt: z.string(),
  student: z.object({ id: z.string(), name: z.string() }),
  excuseDates: z.array(
    z.object({
      status: excuseStatusSchema,
      rejectionReason: z.string().nullish(),
      reviewedByUser: z.object({ name: z.string() }).nullish(),
      attendanceRecord: z.object({
        status: attendanceStatusSchema,
        session: z.object({
          sessionDate: z.string(),
          class: z.object({ section: z.string(), course: z.object({ courseCode: z.string() }) }),
        }),
      }),
    }),
  ),
  attachments: z.array(z.object({ id: z.string(), fileName: z.string(), fileSize: z.number() })).optional(),
});
export type AdminExcuse = z.infer<typeof adminExcuseSchema>;

/* ---------- Audit ---------- */
export const auditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullish(),
  description: z.string().nullish(),
  ipAddress: z.string().nullish(),
  createdAt: z.string(),
  user: z.object({ name: z.string(), type: userTypeSchema }).nullish(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

/* ---------- RFID requests ---------- */
export const adminRfidRequestSchema = z.object({
  id: z.string(),
  type: rfidRequestTypeSchema,
  status: rfidRequestStatusSchema,
  note: z.string().nullish(),
  rejectionReason: z.string().nullish(),
  resolvedAt: z.string().nullish(),
  createdAt: z.string(),
  student: z.object({
    studentNumber: z.string(),
    user: z.object({ name: z.string(), email: z.string() }),
  }),
});
export type AdminRfidRequest = z.infer<typeof adminRfidRequestSchema>;

/* ---------- Devices ---------- */
export const deviceSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: deviceStatusSchema,
  revokedReason: z.string().nullish(),
  lastSeenAt: z.string().nullish(),
  createdAt: z.string(),
  lastUsedBy: z.object({ id: z.string(), name: z.string(), at: z.string().nullish() }).nullish(),
});
export const devicesSchema = z.array(deviceSchema);
export type Device = z.infer<typeof deviceSchema>;

export const registeredDeviceSchema = deviceSchema.extend({ token: z.string() });
export type RegisteredDevice = z.infer<typeof registeredDeviceSchema>;

/* ---------- Request schemas (forms) ---------- */
export const createUserSchema = z
  .object({
    username: z.string().min(5, "At least 5 characters").max(50),
    email: z.string().email("Invalid email").max(50),
    name: z.string().min(1, "Name is required").max(50),
    type: userTypeSchema,
    // Student
    studentNumber: z.string().optional(),
    yearLevel: z.coerce.number().int().min(1).max(6).optional(),
    program: z.string().optional(),
    section: z.string().optional(),
    department: z.string().optional(),
    // Professor
    employeeNumber: z.string().optional(),
    position: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "STUDENT") {
      for (const f of ["studentNumber", "program", "section"] as const)
        if (!v[f]) ctx.addIssue({ code: "custom", path: [f], message: "Required for students" });
      if (!v.yearLevel) ctx.addIssue({ code: "custom", path: ["yearLevel"], message: "Required" });
    }
    if (v.type === "PROFESSOR") {
      for (const f of ["employeeNumber", "department", "position"] as const)
        if (!v[f]) ctx.addIssue({ code: "custom", path: [f], message: "Required for professors" });
    }
  });
export type CreateUserForm = z.infer<typeof createUserSchema>;
// Input type (pre-coercion) for react-hook-form — `z.coerce.number()` inputs are
// `unknown` before parse, so the form's field type differs from the parsed output.
export type CreateUserInput = z.input<typeof createUserSchema>;

export const createCourseSchema = z.object({
  courseCode: z.string().min(1, "Required").max(20),
  courseName: z.string().min(1, "Required").max(100),
  courseDescription: z.string().max(500).optional(),
  units: z.coerce.number().int().min(1).max(12),
});
export type CreateCourseForm = z.infer<typeof createCourseSchema>;
export type CreateCourseInput = z.input<typeof createCourseSchema>;

export const createClassSchema = z.object({
  courseId: z.string().min(1, "Pick a course"),
  professorId: z.string().min(1, "Pick a professor"),
  section: z.string().min(1, "Required").max(20),
  schoolYear: z.string().min(1, "Required").max(20),
  semester: semesterSchema,
  room: z.string().max(50).optional(),
});
export type CreateClassForm = z.infer<typeof createClassSchema>;
