import z from "zod";

export const openAttendanceSessionSchema = z.object({
    classId: z.uuid('Invalid class ID'),
    scheduleId: z.uuid('Invalid schedule ID')
});