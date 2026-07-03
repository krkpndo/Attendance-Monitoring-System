import prisma from "../config/prisma";
import { AppError } from "../utils/app_error";
import path from 'path';
import fs from 'fs';
import { MarkAttendanceDto, ReviewExcuseLetterDto, UpdateProfileDto } from "../interfaces/professor.interface";
import argon2 from 'argon2';
import AuditService from "./audit.service";
import NotificationService from "./notification.service";
import { CreateNotificationInput } from "../interfaces/notification.interface";
import { Prisma } from "@prisma/client";

class ProfessorService {
    static async getProfessorProfile(userId: string) {
        const professor = await prisma.professor.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true,
                        type: true,
                        status: true,
                        profileImage: true
                    }
                },
            },
            omit: {
                id: true,
                userId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!professor) {
            throw new AppError('Professor profile not found', 404, 'NOT_FOUND');
        }

        return professor;
    }

    static async updateProfile(userId: string, data: UpdateProfileDto) {
        const student = await prisma.professor.findUnique({
            where: { userId },
            include: {
                user: { select: { password: true, profileImage: true, email: true, username: true } }
            }
        });
    
        if (!student) {
            throw new AppError('Professor profile not found', 404, 'NOT_FOUND');
        }

        if (!data.password) {
            throw new AppError('Current password is required to update profile', 400, 'PASSWORD_REQUIRED');
        }

        const validPassword = await argon2.verify(student.user.password, data.password);

        if (!validPassword) {
            throw new AppError('Incorrect password', 401, 'INVALID_PASSWORD');
        }

        if (data.email && data.email !== student.user.email) {
            const emailExists = await prisma.user.findFirst({
                where: { email: data.email, NOT: { id: userId } }
            });
            if (emailExists) {
                throw new AppError('Email already exists', 400, 'EMAIL_EXISTS');
            }
        }

        if (data.username && data.username !== student.user.username) {
            const usernameExists = await prisma.user.findFirst({
                where: { username: data.username, NOT: { id: userId } }
            });
            if (usernameExists) {
                throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
            }
        }

        const updateData: Prisma.UserUpdateInput = {
            name: data.name,
            email: data.email,
            username: data.username,
            profileImage: data.profileImage,
        };

        if (data.newPassword) {
            updateData.password = await argon2.hash(data.newPassword);
        }
    
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            // A password change must invalidate all existing sessions.
            if (data.newPassword) {
                await tx.session.deleteMany({ where: { userId } });
            }
        });

        if (data.profileImage && student.user.profileImage) {
            const oldPath = path.join(process.cwd(), student.user.profileImage);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
    }

    static async getAssignedClasses(userId: string) {
        const classes = await prisma.class.findMany({
            where: { professorId: userId, status: 'ACTIVE' },
            include: {
                course: {
                    select: {
                        id: true,
                        courseCode: true,
                        courseName: true,
                        courseDescription: true,
                        units: true
                    }
                },
                classSchedules: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true
                    }
                },
                _count: {
                    select: {
                        classEnrollments: { where: { status: 'ENROLLED' } }
                    }
                }
            },
            omit: {
                courseId: true,
                professorId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return classes;
    }

    static async getClassRoster(userId: string, classId: string) {
        const classRecord = await prisma.class.findFirst({
            where: { id: classId, professorId: userId }
        });

        if (!classRecord) {
            throw new AppError('Class not found', 404, 'NOT_FOUND');
        }

        const roster = await prisma.classEnrollment.findMany({
            where: { classId, status: 'ENROLLED' },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            omit: {
                id: true,
                classId: true,
                studentId: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { student: { name: 'asc' } }
        });

        return roster;
    }

    static async getClassSchedule(userId: string) {
        const schedules = await prisma.classSchedule.findMany({
            where: {
                class: { professorId: userId, status: 'ACTIVE' }
            },
            include: {
                class: {
                    include: {
                        course: {
                            select: {
                                courseCode: true,
                                courseName: true
                            }
                        }
                    },
                    omit: {
                        id: true,
                        courseId: true,
                        professorId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            omit: {
                id: true,
                classId: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });

        return schedules;
    }

    static async openAttendanceSession(userId: string, classId: string, scheduleId: string, deviceId?: string) {
        const classRecord = await prisma.class.findFirst({
            where: { id: classId, professorId: userId }
        });

        if (!classRecord) {
            throw new AppError('Class not found', 404, 'NOT_FOUND');
        }

        const schedule = await prisma.classSchedule.findFirst({
            where: { id: scheduleId, classId }
        });

        if (!schedule) {
            throw new AppError('Schedule not found for this class', 404, 'NOT_FOUND');
        }

        if (deviceId) {
            const device = await prisma.device.findUnique({
                where: { id: deviceId },
                select: { status: true }
            });

            if (!device || device.status !== 'ACTIVE') {
                throw new AppError('Device not found or revoked', 404, 'DEVICE_NOT_FOUND');
            }
        }

        const session = await prisma.$transaction(async (tx) => {

            await tx.$executeRaw`SELECT pg_advisory_xact_lock(1, hashtext(${classId}))`;

            if (deviceId) {
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(2, hashtext(${deviceId}))`;
            }

            const existingSession = await prisma.attendanceSession.findFirst({
                where: { classId, status: 'OPEN' }
            });
    
            if (existingSession) {
                throw new AppError('Attendance session is already open for this class', 400, 'INVALID_REQUEST');
            }

            if (deviceId) {
                const deviceBusy = await tx.attendanceSession.findFirst({
                    where: { deviceId, status: 'OPEN' }
                });

                if (deviceBusy) {
                    throw new AppError('This device is already in use by another open session', 409, 'DEVICE_IN_USE');
                }
            }

            const newSession = await tx.attendanceSession.create({
                data: {
                    classId,
                    scheduleId,
                    sessionDate: new Date(),
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    status: 'OPEN',
                    openedAt: new Date(),
                    deviceId: deviceId ?? null
                }
            });

            const enrollments = await tx.classEnrollment.findMany({
                where: { classId, status: 'ENROLLED' },
                select: { studentId: true }
            });

            if (enrollments.length > 0) {
                await tx.attendanceRecord.createMany({
                    data: enrollments.map((enrollment) => ({
                        sessionId: newSession.id,
                        studentId: enrollment.studentId,
                        status: 'ABSENT' as const
                    }))
                });
            }

            await AuditService.log({
                actorId: userId,
                action: 'SESSION_OPENED',
                entityType: 'AttendanceSession',
                entityId: newSession.id,
                newValue: { classId, scheduleId, deviceId: deviceId ?? null }
            }, tx);

            if (deviceId) {
                await AuditService.log({
                    actorId: userId,
                    action: 'DEVICE_CLAIMED',
                    entityType: 'Device',
                    entityId: deviceId,
                    newValue: { sessionId: newSession.id, classId }
                }, tx);
            }

            return newSession;
        });

        return session;
    }

    static async closeAttendanceSession(userId: string, sessionId: string) {
        const session = await prisma.attendanceSession.findFirst({
            where: {
                id: sessionId,
                class: { professorId: userId },
                status: 'OPEN'
            },
            select: {
                id: true,
                class: {
                    select: {
                        course: {
                            select: {
                                courseCode: true
                            }
                        }
                    }
                }
            }
        });

        if (!session) {
            throw new AppError('Session not found', 404, 'NOT_FOUND');
        }

        await prisma.$transaction(async (tx) => {
            await tx.attendanceSession.update({
                where: { id: sessionId },
                data: { status:  'CLOSED', closedAt: new Date() }
            });

            await AuditService.log({
                actorId: userId,
                action: 'SESSION_CLOSED',
                entityType: 'AttendanceSession',
                entityId: sessionId,
                oldValue: { status: 'OPEN' },
                newValue: { status: 'CLOSED' }
            }, tx);
        });

        const absentRecords = await prisma.attendanceRecord.findMany({
            where: { sessionId, status: 'ABSENT' },
            select: { studentId: true }
        });

        const courseCode = session.class.course.courseCode;

        const notifications: CreateNotificationInput[] = absentRecords.map((r) => ({
            userId: r.studentId,
            type: 'ATTENDANCE_ALERT',
            title: 'Marked absent',
            message: `You were marked absent for ${courseCode}.`,
            metadata: { sessionId, status: 'ABSENT' }
        }));

        await NotificationService.safeCreateMany(notifications);
    }

    static async cancelAttendanceSession(userId: string, sessionId: string) {
        const session = await prisma.attendanceSession.findFirst({
            where: {
                id: sessionId,
                class: { professorId: userId },
                status: { in: ['SCHEDULED', 'OPEN'] }
            }
        });

        if (!session) {
            throw new AppError('Session not found', 404, 'NOT_FOUND');
        }

        await prisma.$transaction(async (tx) => {
            await tx.attendanceSession.update({
                where: { id: sessionId },
                data: { status: 'CANCELLED', cancelledBy: userId, cancelledAt: new Date() }
            });

            await AuditService.log({
                actorId: userId,
                action: 'SESSION_CANCELLED',
                entityType: 'AttendanceSession',
                entityId: sessionId,
                oldValue: { status: session.status },
                newValue: { status: 'CANCELLED' }
            }, tx);
        });
    }

    static async getAttendanceSessions(userId: string, classId: string) {
        const classRecord = await prisma.class.findFirst({
            where: { id: classId, professorId: userId }
        });

        if (!classRecord) {
            throw new AppError('Class not found', 404, 'NOT_FOUND');
        }

        const sessions = await prisma.attendanceSession.findMany({
            where: { classId },
            include: {
                _count: {
                    select: { attendanceRecords: true }
                }
            },
            omit:{
                createdAt: true,
                updatedAt: true
            },
            orderBy: { sessionDate: 'desc' }
        });

        return sessions;
    }

    static async getAttendanceRecords(userId: string, sessionId: string) {
        const session = await prisma.attendanceSession.findFirst({
            where: {
                id: sessionId,
                class: { professorId: userId }
            }
        });

        if (!session) {
            throw new AppError('Session not found', 404, 'NOT_FOUND');
        }

        const records = await prisma.attendanceRecord.findMany({
            where: { sessionId },
            include: {
                student: {
                    select: { name: true }
                }
            },
            omit: {
                createdAt: true,
                updatedAt: true
            },
            orderBy: { student: { name: 'asc' } }
        });

        return records;
    }

    static async markAttendance(param: MarkAttendanceDto) {
        const record = await prisma.attendanceRecord.findFirst({
            where: {
                id: param.recordId,
                session: { class: { professorId: param.userId } },
            },
            include: {
                session: {
                    select: {
                        class: {
                            select: { course: { select: { courseCode: true } } }
                        }
                    }
                }
            }
        });

        if (!record) {
            throw new AppError('Attendance record not found', 404, 'RECORD_NOT_FOUND');
        }

        const isOverride = record.isManual || record.timeIn !== null;
        
        await prisma.$transaction(async (tx) => {
            await tx.attendanceRecord.update({
                where: { id: param.recordId },
                data: {
                    status: param.data.status,
                    isManual: true,
                    recordedBy: param.userId,
                    remarks: param.data.remarks
                }
            });

            await AuditService.log({
                actorId: param.userId,
                action: isOverride ? 'ATTENDANCE_OVERRIDE' : 'MANUAL_ATTENDANCE',
                entityType: 'AttendanceRecord',
                entityId: param.recordId,
                oldValue: { status: record.status, isManual: record.isManual },
                newValue: { status: param.data.status }
            }, tx);
        });

        if (param.data.status === 'LATE') {
            await NotificationService.safeCreate({
                userId: record.studentId,
                type: 'ATTENDANCE_ALERT',
                title: 'Marked late',
                message: `You were marked late for ${record.session.class.course.courseCode}.`,
                metadata: { recordId: param.recordId, status: 'LATE' }
            });
        }
    }

    static async getExcuseLetters(userId: string, classId?: string) {
        const excuseLetters = await prisma.excuseLetter.findMany({
            where: {
                excuseDates: {
                    some: {
                        attendanceRecord: {
                            session: {
                                class: {
                                    professorId: userId,
                                    ...(classId && { id: classId }),
                                },
                            },
                        },
                    },
                },
            },
            include: {
                student: {
                    select: { name: true },
                },
                excuseDates: {
                    include: {
                        attendanceRecord: {
                            include: {
                                session: {
                                    include: {
                                        class: {
                                            include: {
                                                course: {
                                                    select: {
                                                        id: true,
                                                        courseCode: true, courseName: true
                                                    }
                                                },
                                            },
                                            omit: {
                                                courseId: true,
                                                professorId: true,
                                                createdAt: true,
                                                updatedAt: true
                                            }
                                        },
                                    },
                                    omit: {
                                        classId: true,
                                        scheduleId: true,
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                },
                            },
                            omit: {
                                sessionId: true,
                                studentId: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                    },
                },
                attachments: true,
            },
            omit: {
                createdAt: true,
                updatedAt: true
            },
            orderBy: { submittedAt: 'desc' },
        });

        return excuseLetters;
    }

    static async getExcuseLetterDetail(userId: string, excuseId: string) {
        const excuseLetter = await prisma.excuseLetter.findFirst({
            where: {
                id: excuseId,
                excuseDates: {
                    some: {
                        attendanceRecord: {
                            session: {
                                class: { professorId: userId },
                            },
                        },
                    },
                },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                excuseDates: {
                    include: {
                        reviewedByUser: { select: { name: true } },
                        attendanceRecord: {
                            include: {
                                session: {
                                    include: {
                                        class: {
                                            include: {
                                                course: {
                                                    select: {
                                                        id: true,
                                                        courseCode: true,
                                                        courseName: true,
                                                        courseDescription: true,
                                                        units: true,
                                                    }
                                                },
                                            },
                                            omit: {
                                                courseId: true,
                                                createdAt: true,
                                                updatedAt: true
                                            }
                                        },
                                    },
                                    omit: {
                                        classId: true,
                                        scheduleId: true,
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                },
                            },
                            omit: {
                                sessionId: true,
                                studentId: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                    },
                    omit: {
                        attendanceId: true
                    }
                },
                attachments: true,
            },
            omit: {
                studentId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!excuseLetter) {
            throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
        }

        return excuseLetter;
    }

    static async reviewExcuseLetter(param: ReviewExcuseLetterDto) {
        const { userId, excuseId, data } = param;

        if (data.status === 'REJECTED' && !data.rejectionReason) {
            throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
        }

        const excuseLetter = await prisma.excuseLetter.findUnique({
            where: { id: excuseId },
            select: { id: true, studentId: true }
        });

        if (!excuseLetter) {
            throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
        }

        const pendingDates = await prisma.excuseDate.findMany({
            where: {
                excuseId,
                status: 'PENDING',
                attendanceRecord: { session: { class: { professorId: userId } } }
            },
            select: { id: true, attendanceId: true }
        });

        if (pendingDates.length === 0) {
            throw new AppError('No pending excuse dates for your classes in this letter', 404, 'EXCUSE_NOT_FOUND');
        }

        const dateIds = pendingDates.map((d) => d.id);
        const attendanceIds = pendingDates.map((d) => d.attendanceId);

        const result = await prisma.$transaction(async (tx) => {
            await tx.excuseDate.updateMany({
                where: { id: { in: dateIds } },
                data: {
                    status: data.status,
                    reviewedBy: userId,
                    reviewedAt: new Date(),
                    rejectionReason: data.status === 'REJECTED' ? data.rejectionReason : null
                }
            });

            if (data.status === 'APPROVED') {
                await tx.attendanceRecord.updateMany({
                    where: { id: { in: attendanceIds } },
                    data: { status: 'EXCUSED' }
                });
            }

            await AuditService.log({
                actorId: userId,
                action: data.status === 'APPROVED' ? 'EXCUSE_APPROVED' : 'EXCUSE_REJECTED',
                entityType: 'ExcuseLetter',
                entityId: excuseId,
                description: data.status === 'REJECTED' ? data.rejectionReason : undefined,
                oldValue: { status: 'PENDING' },
                newValue: { status: data.status, affectedRecords: attendanceIds.length }
            }, tx);

            return { excuseId, status: data.status, affectedRecords: attendanceIds.length };
        });

        await NotificationService.safeCreate({
            userId: excuseLetter.studentId,
            type: data.status === 'APPROVED' ? 'EXCUSE_APPROVED' : 'EXCUSE_REJECTED',
            title: data.status === 'APPROVED' ? 'Excuse approved' : 'Excuse Rejected',
            message: data.status === 'APPROVED'
                ? `Your excuse was approved for ${attendanceIds.length} class record(s).`
                : `You excuse was rejected for ${attendanceIds.length} class record(s): ${data.rejectionReason}`,
                metadata: result
        });

        return result;
    }

    // Attendance Reports
    static async getAttendanceReport(userId: string, classId: string) {
        const classRecord = await prisma.class.findFirst({
            where: { id: classId, professorId: userId },
            include: { course: true },
        });

        if (!classRecord) {
            throw new AppError('Class not found', 404, 'NOT_FOUND');
        }

        const report = await prisma.classEnrollment.findMany({
            where: { classId, status: 'ENROLLED' },
            include: {
                student: {
                    select: {
                        name: true,
                        student: {
                            select: { studentNumber: true }
                        },
                        attendanceRecords: {
                            where: { session: { classId } },
                            select: { status: true },
                        },
                    },
                },
            },
            orderBy: { student: { name: 'asc' } },
        });

        const summary = report.map((enrollment) => {
            const records = enrollment.student.attendanceRecords;
            return {
                studentId: enrollment.studentId,
                studentName: enrollment.student.name,
                studentNumber: enrollment.student.student?.studentNumber,
                totalSessions: records.length,
                present: records.filter((r) => r.status === 'PRESENT').length,
                late: records.filter((r) => r.status === 'LATE').length,
                absent: records.filter((r) => r.status === 'ABSENT').length,
                excused: records.filter((r) => r.status === 'EXCUSED').length,
            };
        });

        return {
            class: {
                id: classRecord.id,
                courseCode: classRecord.course.courseCode,
                courseName: classRecord.course.courseName,
                section: classRecord.section,
                schoolYear: classRecord.schoolYear,
                semester: classRecord.semester,
            },
            students: summary,
        };
    }
}

export default ProfessorService;