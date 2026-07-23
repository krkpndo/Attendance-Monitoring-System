import z from "zod";
import { AuditAction } from "@prisma/client";
import { paginationQuerySchema } from "./shared.validators";

export const idParamSchema = z.object({
    classId: z.string().min(1, 'Class ID is required')
});

export const courseIdParamSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required')
});

export const getUsersQuerySchema = paginationQuerySchema.extend({
    type: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN'], {
        message: 'Type must be STUDENT, PROFESSOR, or ADMIN'
    }).optional(),
    search: z.string().max(100).optional()
});

export const getStudentsQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
    program: z.string().optional(),
    yearLevel: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(6)).optional(),
    section: z.string().optional(),
    verificationStatus: z.enum(['UNVERIFIED', 'RFID_VERIFIED'], {
        message: 'Must be UNVERIFIED or RFID_VERIFIED'
    }).optional()
});

export const createCourseSchema = z.object({
    courseCode: z.string().min(1, 'Course code is required').max(20),
    courseName: z.string().min(1, 'Course name is required').max(100),
    courseDescription: z.string().max(500).optional(),
    units: z.number().int().min(1).max(12)
});

export const updateCourseSchema = z.object({
    courseName: z.string().min(1).max(100).optional(),
    courseDescription: z.string().max(500).optional(),
    units: z.number().int().min(1).max(12).optional()
});

export const createClassSchema = z.object({
    courseId: z.uuid('Invalid course ID'),
    professorId: z.uuid('Invalid professor ID'),
    section: z.string().min(1, 'Section is required').max(20),
    schoolYear: z.string().min(1, 'School year is required').max(20),
    semester: z.enum(['FIRST', 'SECOND', 'THIRD', 'SUMMER'], {
        message: 'Semester must be FIRST, SECOND, THIRD, or SUMMER'
    }),
    room: z.string().max(50).optional()
});

export const getClassesQuerySchema = paginationQuerySchema.extend({
    courseId: z.uuid().optional(),
    professorId: z.uuid().optional(),
    schoolYear: z.string().optional(),
    semester: z.enum(['FIRST', 'SECOND', 'THIRD', 'SUMMER']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const updateClassSchema = z.object({
    professorId: z.string().uuid('Invalid professor ID').optional(),
    section: z.string().min(1).max(20).optional(),
    room: z.string().max(50).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE' }).optional()
});

export const setClassScheduleSchema = z.object({
    schedules: z.array(
        z.object({
            dayOfWeek: z.array(z.number().int().min(0).max(6))
                .min(1, 'At least one day is required'),
            startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time format must be HH:MM:SS'),
            endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time format must be HH:MM:SS')
        }).refine((s) => s.startTime < s.endTime, {
            message: 'startTime must be before endTime',
            path: ['endTime']
        })
    ).min(1, 'At least one schedule is required')
});

export const getAttendanceQuerySchema = paginationQuerySchema.extend({
    classId: z.string().optional(),
    sessionId: z.string().optional(),
    studentId: z.string().optional(),
    startDate: z.coerce.date({ message: 'Invalid start date' }).optional(),
    endDate: z.coerce.date({ message: 'Invalid end date' }).optional()
}).refine((data) => (data.startDate === undefined) === (data.endDate === undefined), {
    message: 'Start date and end date must be provided together',
    path: ['startDate']
});

export const getAuditLogsQuerySchema = paginationQuerySchema.extend({
    userId: z.uuid().optional(),
    // The generated enum object keeps this in sync with schema.prisma; a
    // hand-written list here drifted the moment USER_UPDATED was added.
    action: z.enum(AuditAction, { message: 'Invalid audit action' }).optional(),
    startDate: z.coerce.date({ message: 'Invalid start date' }).optional(),
    endDate: z.coerce.date({ message: 'Invalid end date' }).optional()
}).refine((data) => (data.startDate === undefined) === (data.endDate === undefined), {
    message: 'Start date and end date must be provided together',
    path: ['startDate']
});

export const getExcuseLettersQuerySchema = paginationQuerySchema.extend({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
        message: 'Status must be PENDING, APPROVED, or REJECTED'
    }).optional(),
    studentId: z.string().optional()
});

export const createUserSchema = z.object({
    username: z.string().min(5, 'Username must be at least 5 characters').max(50),
    email: z.email('Invalid email format').max(50),
    name: z.string().min(1, 'Name is required').max(50),
    type: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN'], {
        message: 'Type must be STUDENT, PROFESSOR, or ADMIN'
    }),
    studentData: z.object({
        studentNumber: z.string().min(1, 'Student number is required'),
        yearLevel: z.number().int().min(1).max(6),
        program: z.string().min(1, 'Program is required'),
        section: z.string().min(1, 'Section is required'),
        department: z.string().optional()
    }).optional(),
    professorData: z.object({
        employeeNumber: z.string().min(1, 'Employee number is required'),
        department: z.string().min(1, 'Department is required'),
        position: z.string().min(1, 'Position is required')
    }).optional()
});

export const updateUserSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    email: z.email('Invalid email format').max(50).optional(),
    username: z.string().min(5, 'Username must be at least 5 characters').max(50).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional()
});

export const updateStudentSchema = z.object({
    studentNumber: z.string().min(1, 'Student number is required').optional(),
    yearLevel: z.number().int().min(1).max(6).optional(),
    program: z.string().min(1, 'Program is required').optional(),
    section: z.string().min(1, 'Section is required').optional(),
    department: z.string().optional()
});

export const updateProfessorSchema = z.object({
    employeeNumber: z.string().min(1, 'Employee number is required').optional(),
    department: z.string().min(1, 'Department is required').optional(),
    position: z.string().min(1, 'Position is required').optional()
});

export const enrollStudentSchema = z.object({
    studentId: z.uuid('Invalid student ID')
});

export const getRfidRequestsQuerySchema = paginationQuerySchema.extend({
    status: z.enum(['PENDING', 'FULFILLED', 'REJECTED'], {
        message: 'Status must be PENDING, FULFILLED, or REJECTED'
    }).optional()
});

export const rejectRfidRequestSchema = z.object({
    reason: z.string().min(1, 'REJECTION reason is required').max(500)
});

export const revokeRfidSchema = z.object({
    reason: z.string().max(255).optional()
});

export const registerDeviceSchema = z.object({
    label: z.string().min(1, 'Label is required').max(100)
});

export const deviceIdParamSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required')
});

export const revokeDeviceSchema = z.object({
    reason: z.string().max(255).optional()
});

export const getProfessorsQuerySchema = paginationQuerySchema.extend({
    search: z.string().max(100).optional(),
    department: z.string().max(100).optional()
});