import prisma from '../config/prisma';
import argon2 from 'argon2';
import { AppError } from '../utils/app-error';
import { CreateClassDto, CreateCourseDto, CreateUserDto, GetAttendanceRecordsDto, GetClassesFilter, SetClassSchedultDto, StudentSearchFilter, UpdateClassDto, UpdateCourseDto, UpdateProfessorProfileDto, UpdateStudentProfileDto, UpdateUserProfileDto } from '../interfaces/admin.interface';
import { Prisma } from '@prisma/client';

class AdminService {

  // User Management
  static async createUser(data: CreateUserDto) {
    
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
      console.log(data);
      if (!data.studentData) {
        throw new AppError('Student data is required', 400, 'STUDENT_DATA_REQUIRED');
      }

      const existingStudent = await prisma.student.findUnique({
        where: { studentNumber: data.studentData.studentNumber },
      });

      if (existingStudent) {
        throw new AppError('Student number already exists', 400, 'STUDENT_NUMBER_EXISTS');
      }

      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email,
          name: data.name,
          type: data.type,
          student: {
            create: {
              studentNumber: data.studentData.studentNumber,
              yearLevel: data.studentData.yearLevel,
              program: data.studentData.program,
              section: data.studentData.section,
              department: data.studentData.department,
            },
          },
        },
        omit: { password: true }
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

      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email,
          name: data.name,
          type: 'PROFESSOR',
          professor: {
            create: {
              employeeNumber: data.professorData.employeeNumber,
              department: data.professorData.department,
              position: data.professorData.position,
            },
          },
        },
        omit: { password: true }
      });

      return user;
    }

    if (data.type === 'ADMIN') {
      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email,
          name: data.name,
          type: 'ADMIN',
        },
        omit: { password: true }
      });

      return user;
    }

    throw new AppError('Invalid user type', 400, 'INVALID_USER_TYPE');
  }

  static async getUsers(type?: string, search?: string) {
    const users = await prisma.user.findMany({
        where: {
            ...(type && { type: type as any }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                ],
            }),
        },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            type: true,
            status: true,
            profileImage: true,
            createdAt: true,
        },
        orderBy: { name: 'asc' },
    });

    return users;
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

  static async updateUser(userId: string, data: UpdateUserProfileDto) {
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

    const updatedUser = await prisma.user.update({
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

    return updatedUser;
  }

  static async updateStudent(userId: string, data: UpdateStudentProfileDto) {
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

    const updated = await prisma.student.update({
        where: { userId },
        data: {
            studentNumber: data.studentNumber,
            rfidStatus: data.rfidStatus,
            yearLevel: data.yearLevel,
            program: data.program,
            section: data.section,
            department: data.department,
        }
    });

    return updated;
  }

  static async updateProfessor(userId: string, data: UpdateProfessorProfileDto) {
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

    const updated = await prisma.professor.update({
        where: { userId },
        data: {
            employeeNumber: data.employeeNumber,
            department: data.department,
            position: data.position,
        }
    });

    return updated;
}

  static async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('User is already deactivated', 400, 'ALREADY_DEACTIVATED');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
      select: {
        id: true,
        username: true,
        name: true,
        type: true,
        status: true,
      },
    });

    return updatedUser;
  }

  // Student Management
  static async getStudents(filters?: StudentSearchFilter) {
    const students = await prisma.student.findMany({
      where: {
        ...(filters?.program && { program: filters.program }),
        ...(filters?.yearLevel && { yearLevel: filters.yearLevel }),
        ...(filters?.section && { section: filters.section }),
        ...(filters?.verificationStatus && { verificationStatus: filters.verificationStatus as any }),
        ...(filters?.search && {
          OR: [
            { studentNumber: { contains: filters.search, mode: 'insensitive' } },
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, profileImage: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return students;
  }

  // static async assignRfid(studentId: string, rfidNumber: string) {
  //   const student = await prisma.student.findUnique({
  //     where: { id: studentId },
  //   });

  //   if (!student) {
  //     throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
  //   }

  //   const existingRfid = await prisma.student.findUnique({
  //     where: { rfidNumber },
  //   });

  //   if (existingRfid) {
  //     throw new AppError('RFID number is already registered', 400, 'RFID_ALREADY_REGISTERED');
  //   }

  //   const updatedStudent = await prisma.student.update({
  //     where: { id: studentId },
  //     data: {
  //       rfidNumber,
  //       rfidStatus: 'ACTIVE',
  //       verificationStatus: 'RFID_VERIFIED',
  //       registeredAt: new Date(),
  //     },
  //   });

  //   return updatedStudent;
  // }

  static async deactivateRfid(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    console.log(student);

    if (!student) {
      throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
    }

    if (student.rfidStatus === 'INACTIVE') {
      throw new AppError('RFID is already deactivated', 400, 'RFID_ALREADY_DEACTIVATED');
    }

    const updatedStudent = await prisma.student.update({
      where: { userId },
      data: {
        rfidNumber: null,
        rfidStatus: 'INACTIVE',
        verificationStatus: 'UNVERIFIED',
        rfidDeactivatedAt: new Date(),
      },
    });

    return updatedStudent;
  }

  // Professor Management
  static async getProfessors(filters?: { search?: string; department?: string }) {
    const professors = await prisma.professor.findMany({
      where: {
        ...(filters?.department && { department: filters.department }),
        ...(filters?.search && {
          OR: [
            { employeeNumber: { contains: filters.search, mode: 'insensitive' } },
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }),
      },
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
      }
    });

    return professors;
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

    // professorId is now a user ID, so check users table
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
        semester: data.semester as any,
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

    return newClass;
  }

  static async getClasses(filters?: GetClassesFilter) {
    const classes = await prisma.class.findMany({
      where: {
        ...(filters?.courseId && { courseId: filters.courseId }),
        ...(filters?.professorId && { professorId: filters.professorId }),
        ...(filters?.schoolYear && { schoolYear: filters.schoolYear }),
        ...(filters?.semester && { semester: filters.semester as any }),
        ...(filters?.status && { status: filters.status as any }),
      },
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
      }
    });

    return classes;
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
        status: data.status as any,
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

    return updated;
  }

  static async setClassSchedule(classId: string, schedules: SetClassSchedultDto[]) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    await prisma.classSchedule.deleteMany({
      where: { classId },
    });

    await prisma.classSchedule.createMany({
      data: schedules.map((s) => ({
        classId,
        dayOfWeek: s.dayOfWeek,
        startTime: new Date(`1970-01-01T${s.startTime}`),
        endTime: new Date(`1970-01-01T${s.endTime}`),
      })),
    });

    const newSchedules = await prisma.classSchedule.findMany({
      where: { classId },
      omit: {
        createdAt: true,
        updatedAt: true
      }
    });

    return newSchedules;
  }

  // Enrollment Management
  static async enrollStudent(classId: string, studentId: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
    }

    // studentId is now a user ID, so check users table
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

      const reEnrolled = await prisma.classEnrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          status: 'ENROLLED',
          droppedDate: null,
          enrollmentDate: new Date(),
        },
      });

      return reEnrolled;
    }

    const enrollment = await prisma.classEnrollment.create({
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

    return enrollment;
  }

  static async dropStudent(classId: string, studentId: string) {
    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
    }

    if (enrollment.status === 'DROPPED') {
      throw new AppError('Student is already dropped from this class', 400, 'ALREADY_DROPPED');
    }

    const updated = await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'DROPPED',
        droppedDate: new Date(),
      },
      omit: {
        createdAt: true,
        updatedAt: true
      }
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
    const records = await prisma.attendanceRecord.findMany({
      where: {
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
      },
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
      }
    });

    return records;
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
  static async getAllExcuseLetters(filters?: { status?: string; studentId?: string }) {
    const excuseLetters = await prisma.excuseLetter.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.studentId && { studentId: filters.studentId }),
      },
      include: {
        student: {
          select: { name: true, profileImage: true, id: true },
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
        approvedByUser: { select: { name: true } },
      },
      orderBy: { submittedAt: 'desc' },
      omit: {
        studentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return excuseLetters;
  }

  static async reviewExcuseLetter(
    userId: string,
    excuseId: string,
    data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ) {
    const excuseLetter = await prisma.excuseLetter.findUnique({
      where: { id: excuseId },
      include: { excuseDates: { select: { attendanceId: true } } },
    });

    if (!excuseLetter) {
      throw new AppError('Excuse letter not found', 404, 'EXCUSE_NOT_FOUND');
    }

    if (excuseLetter.status !== 'PENDING') {
      throw new AppError('Excuse letter has already been processed', 400, 'EXCUSE_ALREADY_PROCESSED');
    }

    if (data.status === 'REJECTED' && !data.rejectionReason) {
      throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedExcuse = await tx.excuseLetter.update({
        where: { id: excuseId },
        data: {
          status: data.status,
          approvedBy: userId,
          approvalDate: new Date(),
          rejectionReason: data.rejectionReason,
        },
        omit: {
          createdAt: true,
          updatedAt: true
        }
      });

      if (data.status === 'APPROVED') {
        const attendanceIds = excuseLetter.excuseDates.map((d) => d.attendanceId);

        await tx.attendanceRecord.updateMany({
          where: { id: { in: attendanceIds } },
          data: { status: 'EXCUSED' },
        });
      }

      return updatedExcuse;
    });

    return result;
  }

  // Audit Logs
  static async getAuditLogs(filters?: { userId?: string; action?: string; startDate?: Date; endDate?: Date }) {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.action && { action: filters.action as any }),
        ...(filters?.startDate && filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        user: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }
}

export default AdminService;