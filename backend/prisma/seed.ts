import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================
  // Clean up existing data (reverse order of dependencies)
  // ============================================================
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.excuseAttachment.deleteMany();
  await prisma.excuseDate.deleteMany();
  await prisma.excuseLetter.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.class.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data\n');

  const defaultPassword = await argon2.hash('password123');

  // ============================================================
  // Admin Users
  // ============================================================
  const admin1 = await prisma.user.create({
    data: {
      username: 'admin',
      password: defaultPassword,
      email: 'admin@attendance.edu',
      name: 'Alice Admin',
      type: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      username: 'admin2',
      password: defaultPassword,
      email: 'admin2@attendance.edu',
      name: 'Bob Admin',
      type: 'ADMIN',
    },
  });

  console.log('👤 Created admins: Alice Admin, Bob Admin');

  // ============================================================
  // Professors (5)
  // ============================================================
  const prof1 = await prisma.user.create({
    data: {
      username: 'prof.smith',
      password: defaultPassword,
      email: 'smith@attendance.edu',
      name: 'Dr. John Smith',
      type: 'PROFESSOR',
      professor: {
        create: {
          employeeNumber: 'EMP-2024-001',
          department: 'Computer Science',
          position: 'Associate Professor',
        },
      },
    },
    include: { professor: true },
  });

  const prof2 = await prisma.user.create({
    data: {
      username: 'prof.jones',
      password: defaultPassword,
      email: 'jones@attendance.edu',
      name: 'Dr. Sarah Jones',
      type: 'PROFESSOR',
      professor: {
        create: {
          employeeNumber: 'EMP-2024-002',
          department: 'Information Technology',
          position: 'Instructor',
        },
      },
    },
    include: { professor: true },
  });

  const prof3 = await prisma.user.create({
    data: {
      username: 'prof.lee',
      password: defaultPassword,
      email: 'lee@attendance.edu',
      name: 'Prof. Michael Lee',
      type: 'PROFESSOR',
      professor: {
        create: {
          employeeNumber: 'EMP-2024-003',
          department: 'Computer Science',
          position: 'Professor',
        },
      },
    },
    include: { professor: true },
  });

  const prof4 = await prisma.user.create({
    data: {
      username: 'prof.chen',
      password: defaultPassword,
      email: 'chen@attendance.edu',
      name: 'Dr. Emily Chen',
      type: 'PROFESSOR',
      professor: {
        create: {
          employeeNumber: 'EMP-2024-004',
          department: 'Information Technology',
          position: 'Associate Professor',
        },
      },
    },
    include: { professor: true },
  });

  const prof5 = await prisma.user.create({
    data: {
      username: 'prof.wilson',
      password: defaultPassword,
      email: 'wilson@attendance.edu',
      name: 'Prof. David Wilson',
      type: 'PROFESSOR',
      professor: {
        create: {
          employeeNumber: 'EMP-2024-005',
          department: 'Computer Science',
          position: 'Instructor',
        },
      },
    },
    include: { professor: true },
  });

  console.log('👨‍🏫 Created 5 professors');

  // ============================================================
  // Students (15)
  // ============================================================
  const studentData = [
    { username: 'student01', email: 'student01@attendance.edu', name: 'Charlie Brown', studentNumber: '2024-00001', yearLevel: 3, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: 'RFID-001', verified: true },
    { username: 'student02', email: 'student02@attendance.edu', name: 'Diana Prince', studentNumber: '2024-00002', yearLevel: 3, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: 'RFID-002', verified: true },
    { username: 'student03', email: 'student03@attendance.edu', name: 'Edward Norton', studentNumber: '2024-00003', yearLevel: 3, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: 'RFID-003', verified: true },
    { username: 'student04', email: 'student04@attendance.edu', name: 'Fiona Apple', studentNumber: '2024-00004', yearLevel: 3, program: 'BSCS', section: 'B', department: 'Computer Science', rfid: 'RFID-004', verified: true },
    { username: 'student05', email: 'student05@attendance.edu', name: 'George Miller', studentNumber: '2024-00005', yearLevel: 3, program: 'BSCS', section: 'B', department: 'Computer Science', rfid: 'RFID-005', verified: true },
    { username: 'student06', email: 'student06@attendance.edu', name: 'Hannah Baker', studentNumber: '2024-00006', yearLevel: 2, program: 'BSIT', section: 'A', department: 'Information Technology', rfid: 'RFID-006', verified: true },
    { username: 'student07', email: 'student07@attendance.edu', name: 'Ian Malcolm', studentNumber: '2024-00007', yearLevel: 2, program: 'BSIT', section: 'A', department: 'Information Technology', rfid: 'RFID-007', verified: true },
    { username: 'student08', email: 'student08@attendance.edu', name: 'Julia Roberts', studentNumber: '2024-00008', yearLevel: 2, program: 'BSIT', section: 'A', department: 'Information Technology', rfid: 'RFID-008', verified: true },
    { username: 'student09', email: 'student09@attendance.edu', name: 'Kevin Hart', studentNumber: '2024-00009', yearLevel: 2, program: 'BSIT', section: 'B', department: 'Information Technology', rfid: 'RFID-009', verified: true },
    { username: 'student10', email: 'student10@attendance.edu', name: 'Laura Palmer', studentNumber: '2024-00010', yearLevel: 2, program: 'BSIT', section: 'B', department: 'Information Technology', rfid: 'RFID-010', verified: true },
    { username: 'student11', email: 'student11@attendance.edu', name: 'Mark Spencer', studentNumber: '2024-00011', yearLevel: 1, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: null, verified: false },
    { username: 'student12', email: 'student12@attendance.edu', name: 'Nancy Drew', studentNumber: '2024-00012', yearLevel: 1, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: null, verified: false },
    { username: 'student13', email: 'student13@attendance.edu', name: 'Oscar Wilde', studentNumber: '2024-00013', yearLevel: 1, program: 'BSIT', section: 'A', department: 'Information Technology', rfid: null, verified: false },
    { username: 'student14', email: 'student14@attendance.edu', name: 'Penny Lane', studentNumber: '2024-00014', yearLevel: 4, program: 'BSCS', section: 'A', department: 'Computer Science', rfid: 'RFID-014', verified: true },
    { username: 'student15', email: 'student15@attendance.edu', name: 'Quinn Hughes', studentNumber: '2024-00015', yearLevel: 4, program: 'BSIT', section: 'A', department: 'Information Technology', rfid: 'RFID-015', verified: true },
  ];

  const students: any[] = [];
  for (const s of studentData) {
    const created = await prisma.user.create({
      data: {
        username: s.username,
        password: defaultPassword,
        email: s.email,
        name: s.name,
        type: 'STUDENT',
        student: {
          create: {
            studentNumber: s.studentNumber,
            yearLevel: s.yearLevel,
            program: s.program,
            section: s.section,
            department: s.department,
            ...(s.rfid && {
              rfidCards: { create: { rfidNumber: s.rfid, status: 'ACTIVE' } }
            })
          },
        },
      },
      include: { student: true },
    });
    students.push(created);
  }

  console.log('🎓 Created 15 students (12 verified, 3 unverified)');

  // ============================================================
  // Courses (8)
  // ============================================================
  const cs101 = await prisma.course.create({
    data: { courseCode: 'CS101', courseName: 'Introduction to Computer Science', courseDescription: 'Fundamental concepts of CS including algorithms and programming.', units: 3 },
  });
  const cs201 = await prisma.course.create({
    data: { courseCode: 'CS201', courseName: 'Data Structures and Algorithms', courseDescription: 'Advanced study of data structures and algorithm analysis.', units: 3 },
  });
  const cs301 = await prisma.course.create({
    data: { courseCode: 'CS301', courseName: 'Operating Systems', courseDescription: 'Principles of operating system design and implementation.', units: 3 },
  });
  const cs401 = await prisma.course.create({
    data: { courseCode: 'CS401', courseName: 'Software Engineering', courseDescription: 'Software development methodologies, testing, and project management.', units: 3 },
  });
  const it101 = await prisma.course.create({
    data: { courseCode: 'IT101', courseName: 'Web Development Fundamentals', courseDescription: 'Introduction to HTML, CSS, and JavaScript.', units: 3 },
  });
  const it201 = await prisma.course.create({
    data: { courseCode: 'IT201', courseName: 'Database Management Systems', courseDescription: 'Relational databases, SQL, and database design.', units: 3 },
  });
  const it301 = await prisma.course.create({
    data: { courseCode: 'IT301', courseName: 'Network Administration', courseDescription: 'Computer networking concepts and network management.', units: 3 },
  });
  const it401 = await prisma.course.create({
    data: { courseCode: 'IT401', courseName: 'Capstone Project', courseDescription: 'Final year project integrating all learned skills.', units: 6 },
  });

  console.log('📚 Created 8 courses');

  // ============================================================
  // Classes (10)
  // ============================================================
  const class1 = await prisma.class.create({
    data: { courseId: cs101.id, professorId: prof1.id, section: 'BSCS-3A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Room 301' },
  });
  const class2 = await prisma.class.create({
    data: { courseId: cs201.id, professorId: prof1.id, section: 'BSCS-3A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Room 302' },
  });
  const class3 = await prisma.class.create({
    data: { courseId: cs101.id, professorId: prof3.id, section: 'BSCS-3B', schoolYear: '2025-2026', semester: 'FIRST', room: 'Room 303' },
  });
  const class4 = await prisma.class.create({
    data: { courseId: cs301.id, professorId: prof3.id, section: 'BSCS-4A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Room 304' },
  });
  const class5 = await prisma.class.create({
    data: { courseId: cs401.id, professorId: prof5.id, section: 'BSCS-4A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Room 305' },
  });
  const class6 = await prisma.class.create({
    data: { courseId: it101.id, professorId: prof2.id, section: 'BSIT-2A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Lab 201' },
  });
  const class7 = await prisma.class.create({
    data: { courseId: it201.id, professorId: prof2.id, section: 'BSIT-2A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Lab 202' },
  });
  const class8 = await prisma.class.create({
    data: { courseId: it101.id, professorId: prof4.id, section: 'BSIT-2B', schoolYear: '2025-2026', semester: 'FIRST', room: 'Lab 203' },
  });
  const class9 = await prisma.class.create({
    data: { courseId: it301.id, professorId: prof4.id, section: 'BSIT-4A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Lab 204' },
  });
  const class10 = await prisma.class.create({
    data: { courseId: it401.id, professorId: prof4.id, section: 'BSIT-4A', schoolYear: '2025-2026', semester: 'FIRST', room: 'Lab 205' },
  });

  console.log('🏫 Created 10 classes');

  // ============================================================
  // Class Schedules
  // ============================================================
  const schedules: any[] = [];

  const sched1 = await prisma.classSchedule.create({ data: { classId: class1.id, dayOfWeek: [1, 3, 5], startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00') } });
  schedules.push(sched1);
  const sched2 = await prisma.classSchedule.create({ data: { classId: class2.id, dayOfWeek: [2, 4], startTime: new Date('1970-01-01T10:00:00'), endTime: new Date('1970-01-01T11:30:00') } });
  schedules.push(sched2);
  await prisma.classSchedule.create({ data: { classId: class3.id, dayOfWeek: [1, 3, 5], startTime: new Date('1970-01-01T10:00:00'), endTime: new Date('1970-01-01T11:30:00') } });
  await prisma.classSchedule.create({ data: { classId: class4.id, dayOfWeek: [2, 4], startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00') } });
  await prisma.classSchedule.create({ data: { classId: class5.id, dayOfWeek: [1, 3], startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00') } });
  const sched6 = await prisma.classSchedule.create({ data: { classId: class6.id, dayOfWeek: [1, 3], startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00') } });
  schedules.push(sched6);
  await prisma.classSchedule.create({ data: { classId: class7.id, dayOfWeek: [2, 4], startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00') } });
  const sched8 = await prisma.classSchedule.create({ data: { classId: class8.id, dayOfWeek: [2, 4], startTime: new Date('1970-01-01T10:00:00'), endTime: new Date('1970-01-01T11:30:00') } });
  schedules.push(sched8);
  await prisma.classSchedule.create({ data: { classId: class9.id, dayOfWeek: [1, 3, 5], startTime: new Date('1970-01-01T15:00:00'), endTime: new Date('1970-01-01T16:30:00') } });
  await prisma.classSchedule.create({ data: { classId: class10.id, dayOfWeek: [5], startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T12:00:00') } });

  console.log('📅 Created class schedules');

  // ============================================================
  // Enrollments
  // ============================================================
  // BSCS-3A students (student01, student02, student03) → class1 (CS101), class2 (CS201)
  // BSCS-3B students (student04, student05) → class3 (CS101)
  // BSCS-4A students (student14) → class4 (CS301), class5 (CS401)
  // BSIT-2A students (student06, student07, student08) → class6 (IT101), class7 (IT201)
  // BSIT-2B students (student09, student10) → class8 (IT101)
  // BSIT-4A students (student15) → class9 (IT301), class10 (IT401)

  const enrollmentData = [
    // BSCS-3A
    { classId: class1.id, studentId: students[0].id },
    { classId: class1.id, studentId: students[1].id },
    { classId: class1.id, studentId: students[2].id },
    { classId: class2.id, studentId: students[0].id },
    { classId: class2.id, studentId: students[1].id },
    { classId: class2.id, studentId: students[2].id },
    // BSCS-3B
    { classId: class3.id, studentId: students[3].id },
    { classId: class3.id, studentId: students[4].id },
    // BSCS-4A
    { classId: class4.id, studentId: students[13].id },
    { classId: class5.id, studentId: students[13].id },
    // BSIT-2A
    { classId: class6.id, studentId: students[5].id },
    { classId: class6.id, studentId: students[6].id },
    { classId: class6.id, studentId: students[7].id },
    { classId: class7.id, studentId: students[5].id },
    { classId: class7.id, studentId: students[6].id },
    { classId: class7.id, studentId: students[7].id },
    // BSIT-2B
    { classId: class8.id, studentId: students[8].id },
    { classId: class8.id, studentId: students[9].id },
    // BSIT-4A
    { classId: class9.id, studentId: students[14].id },
    { classId: class10.id, studentId: students[14].id },
  ];

  await prisma.classEnrollment.createMany({ data: enrollmentData });

  console.log('📝 Created 21 enrollments (incl. 1 cross-professor fixture)');

  // ============================================================
  // Attendance Sessions - CS101 BSCS-3A (class1) - 5 sessions
  // ============================================================
  const cs101Students = [students[0], students[1], students[2]];

  // Session 1 - March 17 (Mon) - CLOSED - All present
  const session1 = await prisma.attendanceSession.create({
    data: {
      classId: class1.id, scheduleId: sched1.id, sessionDate: new Date('2026-03-17'),
      startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-17T08:00:00'), closedAt: new Date('2026-03-17T09:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session1.id, studentId: cs101Students[0].id, timeIn: new Date('2026-03-17T08:02:00'), status: 'PRESENT' },
      { sessionId: session1.id, studentId: cs101Students[1].id, timeIn: new Date('2026-03-17T08:05:00'), status: 'PRESENT' },
      { sessionId: session1.id, studentId: cs101Students[2].id, timeIn: new Date('2026-03-17T08:01:00'), status: 'PRESENT' },
    ],
  });

  // Session 2 - March 19 (Wed) - CLOSED - One late
  const session2 = await prisma.attendanceSession.create({
    data: {
      classId: class1.id, scheduleId: sched1.id, sessionDate: new Date('2026-03-19'),
      startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-19T08:00:00'), closedAt: new Date('2026-03-19T09:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session2.id, studentId: cs101Students[0].id, timeIn: new Date('2026-03-19T08:03:00'), status: 'PRESENT' },
      { sessionId: session2.id, studentId: cs101Students[1].id, timeIn: new Date('2026-03-19T08:25:00'), status: 'LATE' },
      { sessionId: session2.id, studentId: cs101Students[2].id, timeIn: new Date('2026-03-19T08:04:00'), status: 'PRESENT' },
    ],
  });

  // Session 3 - March 21 (Fri) - CLOSED - One absent
  const session3 = await prisma.attendanceSession.create({
    data: {
      classId: class1.id, scheduleId: sched1.id, sessionDate: new Date('2026-03-21'),
      startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-21T08:00:00'), closedAt: new Date('2026-03-21T09:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session3.id, studentId: cs101Students[0].id, timeIn: new Date('2026-03-21T08:01:00'), status: 'PRESENT' },
      { sessionId: session3.id, studentId: cs101Students[1].id, status: 'ABSENT' },
      { sessionId: session3.id, studentId: cs101Students[2].id, timeIn: new Date('2026-03-21T08:10:00'), status: 'PRESENT' },
    ],
  });

  // Session 4 - March 24 (Mon) - CLOSED - Mixed statuses
  const session4 = await prisma.attendanceSession.create({
    data: {
      classId: class1.id, scheduleId: sched1.id, sessionDate: new Date('2026-03-24'),
      startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-24T08:00:00'), closedAt: new Date('2026-03-24T09:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session4.id, studentId: cs101Students[0].id, timeIn: new Date('2026-03-24T08:20:00'), status: 'LATE' },
      { sessionId: session4.id, studentId: cs101Students[1].id, status: 'ABSENT' },
      { sessionId: session4.id, studentId: cs101Students[2].id, timeIn: new Date('2026-03-24T08:00:00'), status: 'PRESENT' },
    ],
  });

  // Session 5 - March 26 (Wed) - CANCELLED
  await prisma.attendanceSession.create({
    data: {
      classId: class1.id, scheduleId: sched1.id, sessionDate: new Date('2026-03-26'),
      startTime: new Date('1970-01-01T08:00:00'), endTime: new Date('1970-01-01T09:30:00'),
      status: 'CANCELLED', cancelledBy: prof1.id, cancelledAt: new Date('2026-03-26T07:30:00'),
    },
  });

  console.log('📋 Created 5 attendance sessions for CS101-3A');

  // ============================================================
  // Attendance Sessions - IT101 BSIT-2A (class6) - 4 sessions
  // ============================================================
  const it101Students = [students[5], students[6], students[7]];

  // Session 1 - March 17 (Mon) - CLOSED
  const itSession1 = await prisma.attendanceSession.create({
    data: {
      classId: class6.id, scheduleId: sched6.id, sessionDate: new Date('2026-03-17'),
      startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-17T13:00:00'), closedAt: new Date('2026-03-17T14:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: itSession1.id, studentId: it101Students[0].id, timeIn: new Date('2026-03-17T13:05:00'), status: 'PRESENT' },
      { sessionId: itSession1.id, studentId: it101Students[1].id, timeIn: new Date('2026-03-17T13:02:00'), status: 'PRESENT' },
      { sessionId: itSession1.id, studentId: it101Students[2].id, status: 'ABSENT' },
    ],
  });

  // Session 2 - March 19 (Wed) - CLOSED
  const itSession2 = await prisma.attendanceSession.create({
    data: {
      classId: class6.id, scheduleId: sched6.id, sessionDate: new Date('2026-03-19'),
      startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-19T13:00:00'), closedAt: new Date('2026-03-19T14:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: itSession2.id, studentId: it101Students[0].id, timeIn: new Date('2026-03-19T13:01:00'), status: 'PRESENT' },
      { sessionId: itSession2.id, studentId: it101Students[1].id, timeIn: new Date('2026-03-19T13:20:00'), status: 'LATE' },
      { sessionId: itSession2.id, studentId: it101Students[2].id, timeIn: new Date('2026-03-19T13:03:00'), status: 'PRESENT' },
    ],
  });

  // Session 3 - March 24 (Mon) - CLOSED - student08 absent again
  const itSession3 = await prisma.attendanceSession.create({
    data: {
      classId: class6.id, scheduleId: sched6.id, sessionDate: new Date('2026-03-24'),
      startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-24T13:00:00'), closedAt: new Date('2026-03-24T14:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: itSession3.id, studentId: it101Students[0].id, timeIn: new Date('2026-03-24T13:02:00'), status: 'PRESENT' },
      { sessionId: itSession3.id, studentId: it101Students[1].id, timeIn: new Date('2026-03-24T13:01:00'), status: 'PRESENT' },
      { sessionId: itSession3.id, studentId: it101Students[2].id, status: 'ABSENT' },
    ],
  });

  // Session 4 - March 26 (Wed) - OPEN (current session)
  const itSession4 = await prisma.attendanceSession.create({
    data: {
      classId: class6.id, scheduleId: sched6.id, sessionDate: new Date('2026-03-26'),
      startTime: new Date('1970-01-01T13:00:00'), endTime: new Date('1970-01-01T14:30:00'),
      status: 'OPEN', openedAt: new Date('2026-03-26T13:00:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: itSession4.id, studentId: it101Students[0].id, timeIn: new Date('2026-03-26T13:04:00'), status: 'PRESENT' },
      { sessionId: itSession4.id, studentId: it101Students[1].id, status: 'ABSENT' },
      { sessionId: itSession4.id, studentId: it101Students[2].id, status: 'ABSENT' },
    ],
  });

  console.log('📋 Created 4 attendance sessions for IT101-2A (1 still OPEN)');

  // ============================================================
  // Attendance Sessions - IT101 BSIT-2B (class8) - 2 sessions
  // ============================================================
  const it101bStudents = [students[8], students[9]];

  const itbSession1 = await prisma.attendanceSession.create({
    data: {
      classId: class8.id, scheduleId: sched8.id, sessionDate: new Date('2026-03-18'),
      startTime: new Date('1970-01-01T10:00:00'), endTime: new Date('1970-01-01T11:30:00'),
      status: 'CLOSED', openedAt: new Date('2026-03-18T10:00:00'), closedAt: new Date('2026-03-18T11:30:00'),
    },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: itbSession1.id, studentId: it101bStudents[0].id, timeIn: new Date('2026-03-18T10:05:00'), status: 'PRESENT' },
      { sessionId: itbSession1.id, studentId: it101bStudents[1].id, timeIn: new Date('2026-03-18T10:03:00'), status: 'PRESENT' },
    ],
  });

  // Session 2 - SCHEDULED (upcoming)
  await prisma.attendanceSession.create({
    data: {
      classId: class8.id, scheduleId: sched8.id, sessionDate: new Date('2026-04-01'),
      startTime: new Date('1970-01-01T10:00:00'), endTime: new Date('1970-01-01T11:30:00'),
      status: 'SCHEDULED',
    },
  });

  console.log('📋 Created 2 attendance sessions for IT101-2B (1 SCHEDULED)');

  // ============================================================
  // Cross-professor fixture (per-class excuse approval testing)
  // Charlie Brown (student01) is enrolled in CS101 (prof1) and also
  // IT101 (prof2), with a LATE in CS101 and an ABSENT in IT101, so a
  // single PENDING excuse letter spans two different professors.
  // ============================================================
  await prisma.classEnrollment.create({
    data: { classId: class6.id, studentId: students[0].id },
  });

  const charlieItAbsence = await prisma.attendanceRecord.create({
    data: { sessionId: itSession1.id, studentId: students[0].id, status: 'ABSENT' },
  });

  const charlieCsLate = await prisma.attendanceRecord.findFirst({
    where: { studentId: students[0].id, sessionId: session4.id, status: 'LATE' },
  });

  if (charlieCsLate) {
    await prisma.excuseLetter.create({
      data: {
        studentId: students[0].id,
        excuseType: 'MEDICAL',
        description: 'Hospitalized for the day; this covers both my CS101 and IT101 classes.',
        excuseDates: {
          create: [
            { attendanceId: charlieCsLate.id },
            { attendanceId: charlieItAbsence.id },
          ],
        },
      },
    });
  }

  // ============================================================
  // Excuse Letters
  // ============================================================
  let juliaApprovedExcuseId = '';
  let juliaRejectedExcuseId = '';

  // Diana Prince (student02) - absent March 21 - PENDING medical excuse
  const dianaAbsence = await prisma.attendanceRecord.findFirst({
    where: { studentId: students[1].id, sessionId: session3.id, status: 'ABSENT' },
  });

  if (dianaAbsence) {
    await prisma.excuseLetter.create({
      data: {
        studentId: students[1].id,
        excuseType: 'MEDICAL',
        description: 'I had a high fever and was advised by my doctor to rest for the day.',
        excuseDates: { create: { attendanceId: dianaAbsence.id } },
        attachments: {
          create: {
            fileName: 'medical_certificate.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            filePath: '/uploads/excuses/medical_certificate.pdf',
          },
        },
      },
    });
  }

  // Diana Prince - absent March 24 - PENDING personal excuse
  const dianaAbsence2 = await prisma.attendanceRecord.findFirst({
    where: { studentId: students[1].id, sessionId: session4.id, status: 'ABSENT' },
  });

  if (dianaAbsence2) {
    await prisma.excuseLetter.create({
      data: {
        studentId: students[1].id,
        excuseType: 'PERSONAL',
        description: 'I had a family emergency that required my immediate attention.',
        excuseDates: { create: { attendanceId: dianaAbsence2.id } },
      },
    });
  }

  // Julia Roberts (student08) - absent March 17 IT101 - APPROVED excuse
  const juliaAbsence = await prisma.attendanceRecord.findFirst({
    where: { studentId: students[7].id, sessionId: itSession1.id, status: 'ABSENT' },
  });

  if (juliaAbsence) {
    const approvedExcuse = await prisma.excuseLetter.create({
      data: {
        studentId: students[7].id,
        excuseType: 'SCHOOL_BUSINESS',
        description: 'I represented the university at a regional programming competition.',
        excuseDates: {
          create: {
            attendanceId: juliaAbsence.id,
            status: 'APPROVED',
            reviewedBy: prof2.id,
            reviewedAt: new Date('2026-03-18T10:00:00'),
          },
        },
        attachments: {
          create: {
            fileName: 'competition_letter.pdf',
            fileType: 'application/pdf',
            fileSize: 180000,
            filePath: '/uploads/excuses/competition_letter.pdf',
          },
        },
      },
    });

    juliaApprovedExcuseId = approvedExcuse.id;

    // Approved -> the attendance record is excused
    await prisma.attendanceRecord.update({
      where: { id: juliaAbsence.id },
      data: { status: 'EXCUSED' },
    });
  }

  // Julia Roberts - absent March 24 IT101 - REJECTED excuse
  const juliaAbsence2 = await prisma.attendanceRecord.findFirst({
    where: { studentId: students[7].id, sessionId: itSession3.id, status: 'ABSENT' },
  });

  if (juliaAbsence2) {
    const rejectedExcuse = await prisma.excuseLetter.create({
      data: {
        studentId: students[7].id,
        excuseType: 'PERSONAL',
        description: 'I overslept and missed the class.',
        excuseDates: {
          create: {
            attendanceId: juliaAbsence2.id,
            status: 'REJECTED',
            reviewedBy: prof2.id,
            reviewedAt: new Date('2026-03-25T09:00:00'),
            rejectionReason: 'Oversleeping is not a valid excuse for missing class.',
          },
        },
      },
    });

    juliaRejectedExcuseId = rejectedExcuse.id;
  }

  console.log('📨 Created 5 excuse letters (3 PENDING incl. 1 cross-professor, 1 APPROVED, 1 REJECTED)');

  // ============================================================
  // Notifications
  // ============================================================
  await prisma.notification.createMany({
    data: [
      // Student notifications
      { userId: students[1].id, type: 'ATTENDANCE_ALERT', title: 'Absence Recorded', message: 'You were marked absent in CS101 on March 21, 2026.' },
      { userId: students[1].id, type: 'ATTENDANCE_ALERT', title: 'Absence Recorded', message: 'You were marked absent in CS101 on March 24, 2026.' },
      { userId: students[7].id, type: 'EXCUSE_APPROVED', title: 'Excuse Approved', message: 'Your excuse letter for IT101 on March 17 has been approved.', isRead: true, readAt: new Date('2026-03-18T12:00:00') },
      { userId: students[7].id, type: 'EXCUSE_REJECTED', title: 'Excuse Rejected', message: 'Your excuse letter for IT101 on March 24 has been rejected. Reason: Oversleeping is not a valid excuse.' },
      { userId: students[7].id, type: 'ATTENDANCE_ALERT', title: 'Absence Recorded', message: 'You were marked absent in IT101 on March 17, 2026.', isRead: true, readAt: new Date('2026-03-17T15:00:00') },
      { userId: students[7].id, type: 'ATTENDANCE_ALERT', title: 'Absence Recorded', message: 'You were marked absent in IT101 on March 24, 2026.' },

      // Professor notifications
      { userId: prof1.id, type: 'EXCUSE_SUBMITTED', title: 'New Excuse Letter', message: 'Diana Prince submitted a medical excuse for CS101 on March 21.' },
      { userId: prof1.id, type: 'EXCUSE_SUBMITTED', title: 'New Excuse Letter', message: 'Diana Prince submitted a personal excuse for CS101 on March 24.' },
      { userId: prof2.id, type: 'EXCUSE_SUBMITTED', title: 'New Excuse Letter', message: 'Julia Roberts submitted a school business excuse for IT101 on March 17.', isRead: true, readAt: new Date('2026-03-18T09:00:00') },

      // Admin notifications
      { userId: admin1.id, type: 'ATTENDANCE_ALERT', title: 'Multiple Absences Alert', message: 'Diana Prince (2024-00002) has accumulated 2 absences in CS101.' },
      { userId: admin1.id, type: 'ATTENDANCE_ALERT', title: 'Multiple Absences Alert', message: 'Julia Roberts (2024-00008) has accumulated 2 absences in IT101.' },
    ],
  });

  console.log('🔔 Created 11 notifications');

  // ============================================================
  // Audit Logs
  // ============================================================
  await prisma.auditLog.createMany({
    data: [
      { userId: prof2.id, action: 'EXCUSE_APPROVED', entityType: 'ExcuseLetter', entityId: juliaApprovedExcuseId, description: 'Approved school business excuse for Julia Roberts', ipAddress: '192.168.1.10' },
      { userId: prof2.id, action: 'EXCUSE_REJECTED', entityType: 'ExcuseLetter', entityId: juliaRejectedExcuseId, description: 'Rejected personal excuse for Julia Roberts - invalid reason', ipAddress: '192.168.1.10' },
      { userId: admin1.id, action: 'USER_STATUS_CHANGED', entityType: 'User', entityId: students[0].id, description: 'Seed data initialization', ipAddress: '127.0.0.1' },
    ],
  });

  console.log('📝 Created 3 audit logs');

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n✅ Seed completed successfully!\n');
  console.log('📋 Test Credentials (all passwords: password123):');
  console.log('─'.repeat(60));
  console.log('   ADMINS:');
  console.log('     username: admin          (Alice Admin)');
  console.log('     username: admin2         (Bob Admin)');
  console.log('');
  console.log('   PROFESSORS:');
  console.log('     employee#: EMP-2024-001  (Dr. John Smith - CS)');
  console.log('     employee#: EMP-2024-002  (Dr. Sarah Jones - IT)');
  console.log('     employee#: EMP-2024-003  (Prof. Michael Lee - CS)');
  console.log('     employee#: EMP-2024-004  (Dr. Emily Chen - IT)');
  console.log('     employee#: EMP-2024-005  (Prof. David Wilson - CS)');
  console.log('');
  console.log('   STUDENTS (VERIFIED):');
  console.log('     student#: 2024-00001     (Charlie Brown - BSCS 3A)');
  console.log('     student#: 2024-00002     (Diana Prince - BSCS 3A)');
  console.log('     student#: 2024-00003     (Edward Norton - BSCS 3A)');
  console.log('     student#: 2024-00004     (Fiona Apple - BSCS 3B)');
  console.log('     student#: 2024-00005     (George Miller - BSCS 3B)');
  console.log('     student#: 2024-00006     (Hannah Baker - BSIT 2A)');
  console.log('     student#: 2024-00007     (Ian Malcolm - BSIT 2A)');
  console.log('     student#: 2024-00008     (Julia Roberts - BSIT 2A)');
  console.log('     student#: 2024-00009     (Kevin Hart - BSIT 2B)');
  console.log('     student#: 2024-00010     (Laura Palmer - BSIT 2B)');
  console.log('     student#: 2024-00014     (Penny Lane - BSCS 4A)');
  console.log('     student#: 2024-00015     (Quinn Hughes - BSIT 4A)');
  console.log('');
  console.log('   STUDENTS (UNVERIFIED - no RFID):');
  console.log('     student#: 2024-00011     (Mark Spencer - BSCS 1A)');
  console.log('     student#: 2024-00012     (Nancy Drew - BSCS 1A)');
  console.log('     student#: 2024-00013     (Oscar Wilde - BSIT 1A)');
  console.log('─'.repeat(60));
  console.log('');
  console.log('📊 Data Summary:');
  console.log('   2 admins, 5 professors, 15 students');
  console.log('   8 courses, 10 classes, 21 enrollments');
  console.log('   11 attendance sessions (8 closed, 1 open, 1 cancelled, 1 scheduled)');
  console.log('   5 excuse letters (3 pending incl. 1 cross-professor, 1 approved, 1 rejected)');
  console.log('   11 notifications, 3 audit logs');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });