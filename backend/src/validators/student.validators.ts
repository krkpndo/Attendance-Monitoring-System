import z from "zod";

export const registerRfidSchema = z.object({
    rfidNumber: z.string()
        .min(1, 'RFID number is required')
        .regex(/^[0-9A-Fa-f:-]+$/, 'RFID must contain only hexadecimal characters')
});

export const submitExcuseLetterSchema = z.object({
    excuseType: z.enum(['MEDICAL', 'EMERGENCY', 'SCHOOL_BUSINESS', 'PERSONAL', 'OTHERS'], {
        message: 'Invalid excuse type. Must be MEDICAL, EMERGENCY, SCHOOL_BUSINESS, PERSONAL, or OTHERS'
    }),
    description: z.string().min(1, 'Description is required').max(1000),
    attendanceRecordIds: z.array(z.string().uuid('Invalid attendance record ID'))
        .min(1, 'At least one attendance record is required')
});