import z from "zod";
import { paginationQuerySchema } from "./shared.validators";

export const markAttendanceSchema = z.object({
    status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'], {
        message: 'Status must be PRESENT, LATE, ABSENT, or EXCUSED'
    }),
    remarks: z.string().max(500).optional()
});

export const openSessionSchema = z.object({
    classId: z.string().min(1, 'Class ID is required'),
    scheduleId: z.string().min(1, 'Schedule ID is required'),
    deviceId: z.string().min(1).optional()
});

export const getExcuseLettersQuerySchema = paginationQuerySchema.extend({
    classId: z.uuid('Invalid class ID').optional()
});