import prisma from "../config/prisma";
import { AppError } from "../utils/app_error";
import { normalizeRfid } from "../utils/rfid_utils";
import NotificationService from "./notification.service";


class AttendanceEngine {

    static async resolveTap(params: { deviceId: string; rfidNumber: string }) {
        const rfid = normalizeRfid(params.rfidNumber);

        const session = await prisma.attendanceSession.findFirst({
            where: { deviceId: params.deviceId, status: 'OPEN' },
            select: {
                id: true,
                openedAt: true,
                class: { select: { course: { select: { courseCode: true } } } }
            }
        });

        if (!session) {
            throw new AppError('No open attendance session on this device', 409, 'NO_OPEN_SESSION');
        }

        const card = await prisma.rfidCard.findUnique({
            where: { rfidNumber: rfid },
            select: {
                status: true,
                student: { select: { userId: true, user: { select: { name: true } } } }
            }
        });

        if (!card || card.status !== 'ACTIVE') {
            throw new AppError('Card is not registered to an active account', 404, 'UNKNOWN_CARD');
        }

        const studentUserId = card.student.userId;
        const studentName = card.student.user.name;
        const courseCode = session.class.course.courseCode;

        const record = await prisma.attendanceRecord.findUnique({
            where: { sessionId_studentId: { sessionId: session.id, studentId: studentUserId } }
        });

        if (!record) {
            throw new AppError('Student is not enrolled in this class', 409, 'NOT_ENROLLED');
        }

        if (record.isManual || record.status === 'EXCUSED') {
            return {
                outcome: 'SKIPPED_MANUAL' as const,
                studentName,
                courseCode,
                status: record.status,
                timeIn: record.timeIn
            };
        }

        if (record.timeIn) {
            return {
                outcome: 'ALREADY_RECORDED' as const,
                studentName,
                courseCode,
                status: record.status,
                timeIn: record.timeIn
            };
        }

        const thresholdMinutes = Number(process.env.ATTENDANCE_LATE_THRESHOLD_MINUTES ?? 15);
        const reference = session.openedAt ?? new Date();
        const cutoff = new Date(reference.getTime() + thresholdMinutes * 60_000);
        const now = new Date();
        const status = now <= cutoff ? 'PRESENT' : 'LATE';

        const result = await prisma.attendanceRecord.updateMany({
            where: { id: record.id, timeIn: null, isManual: false},
            data: { timeIn: now, status }
        });

        if (result.count === 0) {
            const current = await prisma.attendanceRecord.findUnique({
                where: { id: record.id },
                select: { status: true, timeIn: true }
            });

            return {
                outcome: 'ALREADY_RECORDED' as const,
                studentName,
                courseCode,
                status: current?.status ?? record.status,
                timeIn: current?.timeIn ?? record.timeIn
            };
        }

        if (status === 'LATE') {
            await NotificationService.safeCreate({
                userId: studentUserId,
                type: 'ATTENDANCE_ALERT',
                title: 'Marked late',
                message: `You were marked late for ${courseCode}.`,
                metadata: { sessionId: session.id, status: 'LATE' }
            });
        }

        return {
            outcome: 'RECORDED' as const,
            studentName,
            courseCode,
            status,
            timeIn: now
        };
    }
}

export default AttendanceEngine;