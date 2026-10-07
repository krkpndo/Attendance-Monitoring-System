import crypto from 'node:crypto';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const MANILA_TIME_ZONE = 'Asia/Manila';
const MANILA_UTC_OFFSET_MINUTES = 8 * 60;
const DEVELOPMENT_PASSWORD = 'DevOnly123!';
const DEVELOPMENT_DEVICE_TOKEN = 'dev_seed_attendance_terminal_000000000001';
const DEVELOPMENT_RFID_UID = '04A1B2C3D4';

const ids = {
  user: {
    admin: '10000000-0000-4000-8000-000000000001',
    professor: '10000000-0000-4000-8000-000000000002',
    student: '10000000-0000-4000-8000-000000000003',
  },
  profile: {
    professor: '20000000-0000-4000-8000-000000000001',
    student: '20000000-0000-4000-8000-000000000002',
  },
  course: {
    cs101: '30000000-0000-4000-8000-000000000001',
    cs202: '30000000-0000-4000-8000-000000000002',
  },
  class: {
    cs101: '40000000-0000-4000-8000-000000000001',
    cs202: '40000000-0000-4000-8000-000000000002',
  },
  schedule: {
    cs101: '50000000-0000-4000-8000-000000000001',
    cs202: '50000000-0000-4000-8000-000000000002',
  },
  enrollment: {
    cs101: '60000000-0000-4000-8000-000000000001',
    cs202: '60000000-0000-4000-8000-000000000002',
  },
  device: '70000000-0000-4000-8000-000000000001',
  rfidCard: '71000000-0000-4000-8000-000000000001',
  rfidRequest: '72000000-0000-4000-8000-000000000001',
  session: {
    rejected: '80000000-0000-4000-8000-000000000001',
    excused: '80000000-0000-4000-8000-000000000002',
    pending: '80000000-0000-4000-8000-000000000003',
    present: '80000000-0000-4000-8000-000000000004',
    unexcused: '80000000-0000-4000-8000-000000000005',
    open: '80000000-0000-4000-8000-000000000006',
    upcoming: '80000000-0000-4000-8000-000000000007',
  },
  attendance: {
    rejected: '81000000-0000-4000-8000-000000000001',
    excused: '81000000-0000-4000-8000-000000000002',
    pending: '81000000-0000-4000-8000-000000000003',
    present: '81000000-0000-4000-8000-000000000004',
    unexcused: '81000000-0000-4000-8000-000000000005',
    open: '81000000-0000-4000-8000-000000000006',
  },
  excuse: {
    rejected: '90000000-0000-4000-8000-000000000001',
    approved: '90000000-0000-4000-8000-000000000002',
    pending: '90000000-0000-4000-8000-000000000003',
  },
  excuseDate: {
    rejected: '91000000-0000-4000-8000-000000000001',
    approved: '91000000-0000-4000-8000-000000000002',
    pending: '91000000-0000-4000-8000-000000000003',
  },
  notification: {
    studentAbsence: 'a0000000-0000-4000-8000-000000000001',
    studentApproved: 'a0000000-0000-4000-8000-000000000002',
    professorPending: 'a0000000-0000-4000-8000-000000000003',
    adminRfid: 'a0000000-0000-4000-8000-000000000004',
  },
  audit: {
    deviceRegistered: 'b0000000-0000-4000-8000-000000000001',
    sessionOpened: 'b0000000-0000-4000-8000-000000000002',
    deviceClaimed: 'b0000000-0000-4000-8000-000000000003',
    excuseApproved: 'b0000000-0000-4000-8000-000000000004',
    excuseRejected: 'b0000000-0000-4000-8000-000000000005',
  },
} as const;

type CalendarDay = {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
};

type TargetDatabase = {
  connectionString: string;
  host: string;
  database: string;
};

function requireDevelopmentTarget(): TargetDatabase {
  if (process.env.NODE_ENV?.toLowerCase() === 'production') {
    throw new Error('Refusing to run the destructive development seed because NODE_ENV=production.');
  }

  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      'Destructive development seed not authorized. Run it intentionally with ALLOW_DESTRUCTIVE_SEED=true.',
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.');
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql:// or postgres:// protocol.');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  if (!parsed.hostname || !database) {
    throw new Error('DATABASE_URL must include a database host and database name.');
  }

  return { connectionString, host: parsed.hostname, database };
}

function manilaParts(instant: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((candidate) => candidate.type === type)?.value;
    if (!part) throw new Error(`Unable to derive Manila ${type} from the seed clock.`);
    return Number(part);
  };

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

function calendarDay(base: Pick<CalendarDay, 'year' | 'month' | 'day'>, offsetDays: number): CalendarDay {
  const shifted = new Date(Date.UTC(base.year, base.month - 1, base.day + offsetDays));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

function databaseDate(day: CalendarDay): Date {
  return new Date(Date.UTC(day.year, day.month - 1, day.day));
}

function databaseTime(minutesSinceMidnight: number): Date {
  return new Date(Date.UTC(1970, 0, 1, 0, minutesSinceMidnight));
}

function manilaInstant(day: CalendarDay, minutesSinceMidnight: number): Date {
  return new Date(
    Date.UTC(day.year, day.month - 1, day.day, 0, minutesSinceMidnight - MANILA_UTC_OFFSET_MINUTES),
  );
}

function offsetInstant(seedNow: Date, offsetMilliseconds: number): Date {
  return new Date(seedNow.getTime() + offsetMilliseconds);
}

function schoolYearFor(day: CalendarDay): string {
  const firstYear = day.month >= 6 ? day.year : day.year - 1;
  return `${firstYear}-${firstYear + 1}`;
}

async function clearCanonicalDomain(tx: Prisma.TransactionClient): Promise<void> {
  await tx.notification.deleteMany();
  await tx.auditLog.deleteMany();
  await tx.excuseAttachment.deleteMany();
  await tx.excuseDate.deleteMany();
  await tx.excuseLetter.deleteMany();
  await tx.attendanceRecord.deleteMany();
  await tx.attendanceSession.deleteMany();
  await tx.device.deleteMany();
  await tx.classEnrollment.deleteMany();
  await tx.classSchedule.deleteMany();
  await tx.class.deleteMany();
  await tx.course.deleteMany();
  await tx.rfidRequest.deleteMany();
  await tx.rfidCard.deleteMany();
  await tx.passwordReset.deleteMany();
  await tx.session.deleteMany();
  await tx.student.deleteMany();
  await tx.professor.deleteMany();
  await tx.user.deleteMany();
}

async function seedCanonicalDevelopmentData(
  tx: Prisma.TransactionClient,
  seedNow: Date,
  passwordHash: string,
  deviceTokenHash: string,
): Promise<void> {
  const nowInManila = manilaParts(seedNow);
  const today = calendarDay(nowInManila, 0);
  const yesterday = calendarDay(today, -1);
  const dayMinus7 = calendarDay(today, -7);
  const dayMinus14 = calendarDay(today, -14);
  const dayMinus21 = calendarDay(today, -21);
  const dayMinus28 = calendarDay(today, -28);
  const requestDay = calendarDay(today, -35);
  const cardIssuedDay = calendarDay(today, -34);

  const nowMinutes = nowInManila.hour * 60 + nowInManila.minute;
  const primaryStartMinutes = Math.max(0, Math.min(Math.floor(nowMinutes / 5) * 5 - 5, 22 * 60 + 30));
  const primaryEndMinutes = Math.min(primaryStartMinutes + 90, 23 * 60 + 59);

  const roundedFutureMinutes = Math.ceil((nowMinutes + 60) / 30) * 30;
  const secondaryIsToday = roundedFutureMinutes + 60 <= 23 * 60 + 59;
  const upcomingDay = secondaryIsToday ? today : calendarDay(today, 1);
  const secondaryStartMinutes = secondaryIsToday ? roundedFutureMinutes : 9 * 60;
  const secondaryEndMinutes = secondaryStartMinutes + 60;

  const primaryScheduleDays = [...new Set([today.dayOfWeek, yesterday.dayOfWeek])].sort((a, b) => a - b);
  const schoolYear = schoolYearFor(today);

  const rejectedOpenedAt = manilaInstant(dayMinus28, primaryStartMinutes);
  const rejectedClosedAt = manilaInstant(dayMinus28, primaryEndMinutes);
  const excusedOpenedAt = manilaInstant(dayMinus21, primaryStartMinutes);
  const excusedClosedAt = manilaInstant(dayMinus21, primaryEndMinutes);
  const pendingOpenedAt = manilaInstant(dayMinus14, primaryStartMinutes);
  const pendingClosedAt = manilaInstant(dayMinus14, primaryEndMinutes);
  const presentOpenedAt = manilaInstant(dayMinus7, primaryStartMinutes);
  const presentClosedAt = manilaInstant(dayMinus7, primaryEndMinutes);
  const unexcusedOpenedAt = manilaInstant(yesterday, primaryStartMinutes);
  const unexcusedClosedAt = manilaInstant(yesterday, primaryEndMinutes);

  const approvedSubmittedAt = manilaInstant(calendarDay(dayMinus21, 1), 9 * 60);
  const approvedReviewedAt = manilaInstant(calendarDay(dayMinus21, 1), 13 * 60);
  const rejectedSubmittedAt = manilaInstant(calendarDay(dayMinus28, 1), 9 * 60);
  const rejectedReviewedAt = manilaInstant(calendarDay(dayMinus28, 1), 13 * 60);
  const pendingSubmittedAt = manilaInstant(calendarDay(dayMinus14, 1), 9 * 60);
  const requestCreatedAt = manilaInstant(requestDay, 10 * 60);
  const cardIssuedAt = manilaInstant(cardIssuedDay, 10 * 60);

  await tx.user.createMany({
    data: [
      {
        id: ids.user.admin,
        username: 'admin.dev',
        password: passwordHash,
        email: 'admin@attendance.example.test',
        name: 'Andrea Cruz',
        type: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: false,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.user.professor,
        username: 'professor.dev',
        password: passwordHash,
        email: 'professor@attendance.example.test',
        name: 'Prof. Paulo Reyes',
        type: 'PROFESSOR',
        status: 'ACTIVE',
        mustChangePassword: false,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.user.student,
        username: 'student.dev',
        password: passwordHash,
        email: 'student@attendance.example.test',
        name: 'Sofia Santos',
        type: 'STUDENT',
        status: 'ACTIVE',
        mustChangePassword: false,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.professor.create({
    data: {
      id: ids.profile.professor,
      userId: ids.user.professor,
      employeeNumber: 'PROF-DEV-001',
      department: 'Computer Science',
      position: 'Instructor',
      createdAt: seedNow,
      updatedAt: seedNow,
    },
  });

  await tx.student.create({
    data: {
      id: ids.profile.student,
      userId: ids.user.student,
      studentNumber: 'STU-DEV-001',
      department: 'Computer Science',
      program: 'BSCS',
      section: 'A',
      yearLevel: 3,
      createdAt: seedNow,
      updatedAt: seedNow,
    },
  });

  await tx.course.createMany({
    data: [
      {
        id: ids.course.cs101,
        courseCode: 'CS101',
        courseName: 'Web Systems',
        courseDescription: 'Development fixture course for web systems attendance workflows.',
        units: 3,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.course.cs202,
        courseCode: 'CS202',
        courseName: 'Database Systems',
        courseDescription: 'Development fixture course for database systems attendance workflows.',
        units: 3,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.class.createMany({
    data: [
      {
        id: ids.class.cs101,
        courseId: ids.course.cs101,
        professorId: ids.user.professor,
        section: 'BSCS-3A',
        schoolYear,
        semester: 'FIRST',
        room: 'Room 301',
        status: 'ACTIVE',
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.class.cs202,
        courseId: ids.course.cs202,
        professorId: ids.user.professor,
        section: 'BSCS-3A',
        schoolYear,
        semester: 'FIRST',
        room: 'Lab 302',
        status: 'ACTIVE',
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.classSchedule.createMany({
    data: [
      {
        id: ids.schedule.cs101,
        classId: ids.class.cs101,
        dayOfWeek: primaryScheduleDays,
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.schedule.cs202,
        classId: ids.class.cs202,
        dayOfWeek: [upcomingDay.dayOfWeek],
        startTime: databaseTime(secondaryStartMinutes),
        endTime: databaseTime(secondaryEndMinutes),
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.classEnrollment.createMany({
    data: [
      {
        id: ids.enrollment.cs101,
        classId: ids.class.cs101,
        studentId: ids.user.student,
        enrollmentDate: seedNow,
        status: 'ENROLLED',
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.enrollment.cs202,
        classId: ids.class.cs202,
        studentId: ids.user.student,
        enrollmentDate: seedNow,
        status: 'ENROLLED',
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.device.create({
    data: {
      id: ids.device,
      label: 'Development Room 301 Terminal',
      tokenHash: deviceTokenHash,
      status: 'ACTIVE',
      lastSeenAt: offsetInstant(seedNow, -60_000),
      createdAt: offsetInstant(seedNow, -30 * 60_000),
      updatedAt: seedNow,
    },
  });

  await tx.rfidRequest.create({
    data: {
      id: ids.rfidRequest,
      studentId: ids.profile.student,
      type: 'NEW',
      status: 'FULFILLED',
      note: 'Canonical development card request.',
      resolvedAt: cardIssuedAt,
      createdAt: requestCreatedAt,
      updatedAt: cardIssuedAt,
    },
  });

  await tx.rfidCard.create({
    data: {
      id: ids.rfidCard,
      rfidNumber: DEVELOPMENT_RFID_UID,
      studentId: ids.profile.student,
      status: 'ACTIVE',
      issuedAt: cardIssuedAt,
    },
  });

  await tx.attendanceSession.createMany({
    data: [
      {
        id: ids.session.rejected,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(dayMinus28),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'CLOSED',
        openedAt: rejectedOpenedAt,
        closedAt: rejectedClosedAt,
        createdAt: rejectedOpenedAt,
        updatedAt: rejectedClosedAt,
      },
      {
        id: ids.session.excused,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(dayMinus21),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'CLOSED',
        openedAt: excusedOpenedAt,
        closedAt: excusedClosedAt,
        createdAt: excusedOpenedAt,
        updatedAt: excusedClosedAt,
      },
      {
        id: ids.session.pending,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(dayMinus14),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'CLOSED',
        openedAt: pendingOpenedAt,
        closedAt: pendingClosedAt,
        createdAt: pendingOpenedAt,
        updatedAt: pendingClosedAt,
      },
      {
        id: ids.session.present,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(dayMinus7),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'CLOSED',
        openedAt: presentOpenedAt,
        closedAt: presentClosedAt,
        createdAt: presentOpenedAt,
        updatedAt: presentClosedAt,
      },
      {
        id: ids.session.unexcused,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(yesterday),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'CLOSED',
        openedAt: unexcusedOpenedAt,
        closedAt: unexcusedClosedAt,
        createdAt: unexcusedOpenedAt,
        updatedAt: unexcusedClosedAt,
      },
      {
        id: ids.session.open,
        classId: ids.class.cs101,
        scheduleId: ids.schedule.cs101,
        sessionDate: databaseDate(today),
        startTime: databaseTime(primaryStartMinutes),
        endTime: databaseTime(primaryEndMinutes),
        status: 'OPEN',
        openedAt: seedNow,
        deviceId: ids.device,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
      {
        id: ids.session.upcoming,
        classId: ids.class.cs202,
        scheduleId: ids.schedule.cs202,
        sessionDate: databaseDate(upcomingDay),
        startTime: databaseTime(secondaryStartMinutes),
        endTime: databaseTime(secondaryEndMinutes),
        status: 'SCHEDULED',
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.attendanceRecord.createMany({
    data: [
      {
        id: ids.attendance.rejected,
        sessionId: ids.session.rejected,
        studentId: ids.user.student,
        status: 'ABSENT',
        isManual: false,
        createdAt: rejectedOpenedAt,
        updatedAt: rejectedClosedAt,
      },
      {
        id: ids.attendance.excused,
        sessionId: ids.session.excused,
        studentId: ids.user.student,
        status: 'EXCUSED',
        isManual: false,
        createdAt: excusedOpenedAt,
        updatedAt: approvedReviewedAt,
      },
      {
        id: ids.attendance.pending,
        sessionId: ids.session.pending,
        studentId: ids.user.student,
        timeIn: manilaInstant(dayMinus14, primaryStartMinutes + 20),
        status: 'LATE',
        isManual: false,
        createdAt: pendingOpenedAt,
        updatedAt: pendingClosedAt,
      },
      {
        id: ids.attendance.present,
        sessionId: ids.session.present,
        studentId: ids.user.student,
        timeIn: manilaInstant(dayMinus7, primaryStartMinutes + 3),
        status: 'PRESENT',
        isManual: false,
        createdAt: presentOpenedAt,
        updatedAt: presentClosedAt,
      },
      {
        id: ids.attendance.unexcused,
        sessionId: ids.session.unexcused,
        studentId: ids.user.student,
        status: 'ABSENT',
        isManual: false,
        createdAt: unexcusedOpenedAt,
        updatedAt: unexcusedClosedAt,
      },
      {
        id: ids.attendance.open,
        sessionId: ids.session.open,
        studentId: ids.user.student,
        status: 'ABSENT',
        isManual: false,
        createdAt: seedNow,
        updatedAt: seedNow,
      },
    ],
  });

  await tx.excuseLetter.createMany({
    data: [
      {
        id: ids.excuse.rejected,
        studentId: ids.user.student,
        excuseType: 'PERSONAL',
        description: 'A personal reason that did not meet the attendance policy requirements.',
        submittedAt: rejectedSubmittedAt,
        createdAt: rejectedSubmittedAt,
        updatedAt: rejectedReviewedAt,
      },
      {
        id: ids.excuse.approved,
        studentId: ids.user.student,
        excuseType: 'SCHOOL_BUSINESS',
        description: 'Represented the school at an approved academic event.',
        submittedAt: approvedSubmittedAt,
        createdAt: approvedSubmittedAt,
        updatedAt: approvedReviewedAt,
      },
      {
        id: ids.excuse.pending,
        studentId: ids.user.student,
        excuseType: 'MEDICAL',
        description: 'Was unwell and submitted a medical excuse for review.',
        submittedAt: pendingSubmittedAt,
        createdAt: pendingSubmittedAt,
        updatedAt: pendingSubmittedAt,
      },
    ],
  });

  await tx.excuseDate.createMany({
    data: [
      {
        id: ids.excuseDate.rejected,
        excuseId: ids.excuse.rejected,
        attendanceId: ids.attendance.rejected,
        status: 'REJECTED',
        reviewedBy: ids.user.professor,
        reviewedAt: rejectedReviewedAt,
        rejectionReason: 'The submitted reason does not satisfy the attendance excuse policy.',
      },
      {
        id: ids.excuseDate.approved,
        excuseId: ids.excuse.approved,
        attendanceId: ids.attendance.excused,
        status: 'APPROVED',
        reviewedBy: ids.user.professor,
        reviewedAt: approvedReviewedAt,
      },
      {
        id: ids.excuseDate.pending,
        excuseId: ids.excuse.pending,
        attendanceId: ids.attendance.pending,
        status: 'PENDING',
      },
    ],
  });

  await tx.notification.createMany({
    data: [
      {
        id: ids.notification.studentAbsence,
        userId: ids.user.student,
        type: 'ATTENDANCE_ALERT',
        title: 'Absence recorded',
        message: 'You have an unexcused absence in CS101 available for review.',
        isRead: false,
        metadata: { attendanceId: ids.attendance.unexcused, classId: ids.class.cs101 },
        createdAt: unexcusedClosedAt,
      },
      {
        id: ids.notification.studentApproved,
        userId: ids.user.student,
        type: 'EXCUSE_APPROVED',
        title: 'Excuse approved',
        message: 'Your school-business excuse for CS101 was approved.',
        isRead: true,
        readAt: offsetInstant(approvedReviewedAt, 60 * 60_000),
        metadata: { excuseId: ids.excuse.approved },
        createdAt: approvedReviewedAt,
      },
      {
        id: ids.notification.professorPending,
        userId: ids.user.professor,
        type: 'EXCUSE_SUBMITTED',
        title: 'New excuse letter',
        message: 'Sofia Santos submitted a medical excuse for CS101.',
        isRead: false,
        metadata: { excuseId: ids.excuse.pending },
        createdAt: pendingSubmittedAt,
      },
      {
        id: ids.notification.adminRfid,
        userId: ids.user.admin,
        type: 'RFID_REQUEST_SUBMITTED',
        title: 'RFID request submitted',
        message: 'Sofia Santos submitted a new-card request that was later fulfilled.',
        isRead: false,
        metadata: { requestId: ids.rfidRequest },
        createdAt: requestCreatedAt,
      },
    ],
  });

  await tx.auditLog.createMany({
    data: [
      {
        id: ids.audit.deviceRegistered,
        userId: ids.user.admin,
        action: 'DEVICE_REGISTERED',
        entityType: 'Device',
        entityId: ids.device,
        description: 'Registered the development Room 301 terminal.',
        newValue: { label: 'Development Room 301 Terminal' },
        ipAddress: null,
        createdAt: offsetInstant(seedNow, -30 * 60_000),
      },
      {
        id: ids.audit.sessionOpened,
        userId: ids.user.professor,
        action: 'SESSION_OPENED',
        entityType: 'AttendanceSession',
        entityId: ids.session.open,
        description: 'Opened the canonical CS101 development attendance session.',
        newValue: { classId: ids.class.cs101, scheduleId: ids.schedule.cs101, deviceId: ids.device },
        ipAddress: null,
        createdAt: seedNow,
      },
      {
        id: ids.audit.deviceClaimed,
        userId: ids.user.professor,
        action: 'DEVICE_CLAIMED',
        entityType: 'Device',
        entityId: ids.device,
        description: 'Bound the development terminal to the open CS101 session.',
        newValue: { sessionId: ids.session.open, classId: ids.class.cs101 },
        ipAddress: null,
        createdAt: seedNow,
      },
      {
        id: ids.audit.excuseApproved,
        userId: ids.user.professor,
        action: 'EXCUSE_APPROVED',
        entityType: 'ExcuseLetter',
        entityId: ids.excuse.approved,
        description: 'Approved the school-business excuse.',
        oldValue: { status: 'PENDING' },
        newValue: { status: 'APPROVED', affectedRecords: 1 },
        ipAddress: null,
        createdAt: approvedReviewedAt,
      },
      {
        id: ids.audit.excuseRejected,
        userId: ids.user.professor,
        action: 'EXCUSE_REJECTED',
        entityType: 'ExcuseLetter',
        entityId: ids.excuse.rejected,
        description: 'Rejected the personal excuse because it did not satisfy policy.',
        oldValue: { status: 'PENDING' },
        newValue: { status: 'REJECTED', affectedRecords: 1 },
        ipAddress: null,
        createdAt: rejectedReviewedAt,
      },
    ],
  });
}

async function main(): Promise<void> {
  const target = requireDevelopmentTarget();
  const seedNow = new Date();

  console.warn('\n============================================================');
  console.warn('DEVELOPMENT ONLY: DESTRUCTIVE CANONICAL SEED');
  console.warn(`Target database host: ${target.host}`);
  console.warn(`Target database name: ${target.database}`);
  console.warn('All application data in this database will be replaced.');
  console.warn('Prisma migration history and physical upload files are preserved.');
  console.warn('============================================================\n');

  const passwordHash = await argon2.hash(DEVELOPMENT_PASSWORD);
  const deviceTokenHash = crypto.createHash('sha256').update(DEVELOPMENT_DEVICE_TOKEN).digest('hex');

  const pool = new pg.Pool({ connectionString: target.connectionString, ssl: false });
  const adapter = new PrismaPg(pool as never);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(
      async (tx) => {
        await clearCanonicalDomain(tx);
        await seedCanonicalDevelopmentData(tx, seedNow, passwordHash, deviceTokenHash);
      },
      { maxWait: 10_000, timeout: 60_000 },
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log('\nCanonical development fixture created successfully.');
  console.log(`Target: ${target.host}/${target.database}`);
  console.log('\nAdmin');
  console.log('  login: admin.dev');
  console.log(`  password: ${DEVELOPMENT_PASSWORD}`);
  console.log('\nProfessor');
  console.log('  employee number: PROF-DEV-001');
  console.log(`  password: ${DEVELOPMENT_PASSWORD}`);
  console.log('\nStudent');
  console.log('  student number: STU-DEV-001');
  console.log(`  password: ${DEVELOPMENT_PASSWORD}`);
  console.log(`\nRFID UID: ${DEVELOPMENT_RFID_UID}`);
  console.log('Device label: Development Room 301 Terminal');
  console.log(`Device token (DEVELOPMENT ONLY): ${DEVELOPMENT_DEVICE_TOKEN}`);
  console.log('\nSuggested functional test order:');
  console.log('  1. Login as Student and inspect dashboard/classes/attendance.');
  console.log('  2. Exercise the RFID tap while the card/session are still active.');
  console.log('  3. Login as Professor and inspect sessions/report/excuses.');
  console.log('  4. Review or modify attendance/excuse state.');
  console.log('  5. Login as Student and optionally report RFID LOST/DAMAGED.');
  console.log('  6. Login as Admin and inspect the resulting pending RFID request.');
  console.log('  7. Reseed to restore the canonical fixture when desired.');
  console.log('\nWARNING: Reseeding is destructive and replaces all application data.\n');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nSeed failed: ${message}`);
  process.exitCode = 1;
});
