import { z } from "zod";
import {
  attendanceStatusSchema,
  semesterSchema,
  sessionStatusSchema,
  classStatusSchema,
} from "./enums";

/*
 * Cross-feature entity sub-schemas. Course/professor/class/session summaries
 * show up in student, professor, AND admin payloads, so they live here once.
 *
 * All object schemas STRIP unknown keys by default (Zod), so these only need to
 * declare the fields the UI actually reads — extra fields the backend includes
 * are ignored, which keeps a screen from breaking when an unrelated field is
 * added server-side. `.nullish()` = null OR undefined (Prisma nullable + omit).
 */
export const courseSummarySchema = z.object({
  id: z.string().optional(),
  courseCode: z.string(),
  courseName: z.string(),
  courseDescription: z.string().nullish(),
  units: z.number().optional(),
});

export const professorSummarySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  profileImage: z.string().nullish(),
});

export const scheduleSummarySchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.array(z.number()),
  startTime: z.string(),
  endTime: z.string(),
});

export const classSummarySchema = z.object({
  id: z.string().optional(),
  section: z.string(),
  schoolYear: z.string(),
  semester: semesterSchema,
  room: z.string().nullish(),
  status: classStatusSchema.optional(),
  course: courseSummarySchema,
  professor: professorSummarySchema.optional(),
});

export const sessionSummarySchema = z.object({
  sessionDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: sessionStatusSchema.optional(),
});

export const attendanceRecordStatusSchema = attendanceStatusSchema;
