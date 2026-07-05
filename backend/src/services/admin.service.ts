import prisma from '../config/prisma';
import argon2 from 'argon2';
import { AppError } from '../utils/app_error';
import { CreateClassDto, CreateCourseDto, CreateUserDto, GetAttendanceRecordsDto, GetClassesFilter, SetClassScheduleDto, StudentSearchFilter, UpdateClassDto, UpdateCourseDto, UpdateProfessorProfileDto, UpdateStudentProfileDto, UpdateUserProfileDto } from '../interfaces/admin.interface';
import { AuditAction, ExcuseStatus, Prisma, RfidRequestStatus, UserType } from '@prisma/client';
import AuditService from './audit.service';
import NotificationService from './notification.service';
import { generateDeviceToken, hashToken } from '../utils/token_utils';
import { create } from 'node:domain';
import { buildPaginationMeta, getPaginationArgs, PaginatedResult, PaginationParams } from '../utils/pagination';

class AdminService {

  // User Management
  static async createUser(actorId: string, data: CreateUserDto) {
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
      }
      throw new AppError('Email already exists', 400, 'EMAIL_EXISTS');
    }

    const hashedPassword = await argon2.hash(data.username);

    if (data.type === 'STUDENT') {
      
      if (!data.studentData) {
        throw new AppError('Student data is required', 400, 'STUDENT_DATA_REQUIRED');
      }

      const existingStudent = await prisma.student.findUnique({
        where: { studentNumber: data.studentData.studentNumber },
      });

      if (existingStudent) {
        throw new AppError('Student number already exists', 400, 'STUDENT_NUMBER_EXISTS');
      }

      const studentData = data.studentData;

      const user = await prisma.$transaction(async (tx) => {

        const created = await tx.user.create({
          data: {
            username: data.username,
            password: hashedPassword,
            email: data.email,
            name: data.name,
            type: 'STUDENT',
            mustChangePassword: true,
            student: {
              create: {
                studentNumber: studentData.studentNumber,
                yearLevel: studentData.yearLevel,
                program: studentData.program,
                section: studentData.section,
                department: studentData.department,
              },
            },
          },
          omit: { password: true }
        });

        await AuditService.log({
          actorId,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: created.id,
          description: `Created STUDENT account ${created.username}`,
          newValue: { type: created.type, username: created.username }
        }, tx);
  
        return create;
        });

        return user;
    }

    if (data.type === 'PROFESSOR') {
      if (!data.professorData) {
        throw new AppError('Professor data is required', 400, 'PROFESSOR_DATA_REQUIRED');
      }

      const existingProfessor = await prisma.professor.findUnique({
        where: { employeeNumber: data.professorData.employeeNumber },
      });

      if (existingProfessor) {
        throw new AppError('Employee number already exists', 400, 'EMPLOYEE_NUMBER_EXISTS');
      }

      const professorData = data.professorData;

      const user = await prisma.$transaction(async (tx) => {

        const created = await prisma.user.create({
          data: {
            username: data.username,
            password: hashedPassword,
            email: data.email,
            name: data.name,
            type: 'PROFESSOR',
            mustChangePassword: true,
            professor: {
              create: {
                employeeNumber: professorData.employeeNumber,
                department: professorData.department,
                position: professorData.position,
              },
            },
          },
          omit: { password: true }
        });

        await AuditService.log({
          actorId,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: created.id,
          description: `Created PROFESSOR account ${created.username}`,
          newValue: { type: created.type, username: created.username }
        }, tx);
  
        return created;
      });

      return user;
    }

    if (data.type === 'ADMIN') {
      const user = await prisma.$transaction(async (tx) => {

        const created = await tx.user.create({
          data: {
            username: data.username,
            password: hashedPassword,
            email: data.email,
            name: data.name,
            type: 'ADMIN',
            mustChangePassword: true,
          },
          omit: { password: true }
        });

        await AuditService.log({
          actorId,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: created.id,
          description: `Created ADMIN account ${created.username}`,
          newValue: { type: created.type, username: created.username }
        }, tx);

        return created;
      });

      return user;
    }

    throw new AppError('Invalid user type', 400, 'INVALID_USER_TYPE');
  }

  static async getUsers(filters?: { type?: UserType, search?: string } & Partial<PaginationParams>) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.type && { type: filters.type }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters?.search, mode: 'insensitive' as const } },
          { username: { contains: filters.search, mode: 'insensitive' as const } }
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          type: true,
          status: true,
          profileImage: true,
          createdAt: true
        },
        orderBy: { name: 'asc' },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.user.count({ where }),
    ]);

    return { items, pagination: buildPaginationMeta({ page, limit },total) };
}

  static async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        type: true,
        status: true,
        profileImage: true,
        student: {
          omit: {
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true
          }
        },
        professor: {
          omit: {
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true
          }
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  static async updateUser(actorId: string, userId: string, data: UpdateUserProfileDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (data.email && data.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new AppError('Email already exists', 400, 'EMAIL_EXISTS');
      }
    }

    if (data.username && data.username !== user.username) {
      const usernameExists = await prisma.user.findUnique({
          where: { username: data.username },
      });
      if (usernameExists) {
          throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      name: data.name,
      email: data.email,
      username: data.username,
    };

    if (data.password) {
        updateData.password = await argon2.hash(data.password);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          type: true,
          status: true,
          profileImage: true,
        },
      });

      // A password change must invalidate all existing sessions.
      if (data.password) {
        await tx.session.deleteMany({ where: { userId } });
      }

      await AuditService.log({
        actorId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: userId,
        description: `Updated ${updated.type} account ${updated.username}`,
        newValue: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.username !== undefined && { username: data.username }),
          ...(data.password ? { passwordChanged: true } : {})
        }
      }, tx);

      return updated;
    });

    return updatedUser;
  }

  static async updateStudent(actorId: string, userId: string, data: UpdateStudentProfileDto) {
    const student = await prisma.student.findUnique({
        where: { userId }
    });

    if (!student) {
        throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
    }

    if (data.studentNumber && data.studentNumber !== student.studentNumber) {
        const existingNumber = await prisma.student.findUnique({
            where: { studentNumber: data.studentNumber }
        });
        if (existingNumber) {
            throw new AppError('Student number already exists', 400, 'STUDENT_NUMBER_EXISTS');
        }
    }

    const updated = await prisma.$transaction(async (tx) => {
        const record = await tx.student.update({
            where: { userId },
            data: {
                studentNumber: data.studentNumber,
                yearLevel: data.yearLevel,
                program: data.program,
                section: data.section,
                department: data.department,
            }
        });

        await AuditService.log({
            actorId,
            action: 'USER_UPDATED',
            entityType: 'Student',
            entityId: userId,
            description: 'Updated student profile',
            newValue: {
                ...(data.studentNumber !== undefined && { studentNumber: data.studentNumber }),
                ...(data.yearLevel !== undefined && { yearLevel: data.yearLevel }),
                ...(data.program !== undefined && { program: data.program }),
                ...(data.section !== undefined && { section: data.section }),
                ...(data.department !== undefined && { department: data.department })
            }
        }, tx);

        return record;
    });

    return updated;
  }

  static async updateProfessor(actorId: string, userId: string, data: UpdateProfessorProfileDto) {
    const professor = await prisma.professor.findUnique({
        where: { userId }
    });

    if (!professor) {
        throw new AppError('Professor not found', 404, 'PROFESSOR_NOT_FOUND');
    }

    if (data.employeeNumber && data.employeeNumber !== professor.employeeNumber) {
        const existingNumber = await prisma.professor.findUnique({
            where: { employeeNumber: data.employeeNumber }
        });
        if (existingNumber) {
            throw new AppError('Employee number already exists', 400, 'EMPLOYEE_NUMBER_EXISTS');
        }
    }

    const updated = await prisma.$transaction(async (tx) => {
        const record = await tx.professor.update({
            where: { userId },
            data: {
                employeeNumber: data.employeeNumber,
                department: data.department,
                position: data.position,
            }
        });

        await AuditService.log({
            actorId,
            action: 'USER_UPDATED',
            entityType: 'Professor',
            entityId: userId,
            description: 'Updated professor profile',
            newValue: {
                ...(data.employeeNumber !== undefined && { employeeNumber: data.employeeNumber }),
                ...(data.department !== undefined && { department: data.department }),
                ...(data.position !== undefined && { position: data.position })
            }
        }, tx);

        return record;
    });

    return updated;
}

  static async deactivateUser(actorId: string ,userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('User is already deactivated', 400, 'ALREADY_DEACTIVATED');
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      
      const u = await tx.user.update({
        where: { id: userId },
        data: { status: 'INACTIVE' },
        select: { id: true, username: true, name: true, type: true, status: true }
      });

      await tx.session.deleteMany({ where: { userId } });

      await AuditService.log({
        actorId,
        action: 'USER_STATUS_CHANGED',
        entityType: 'User',
        entityId: userId,
        oldValue: { status: user.status },
        newValue: { status: 'INACTIVE' }
      }, tx);

      return u;
    });

    return updatedUser;
  }

  // Student Management
  static async getStudents(filters?: StudentSearchFilter) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.program && { program: filters.program }),
      ...(filters?.yearLevel && { yearLevel: filters.yearLevel }),
      ...(filters?.section && { section: filters.section }),
      ...(filters?.verificationStatus && { rfidCards: filters.verificationStatus === 'RFID_VERIFIED'
        ? { some: { status: 'ACTIVE' as const } }
        : { none: { status: 'ACTIVE' as const } },
      }),
      ...(filters?.search && {
        OR: [
          { studentNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, status: true, profileImage: true },
          },
        },
        orderBy: { user: { name: 'asc' } },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.student.count({ where })
    ]);

    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async revokeRfid(adminUserId: string ,userId: string, reason?: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
    }

    const activeCard = await prisma.rfidCard.findFirst({
      where: { studentId: student.id, status: 'ACTIVE' }
    });

    if (!activeCard) {
      throw new AppError('Student has no active RFID card to revoke', 400, 'NO_ACTIVE_RFID');
    }

    const revokedReason = reason ?? 'Reported lost';

    const updatedCard = await prisma.$transaction(async (tx) => {

      const card = await tx.rfidCard.update({
        where: { id: activeCard.id },
        data: { status: 'REVOKED', revokedAt: new Date(), revokedReason }
      });

      await AuditService.log({
        actorId: adminUserId,
        action: 'RFID_REVOKED',
        entityType: 'RfidCard',
        entityId: activeCard.id,
        description: revokedReason,
        oldValue: { status: 'ACTIVE' },
        newValue: { status: 'REVOKED' }
      }, tx);

      return card;
    });

    await NotificationService.safeCreate({
      userId,
      type: 'RFID_CARD_REVOKED',
      title: 'RFID card revoked',
      message: `Your RFID card has been revoked: ${revokedReason}`,
      metadata: { cardId: activeCard.id }
    });

    return updatedCard;
  }

  // Professor Management
  static async getProfessors(filters?: { search?: string; department?: string } & Partial<PaginationParams>) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.department && { department: filters.department }),
      ...(filters?.search && {
        OR: [
          { employeeNumber: { contains: filters.search, mode: 'insensitive' as const} },
          { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [items, total] = await prisma.$transaction([

      prisma.professor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              profileImage: true
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
        omit: {
          userId: true,
          createdAt: true,
          updatedAt : true
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.professor.count({ where }),
    ]);
    
    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  // Course Management
  static async createCourse(data: CreateCourseDto) {
    const existing = await prisma.course.findUnique({
      where: { courseCode: data.courseCode },
    });

    if (existing) {
      throw new AppError('Course code already exists', 400, 'COURSE_CODE_EXISTS');
    }

    const course = await prisma.course.create({
      data,
      omit: {
        createdAt: true,
        updatedAt: true
      }
    });

    return course;
  }

  static async getCourses() {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { classes: true } },
      },
      orderBy: { courseCode: 'asc' },
      omit: {
        createdAt: true,
        updatedAt: true
      }
    });

    return courses;
  }

  static async getCourseDetail(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        classes: {
          include: {
            professor: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                classEnrollments: {
                  where: { 
                    status: 'ENROLLED'
                  }
                }
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    return course;
  }

  static async updateCourse(courseId: string, data: UpdateCourseDto) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data,
      omit: {
        createdAt: true,
        updatedAt: true
      }
    });

    return updated;
  }

  // Class Management
  static async createClass(data: CreateClassDto) {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const professor = await prisma.user.findFirst({
      where: { id: data.professorId, type: 'PROFESSOR' },
    });

    if (!professor) {
      throw new AppError('Professor not found', 404, 'PROFESSOR_NOT_FOUND');
    }

    const newClass = await prisma.class.create({
      data: {
        courseId: data.courseId,
        professorId: data.professorId,
        section: data.section,
        schoolYear: data.schoolYear,
        semester: data.semester,
        room: data.room,
      },
      include: {
        course: {
          omit: {
            createdAt: true,
            updatedAt: true
          }
        },
        professor: { select: { name: true, id: true } },
      },
      omit: {
        courseId: true,
        professorId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await NotificationService.safeCreate({
      userId: data.professorId,
      type: 'CLASS_ASSIGNED',
      title: 'New class assigned',
      message: `You were assigned to ${newClass.course.courseCode} (${newClass.section}).`,
      metadata: { classId: newClass.id }
    });

    return newClass;
  }

  static async getClasses(filters?: GetClassesFilter) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.courseId && { courseId: filters.courseId }),
      ...(filters?.professorId && { professorId: filters.professorId }),
      ...(filters?.schoolYear && { schoolYear: filters.schoolYear }),
      ...(filters?.semester && { semester: filters.semester }),
      ...(filters?.status && { status: filters.status }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.class.findMany({
        where,
        include: {
          course: { select: { courseCode: true, courseName: true, id: true } },
          professor: { select: { name: true, id: true } },
          _count: {
            select: { classEnrollments: { where: { status: 'ENROLLED' } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        omit: {
          courseId: true,
          professorId: true,
          createdAt: true,
          updatedAt: true
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.class.count({ where })
    ]);



    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async getClassDetail(classId: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: {
          omit: {
            createdAt: true,
            updatedAt: true
          }
        },
        professor: { select: { name: true, profileImage: true, id: true } },
        classSchedules: {
          omit: {
            createdAt: true,
            updatedAt: true
          }
        },
        classEnrollments: {
          where: { status: 'ENROLLED' },
          include: {
            student: {
              select: { name: true, profileImage: true },
            },
          },
          omit: {
            classId: true,
            createdAt: true,
            updatedAt: true
          }
        },
      },
      omit: {
        courseId: true,
        professorId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    return classRecord;
  }

  static async updateClass(classId: string, data: UpdateClassDto) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    if (data.professorId) {
      const professor = await prisma.user.findFirst({
        where: { id: data.professorId, type: 'PROFESSOR' },
      });

      if (!professor) {
        throw new AppError('Professor not found', 404, 'PROFESSOR_NOT_FOUND');
      }
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        professorId: data.professorId,
        section: data.section,
        room: data.room,
        status: data.status,
      },
      include: {
        course: {
          omit: {
            createdAt: true,
            updatedAt: true
          }
        },
        professor: { select: { name: true, id: true } },
      },
      omit: {
        courseId: true,
        professorId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (data.professorId && data.professorId !== classRecord.professorId) {
      await NotificationService.safeCreate({
        userId: data.professorId,
        type: 'CLASS_ASSIGNED',
        title: 'New class assigned',
        message: `You were assigned to ${updated.course.courseCode} (${updated.section}).`,
        metadata: { classId }
      });
    }

    return updated;
  }

  static async setClassSchedule(classId: string, schedules: SetClassScheduleDto[]) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: { course: { select: { courseCode: true } } }
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    const sessionCount = await prisma.attendanceSession.count({
      where: { classId }
    });

    if (sessionCount > 0) {
      throw new AppError('Cannot change the schedule after attendance session exists for this class', 409, 'SCHEDULE_HAS_SESSIONS');
    }

    const newSchedules = await prisma.$transaction(async (tx) => {
      await tx.classSchedule.deleteMany({
        where: { classId }
      });

      await tx.classSchedule.createMany({
        data: schedules.map((s) => ({
          classId,
          dayOfWeek: s.dayOfWeek,
          startTime: new Date(`1970-01-01T${s.startTime}`),
          endTime: new Date(`1970-01-01T${s.endTime}`)
        }))
      });

      return tx.classSchedule.findMany({
        where: { classId },
        omit: {
          createdAt: true,
          updatedAt: true
        }
      });
    });

    await NotificationService.safeCreate({
      userId: classRecord.professorId,
      type: 'SCHEDULE_CHANGED',
      title: 'Schedule updated',
      message: `The schedule for ${classRecord.course.courseCode} was updated.`
    });

    return newSchedules;
  }

  // Enrollment Management
  static async enrollStudent(actorId: string, classId: string, studentId: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: { course: { select: { courseCode: true } } }
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    const student = await prisma.user.findFirst({
      where: { id: studentId, type: 'STUDENT' },
    });

    if (!student) {
      throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
    }

    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ENROLLED') {
        throw new AppError('Student is already enrolled in this class', 400, 'ALREADY_ENROLLED');
      }

      const reEnrolled = await prisma.$transaction(async (tx) => {

        const updated = await tx.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ENROLLED',
            droppedDate: null,
            enrollmentDate: new Date()
          },
          include: {
            student: { select: { name: true, id: true } },
            class: { include: { course: { select: { courseCode: true, courseName: true } } } }
          },
          omit: {
            classId: true,
            studentId: true,
            createdAt: true,
            updatedAt: true
          }
        });

        await AuditService.log({
          actorId,
          action: 'ENROLLMENT_ADDED',
          entityType: 'ClassEnrollment',
          entityId: existingEnrollment.id,
          description: `Re-enrolled in ${classRecord.course.courseCode}`,
          oldValue: { status: existingEnrollment.status },
          newValue: { status: 'ENROLLED' }
        }, tx);

        return updated;
      });

      await NotificationService.safeCreate({
        userId: studentId,
        type: 'ENROLLMENT_ADDED',
        title: 'Enrolled in class',
        message: `You were enrolled in ${classRecord.course.courseCode}.`,
        metadata: { classId }
      });

      return reEnrolled;
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      
      const created = await tx.classEnrollment.create({
        data: { classId, studentId },
        include: {
          student: { select: { name: true, id: true } },
          class: { include: { course: { select: { courseCode: true, courseName: true } } } },
        },
        omit: {
          classId: true,
          studentId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      await AuditService.log({
        actorId,
        action: 'ENROLLMENT_ADDED',
        entityType: 'ClassEnrollment',
        entityId: created.id,
        description: `Enrolled in ${classRecord.course.courseCode}`,
        newValue: { classId, studentId, status: 'ENROLLED' }
      }, tx);

      return created;
    });

    await NotificationService.safeCreate({
      userId: studentId,
      type: 'ENROLLMENT_ADDED',
      title: 'Enrolled in class',
      message: `You were enrolled in ${classRecord.course.courseCode}.`,
      metadata: { classId }
    });

    return enrollment;
  }

  static async dropStudent(actorId: string ,classId: string, studentId: string) {
    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId } },
      include: { class: { include: { course: { select: { courseCode: true } } } } }
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
    }

    if (enrollment.status === 'DROPPED') {
      throw new AppError('Student is already dropped from this class', 400, 'ALREADY_DROPPED');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dropped = await tx.classEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'DROPPED', droppedDate: new Date() },
        omit: { createdAt: true, updatedAt: true }
      });

      // Remove the student's placeholder ABSENT records for any session still
      // OPEN — they shouldn't be marked absent for a class they've just left.
      // Real taps (PRESENT/LATE) and past closed sessions are left untouched.
      const openAbsent = await tx.attendanceRecord.findMany({
        where: { studentId, status: 'ABSENT', session: { classId, status: 'OPEN' } },
        select: { id: true }
      });

      if (openAbsent.length > 0) {
        const recordIds = openAbsent.map((r) => r.id);
        await tx.excuseDate.deleteMany({ where: { attendanceId: { in: recordIds } } });
        await tx.attendanceRecord.deleteMany({ where: { id: { in: recordIds } } });
      }

      await AuditService.log({
        actorId ,
        action: 'ENROLLMENT_DROPPED',
        entityType: 'ClassEnrollment',
        entityId: enrollment.id,
        description: `Dropped from ${enrollment.class.course.courseCode}`,
        oldValue: { status: enrollment.status },
        newValue: {  status: 'DROPPED'}
      }, tx);

      return dropped;
    });

    await NotificationService.safeCreate({
      userId: studentId,
      type: 'ENROLLMENT_DROPPED',
      title: 'Dropped from class',
      message: `You were dropped from ${enrollment.class.course.courseCode}.`,
      metadata: { classId }
    });

    return updated;
  }

  static async getClassEnrollments(classId: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: { name: true, email: true, profileImage: true, id: true },
        },
      },
      orderBy: { student: { name: 'asc' } },
      omit: {
        studentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return enrollments;
  }

  // Attendance Oversight
  static async getAttendanceRecords(filters?: GetAttendanceRecordsDto) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.sessionId && { sessionId: filters.sessionId }),
      ...(filters?.classId && { session: { classId: filters.classId } }),
      ...(filters?.startDate && filters?.endDate && {
        session: {
          sessionDate: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          student: {
            select: { name: true, id: true },
          },
          session: {
            include: {
              class: {
                include: {
                  course: {
                    select: {
                      courseCode: true,
                      courseName: true,
                      id: true
                    }
                  },
                  professor: {
                    select: {
                      id: true,
                      name: true
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
              classId: true,
              createdAt: true,
              updatedAt: true
            }
          },
        },
        orderBy: { session: { sessionDate: 'desc' } },
        omit: {
          sessionId: true,
          studentId: true,
          createdAt: true,
          updatedAt: true
        },
        ...getPaginationArgs({ page, limit })
      }),
      prisma.attendanceRecord.count({ where })
    ]);
    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async getAttendanceReport(classId: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: { course: true },
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    const report = await prisma.classEnrollment.findMany({
      where: { classId, status: 'ENROLLED' },
      include: {
        student: {
          select: {
            name: true,
            student: {
              select: { studentNumber: true },
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

  // Excuse Oversight
  static async getAllExcuseLetters(filters?: { status?: ExcuseStatus; studentId?: string } & Partial<PaginationParams>) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = {
      ...(filters?.status && { excuseDates: { some: { status: filters.status } } }),
      ...(filters?.studentId && { studentId: filters.studentId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.excuseLetter.findMany({
        where,
        include: {
          student: {
            select: { name: true, profileImage: true, id: true },
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
                              courseName: true
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
                      classId: true,
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
              excuseId: true,
              attendanceId: true
            }
          },
          attachments: true,
        },
        orderBy: { submittedAt: 'desc' },
        omit: {
          studentId: true,
          createdAt: true,
          updatedAt: true
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.excuseLetter.count({ where })
    ]);



    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async reviewExcuseLetter(
    userId: string,
    excuseId: string,
    data: { status: Extract<ExcuseStatus, 'APPROVED' | 'REJECTED'>; rejectionReason?: string }
  ) {
    if (data.status === 'REJECTED' && !data.rejectionReason) {
      throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
    };

    const excuseLetter = await prisma.excuseLetter.findUnique({
      where: { id: excuseId },
      select: { id: true, studentId: true }
    });

    if (!excuseLetter) {
      throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
    }

    const pendingDates = await prisma.excuseDate.findMany({
      where: { excuseId, status: 'PENDING' },
      select: { id: true, attendanceId: true }
    });

    if (pendingDates.length === 0) {
      throw new AppError('Excuse letter has already been fully reviewed', 400, 'EXCUSE_ALREADY_PROCESSED');
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
          data: { status: 'EXCUSED' },
        });
      }

      await AuditService.log({
        actorId: userId,
        action: data.status === 'APPROVED' ? 'EXCUSE_APPROVED' : 'EXCUSE_REJECTED',
        entityType: 'ExcuseLetter',
        entityId: excuseId,
        description: `Admin override${data.status === 'REJECTED' ? `: ${data.rejectionReason}` : ''}`,
        oldValue: { status: 'PENDING' },
        newValue: { status: data.status, affectedRecords: attendanceIds.length, override: true }
      }, tx);

      return { excuseId, status: data.status, affectedRecords: attendanceIds.length };
    });

    await NotificationService.safeCreate({
      userId: excuseLetter.studentId,
      type: data.status === 'APPROVED' ? 'EXCUSE_APPROVED' : 'EXCUSE_REJECTED',
      title: data.status === 'APPROVED' ? 'Excuse letter approved' : 'Excuse letter rejected',
      message: data.status === 'APPROVED' ? 'Your excuse letter has been approved' : `Your excuse letter was rejected: ${data.rejectionReason}`,
      metadata: { excuseId }
    });

    return result;
  }

  // Audit Logs
  static async getAuditLogs(
    filters?: { userId?: string; action?: AuditAction; startDate?: Date; endDate?: Date } & Partial<PaginationParams>): Promise<PaginatedResult<Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number]>> {

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    
    // Build once, reuse for both the page query and the count so they agree.
    const where = {
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.action && { action: filters.action }),
      ...(filters?.startDate && filters?.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate
        },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs({ page, limit })
      }),
      prisma.auditLog.count({ where })
    ]);

    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async getRfidRequests(filters?: { status?: RfidRequestStatus } & Partial<PaginationParams>) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const where = { ...(filters?.status && { status: filters.status }) };

    const [items, total] = await prisma.$transaction([
      prisma.rfidRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          student: {
            select: {
              studentNumber: true,
              user: {
                select: {
                  name: true, email: true
                }
              }
            }
          }
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.rfidRequest.count({ where })
    ]);
    
    return { items, pagination: buildPaginationMeta({ page, limit }, total) };
  }

  static async rejectRfidRequest(adminUserId: string, requestId: string, reason: string) {
    const request = await prisma.rfidRequest.findUnique({
      where: { id: requestId },
      include: { student: { select: { userId: true } } }
    });

    if (!request) {
      throw new AppError('RFID request not found', 404, 'RFID_REQUEST_NOT_FOUND');
    }

    if (request.status !== 'PENDING') {
      throw new AppError('This request has already been processed', 400, 'RFID_REQUEST_ALREADY_PROCESSED');
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.rfidRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          resolvedBy: adminUserId,
          resolvedAt: new Date()
        }
      });

      await AuditService.log({
        actorId: adminUserId,
        action: 'RFID_REQUEST_REJECTED',
        entityType: 'RfidRequest',
        entityId: requestId,
        description: reason,
        oldValue: { status: 'PENDING' },
        newValue: { status: 'REJECTED' }
      }, tx);

      return updated;
    });

    await NotificationService.safeCreate({
      userId: request.student.userId,
      type: 'RFID_REQUEST_REJECTED',
      title: 'RFID request rejected',
      message: `Your RFID request was rejected: ${reason}`,
      metadata: { requestId }
    });

    return updatedRequest;
  }

  static async registerDevice(adminUserId: string, label: string) {
    const token = generateDeviceToken();
    const tokenHash = hashToken(token);

    const device = await prisma.$transaction(async (tx) => {

      const created = await tx.device.create({
        data: { label, tokenHash },
        omit: { tokenHash: true }
      });

      await AuditService.log({
        actorId: adminUserId,
        action: 'DEVICE_REGISTERED',
        entityType: 'Device',
        entityId: created.id,
        newValue: { label }
      }, tx);

      return created;
    });

    return { ...device, token };
  }

  static async getDevices() {

    const devices = await prisma.device.findMany({
      omit: { tokenHash: true },
      orderBy: { createdAt: 'desc' },
      include: {
        attendanceSessions: {
          orderBy: { openedAt: 'desc' },
          take: 1,
          select: {
            openedAt: true,
            class: { select: { professor: { select: { id: true, name: true } } } }
          }
        }
      }
    });

    return devices.map(({ attendanceSessions, ...device }) => {

      const last = attendanceSessions[0];

      return {
        ...device,
        lastUsedBy: last
          ? {
              id: last.class.professor.id,
              name: last.class.professor.name,
              at: last.openedAt
            }
          : null
      };
    });
  }

  static async revokeDevice(adminUserId: string, deviceId: string, reason?: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    if (device.status === 'REVOKED') {
      throw new AppError('Device is already revoked', 400, 'DEVICE_ALREADY_REVOKED');
    }

    const revokedReason = reason ?? 'Revoked by admin';

    const updated = await prisma.$transaction(async (tx) => {

      const revokedDevice = await tx.device.update({
        where: { id: deviceId },
        data: { status: 'REVOKED', revokedAt: new Date(), revokedReason },
        omit: { tokenHash: true }
      });

      await AuditService.log({
        actorId: adminUserId,
        action: 'DEVICE_REVOKED',
        entityType: 'Device',
        entityId: deviceId,
        description: revokedReason,
        oldValue: { status: 'ACTIVE' },
        newValue: { status: 'REVOKED' }
      }, tx);

      return revokedDevice;
    });

    return updated;
  }
}

export default AdminService;