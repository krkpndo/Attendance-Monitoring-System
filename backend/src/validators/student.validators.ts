import z from "zod";

export const studentUpdateProfileSchema = z.object({
    name: z.string().min(1, 'Name must have at least 5 characters').max(50, 'Name is limited to 50 characters').optional(),
    email: z.email('Invalid email format').max(50, 'Email is limited to 50 characters').optional(),
    username: z.string().min(5, 'Username must have at least 5 characters').max(50, 'Username is limited to 50 characters').optional(),
    password: z.string('Updating information requires password').min(1, 'Updating information requires password'),
});

export const registerRfidSchema = z.object({
    rfidNumber: z.string('RFID number is required')
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

export const submitRfidRequestSchema = z.object({
    type: z.enum(['LOST', 'DAMAGED', 'NEW'], {
        message: 'Type must be LOST, DAMAGED, or NEW'
    })
});

export const getAbsencesQuerySchema = z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required')
});