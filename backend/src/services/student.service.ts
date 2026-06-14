import prisma from "../config/prisma";
import { AppError } from "../utils/app_error";
import path from 'path';
import fs from 'fs';
import { StudentAbsencesDto, StudentAttendanceDto, StudentUpdateProfileDto, SubmitExcuseLetterDto, UploadExcuseLetterAttachmentsDto } from "../interfaces/student.interface";
import argon2 from 'argon2';
import id from "zod/v4/locales/id.js";
import { Prisma } from "@prisma/client";

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
                }
            }
        });

        if (!record) {
            throw new AppError('No records found', 404, 'NOT_FOUND');
        }

        return record;
    }

    static async updateRfidInfo(studentId: string, rfidNumber: string) {
        const student = await prisma.student.findUnique({
            where: { userId: studentId }
        });
    
        if (!student) {
            throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
        }
    
        if (student.verificationStatus === 'RFID_VERIFIED') {
            throw new AppError('RFID is already registered', 400, 'RFID_ALREADY_REGISTERED');
        }
    
        const existingRfid = await prisma.student.findFirst({
            where: { rfidNumber, NOT: { userId: studentId } }
        });
    
        if (existingRfid) {
            throw new AppError('This RFID card is already in use', 400, 'RFID_IN_USE');
        }

        try {
            return await prisma.student.update({
                where: { userId: studentId },
                data: {
                    rfidNumber,
                    rfidStatus: 'ACTIVE',
                    verificationStatus: 'RFID_VERIFIED',
                    registeredAt: new Date()
                },
                select: {
                    rfidNumber: true,
                    rfidStatus: true,
                    verificationStatus: true,
                    registeredAt: true,
                }
            });
        } catch (err) {
            
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P20002') {
                throw new AppError('This RFID card is already in use', 400, 'RFID_IN_USE');
            }
            throw err;
        }
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

        if (data.profileImage && student.user.profileImage) {
            const oldPath = path.join(process.cwd(), student.user.profileImage);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const updateData: any = {
            name: data.name,
            email: data.email,
            username: data.username,
            profileImage: data.profileImage,
        }
    
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
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
        const record = await prisma.attendanceRecord.findMany({
            where: {
                studentId: param.userId,
                ...(param.classId && { session: { classId: String(param.classId) } }),
                ...(param.startDate && param.endDate && {
                    session: {
                        sessionDate: {
                            gte: new Date(String(param.startDate)),
                            lte: new Date(String(param.endDate))
                        }
                    }
                })
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
    
        const existingExcuses = await prisma.excuseDate.findMany({
            where: {
                attendanceId: { in: data.attendanceRecordIds }
            }
        });
    
        if (existingExcuses.length > 0) {
            throw new AppError('Unable to submit request. Pending excuse letter found', 400, 'BAD_REQUEST');
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
    
        return excuseLetter;
    }

    static async uploadExcuseAttachments(param: UploadExcuseLetterAttachmentsDto) {
        const excuseLetter = await prisma.excuseLetter.findFirst({
            where: { id: param.excuseId, studentId: param.userId },
        });
    
        if (!excuseLetter) {
            throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
        }
    
        if (excuseLetter.status !== 'PENDING') {
            throw new AppError('Cannot upload attachments to a processed excuse letter', 400, 'EXCUSE_ALREADY_PROCESSED');
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
                status: true,
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
                status: true,
                approvedBy: true,
                approvalDate: true,
                rejectionReason: true,
                approvedByUser: {
                    select: { name: true }
                },
                excuseDates: {
                    select: {
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
}

export default StudentService;