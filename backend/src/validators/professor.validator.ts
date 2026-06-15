import z from "zod";

export const markAttendanceSchema = z.object({
    status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'], {
        message: 'Status must be PRESENT, LATE, ABSENT, or EXCUSED'
    }),
    remarks: z.string().max(500).optional()
});
