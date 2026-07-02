import prisma from "../config/prisma";
import { AppError } from "../utils/app_error";
import path from 'path';
import fs from 'fs';
import { StudentAbsencesDto, StudentAttendanceDto, StudentUpdateProfileDto, SubmitExcuseLetterDto, UploadExcuseLetterAttachmentsDto } from "../interfaces/student.interface";
import argon2 from 'argon2';
import { RfidRequestType, RfidRequestStatus, Prisma } from "@prisma/client";
import { CreateNotificationInput } from "../interfaces/notification.interface";
import NotificationService from "./notification.service";
import { normalizeRfid } from "../utils/rfid_utils";

class StudentService {
    static async getStudentProfile (studentId: string) {
        const record = await prisma.student.findUnique({
            where : { userId: studentId },
            omit: {
                id: true,
                userId: true,
                createdAt: true,
                updatedAt: true 
            },
            include: {
                user: {
                    omit: {
                        password: true,
                        updatedAt: true,
                        createdAt: true
                    }
                },
                rfidCards: {
                    where: { status: 'ACTIVE' },
                    select: {
                        rfidNumber: true,
                        status: true,
                        issuedAt: true
                    }
                }
            }
        });

        if (!record) {
            throw new AppError('No records found', 404, 'NOT_FOUND');
        }

        return record;
    }

    static async registerRfid(userId: string, rfidNumber: string) {
        const rfid = normalizeRfid(rfidNumber);

        const student = await prisma.student.findUnique({
            where: { userId }
        });
    
        if (!student) {
            throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
        }
    
        const existingCard = await prisma.rfidCard.findUnique({
            where: { rfidNumber: rfid }
        });
    
        if (existingCard) {
            throw existingCard.status === 'REVOKED'
                ? new AppError('This RFID card has been revoked and cannot be reused', 400, 'RFID_REVOKED')
                : new AppError('This RFID card is already in use', 400, 'RFID_IN_USE');
        }

        const activeCard = await prisma.rfidCard.findFirst({
            where: { studentId: student.id, status: 'ACTIVE' }
        });

        if (activeCard) {
            throw new AppError('You already have an active RFID card', 400, 'RFID_ALREADY_REGISTERED');
        }

        return prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(3, hashText(${student.id}))`;
            

            const card = await tx.rfidCard.create({
                data: { rfidNumber: rfid, studentId: student.id, status: 'ACTIVE' },
                select: { rfidNumber: true, status: true, issuedAt: true }
            });

            await tx.rfidRequest.updateMany({
                where: { studentId: student.id, status: 'PENDING' },
                data: { status: 'FULFILLED', resolvedAt: new Date() }
            });

            return card;
        });
    }

    static async updateProfile(userId: string, data: StudentUpdateProfileDto) {
        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        password: true,
                        profileImage: true,
                        email: true,
                        username: true
                    }
                }
            }
        });
    
        if (!student) {
            throw new AppError('Student profile not found', 404, 'NOT_FOUND');
        }

        const isValidPassword = await argon2.verify(student.user.password, data.password);

        if (!isValidPassword) {
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
        }
    
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        if (data.profileImage && student.user.profileImage) {
            const oldPath = path.join(process.cwd(), student.user.profileImage);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
    }

    static async getStudentClasses (studentId: string) {
        const record = await prisma.classEnrollment.findMany({
            where: { studentId, status: 'ENROLLED' },
            include: {
                class: {
                    include: {
                        course: {
                            omit: {
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                        professor: {
                            select: { id: true, name: true, profileImage: true }
                        },
                        classSchedules: {
                            omit: {
                                classId: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        }
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
                id: true,
                classId: true,
                studentId: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!record) {
            throw new AppError('Class record not found', 404, 'NOT_FOUND');
        }

        return record;
    }

    static async getClassSchedule(studentId: string) {
        const schedules = await prisma.classSchedule.findMany({
            where: {
                class: {
                    classEnrollments: {
                        some: { studentId, status: 'ENROLLED' }
                    },
                }
            },
            include: {
                class: {
                    include: {
                        course: {
                            omit: {
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                        professor: {
                            select: { id: true, name: true, profileImage: true }
                        },
                    },
                    omit: {
                        courseId: true,
                        professorId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            omit: {
                classId: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });

        return schedules;
    }

    static async getStudentAttendance(param: StudentAttendanceDto) {
        const sessionFilter: Prisma.AttendanceSessionWhereInput = {};

        if (param.classId) {
            sessionFilter.classId = param.classId;
        }

        if (param.startDate && param.endDate) {
            sessionFilter.sessionDate = { gte: param.startDate, lte: param.endDate };
        }

        const record = await prisma.attendanceRecord.findMany({
            where: {
                studentId: param.userId,
                ...(Object.keys(sessionFilter).length > 0 && { session: sessionFilter })
            },
            include: {
                session: {
                    include: {
                        class: {
                            include: {
                                course: {
                                    omit: {
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                },
                                professor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        profileImage: true
                                    }
                                }
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
                        id: true,
                        scheduleId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            omit: {
                id: true,
                studentId: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { session: { sessionDate: 'desc' } }
        });

        return record;
    }

    static async getStudentAttendanceSummary(studentId: string) {
        const records = await prisma.attendanceRecord.groupBy({
            by: ['status'],
            where: { studentId },
            _count: { status: true }
        });
    
        const summary = {
            present: records.find(record => record.status === 'PRESENT')?._count.status || 0,
            late: records.find(record => record.status === 'LATE')?._count.status || 0,
            absent: records.find(record => record.status === 'ABSENT')?._count.status || 0,
            excused: records.find(record => record.status === 'EXCUSED')?._count.status || 0,
        };
    
        return summary;
    }

    static async getAbsencesByDateRange(param: StudentAbsencesDto) {
        const absences = await prisma.attendanceRecord.findMany({
            where: {
                studentId: param.studentId,
                status: 'ABSENT',
                session: {
                    sessionDate: {
                        gte: new Date(param.startDate),
                        lte: new Date(param.endDate)
                    }
                },
                excuseDates: {
                    none: {}
                }
            },
            select: {
                id: true,
                status: true,
                session: {
                    select: {
                        id: true,
                        sessionDate: true,
                        startTime: true,
                        endTime: true,
                        schedule: {
                            select: {
                                class: {
                                    select: {
                                        section: true,
                                        schoolYear: true,
                                        semester: true,
                                        room: true,
                                        professor: {
                                            select: {
                                                id: true,
                                                name: true
                                            }
                                        },
                                        course: {
                                            select: {
                                                id: true,
                                                courseCode: true,
                                                courseName: true,
                                                units: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { session: { sessionDate: 'asc' } }
        });
    
        return absences;
    }

    static async submitExcuseLetter(studentId: string, data: SubmitExcuseLetterDto) {
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                id: { in: data.attendanceRecordIds },
                studentId
            }
        });
    
        if (attendanceRecords.length !== data.attendanceRecordIds.length) {
            throw new AppError('One or more attendance records are invalid or do not belong to this student', 400, 'BAD_REQUEST');
        }
    
        const invalidRecords = attendanceRecords.filter(
            r => r.status !== 'ABSENT' && r.status !== 'LATE'
        );
    
        if (invalidRecords.length > 0) {
            throw new AppError('Excuse letters can only be submitted for ABSENT or LATE records', 400, 'INVALID_ATTENDANCE_STATUS');
        }
    
        const blockingExcuses = await prisma.excuseDate.findMany({
            where: {
                attendanceId: { in: data.attendanceRecordIds },
                status: { in: ['PENDING', 'APPROVED'] }
            }
        });

        if (blockingExcuses.length > 0) {
            throw new AppError('An excuse for one or more of these dates is already pending or approved', 400, 'EXCUSE_ALREADY_EXISTS');
        }
    
        const excuseLetter = await prisma.excuseLetter.create({
            data: {
                studentId,
                excuseType: data.excuseType,
                description: data.description,
                excuseDates: {
                    create: data.attendanceRecordIds.map((attendanceId) => ({
                        attendanceId
                    })),
                },
            },
            include: {
                excuseDates: { include: { attendanceRecord: true } }
            }
        });
    
        const affectedClasses = await prisma.attendanceRecord.findMany({
            where: { id: { in: data.attendanceRecordIds } },
            select: {
                session: {
                    select: {
                        class: {
                            select: {
                                professorId: true,
                                course: { select: { courseCode: true } }
                            }
                        }
                    }
                }
            }
        });

        const requester = await prisma.user.findUnique({
            where: { id: studentId },
            select: { name: true }
        });

        const coursesByProfessor = new Map<string, Set<string>>();

        for (const record of affectedClasses) {

            const { professorId, course } = record.session.class;
            const codes = coursesByProfessor.get(professorId) ?? new Set<string>();

            codes.add(course.courseCode);
            coursesByProfessor.set(professorId, codes);
        }

        const professorNotifications: CreateNotificationInput[] = [...coursesByProfessor].map(([professorId, codes]) => ({
            userId: professorId,
            type: 'EXCUSE_SUBMITTED',
            title: 'New Excuse Letter',
            message: `${requester?.name ?? 'A student'} submitted an excuse letter for ${[...codes].join(', ')}.`
        }));

        await NotificationService.safeCreateMany(professorNotifications);

        return excuseLetter;
    }

    static async uploadExcuseAttachments(param: UploadExcuseLetterAttachmentsDto) {
        const excuseLetter = await prisma.excuseLetter.findFirst({
            where: { id: param.excuseId, studentId: param.userId },
            include: { excuseDates: { select: { status: true } } }
        });
    
        if (!excuseLetter) {
            throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
        }

        const alreadyReviewed = excuseLetter.excuseDates.some((d) => d.status !== 'PENDING');

        if (alreadyReviewed) {
            throw new AppError('Cannot upload attachments once the excuse letter has been reviewed', 400, 'EXCUSE_ALREADY_PROCESSED');
        }
    
        const attachments = await prisma.excuseAttachment.createMany({
            data: param.files.map(file => ({
                excuseId: param.excuseId,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                filePath: file.filePath,
            })),
        });
    
        return attachments;
    }

    static async getExcuseLetters(studentId: string) {
        const excuseLetters = await prisma.excuseLetter.findMany({
            where: { studentId },
            select: {
                id: true,
                excuseType: true,
                description: true,
                submittedAt: true,
                excuseDates: {
                    select: {
                        attendanceRecord: {
                            select: {
                                session: {
                                    select: {
                                        class: {
                                            select: {
                                                course: {
                                                    select: { courseCode: true, courseName: true }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { attachments: true }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
    
        return excuseLetters;
    }

    static async getExcuseLetterDetail(studentId: string, excuseId: string) {
        const excuseLetter = await prisma.excuseLetter.findFirst({
            where: { id: excuseId, studentId },
            select: {
                id: true,
                excuseType: true,
                description: true,
                submittedAt: true,
                excuseDates: {
                    select: {
                        status: true,
                        reviewedAt: true,
                        rejectionReason: true,
                        reviewedByUser: { select: { name: true } },
                        attendanceRecord: {
                            select: {
                                id: true,
                                timeIn: true,
                                status: true,
                                session: {
                                    select: {
                                        sessionDate: true,
                                        startTime: true,
                                        endTime: true,
                                        class: {
                                            select: {
                                                section: true,
                                                schoolYear: true,
                                                semester: true,
                                                room: true,
                                                status: true,
                                                course: {
                                                    select: {
                                                        courseCode: true,
                                                        courseName: true,
                                                        courseDescription: true,
                                                        units: true
                                                    }
                                                },
                                                professor: {
                                                    select: { name: true }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                attachments: {
                    select: {
                        fileName: true,
                        fileType: true,
                        fileSize: true
                    }
                }
            }
        });
    
        if (!excuseLetter) {
            throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
        }
    
        return excuseLetter;
    }

    static async submitRfidRequest(
        userId: string,
        data: { type: RfidRequestType; note?: string }
    ) {
        const student = await prisma.student.findUnique({ where: { userId } });

        if (!student) {
            throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
        }

        const pendingRequest = await prisma.rfidRequest.findFirst({
            where: { studentId: student.id, status: 'PENDING' }
        });

        if (pendingRequest) {
            throw new AppError('You already have a pending RFID request', 400, 'RFID_REQUEST_PENDING');
        }

        const activeCard = await prisma.rfidCard.findFirst({
            where: { studentId: student.id, status: 'ACTIVE' }
        });

        let request: {
            id: string;
            type: RfidRequestType;
            status: RfidRequestStatus;
            note: string|null;
            createdAt: Date;
        };

        if (data.type === 'NEW') {
            if (activeCard) {
                throw new AppError('You already have an active RFID card', 400, 'RFID_ALREADY_ACTIVE');
            }

            request = await prisma.rfidRequest.create({
                data: { studentId: student.id, type: 'NEW', note: data.note },
                select: { id: true, type: true, status: true, note: true, createdAt: true }
            });
        } else {

            if (!activeCard) {
                throw new AppError('You have no active RFID card to report', 400, 'NO_ACTIVE_RFID');
            }

            request = await prisma.$transaction(async (tx) => {
                await tx.rfidCard.update({
                    where: { id: activeCard.id },
                    data: {
                        status: 'REVOKED',
                        revokedAt: new Date(),
                        revokedReason: data.type === 'LOST'
                            ? 'Reported lost by student'
                            : 'Reported damaged by student'
                    }
                });
    
                return tx.rfidRequest.create({
                    data: { studentId: student.id, type: data.type, note: data.note },
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        note: true,
                        createdAt: true
                    }
                });
            });
        }

        const admins = await prisma.user.findMany({
            where: { type: 'ADMIN', status: 'ACTIVE' },
            select: { id: true }
        });

        const requester = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const adminNotifications: CreateNotificationInput[] = admins.map((admin) => ({
            userId: admin.id,
            type: 'RFID_REQUEST_SUBMITTED',
            title: 'New RFID request',
            message: `${requester?.name ?? 'A student'} (${student.studentNumber}) submitted a ${request.type} RFID request.`
        }));

        await NotificationService.safeCreateMany(adminNotifications);

        return request;
    }

    static async getRfidRequests(userId: string) {
        const student = await prisma.student.findUnique({ where: { userId } });

        if (!student) {
            throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
        }

        return prisma.rfidRequest.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                status: true,
                note: true,
                rejectionReason: true,
                resolvedAt: true,
                createdAt: true
            }
        });
    }
}

export default StudentService;