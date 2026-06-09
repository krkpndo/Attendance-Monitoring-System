import { RfidStatus, UserType } from "@prisma/client";

export interface CreateUserDto {
    username: string;
    email: string;
    name: string;
    type: UserType;
    studentData?: {
      studentNumber: string;
      yearLevel: number;
      program: string;
      section: string;
      department?: string;
    };
    professorData?: {
      employeeNumber: string;
      department: string;
      position: string;
    };
}

export interface UpdateStudentProfileDto {
  studentNumber?: string;
  rfidStatus?: RfidStatus;
  yearLevel?: number;
  program?: string;
  section?: string;
  department?: string;
}

export interface UpdateProfessorProfileDto {
  employeeNumber?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserProfileDto {
  name?: string; 
  email?: string; 
  username?: string;
  password?: string;
}

export interface StudentSearchFilter {
  search?: string;
  program?: string;
  yearLevel?: number;
  section?: string;
  verificationStatus?: string;
}

export interface CreateCourseDto {
  courseCode: string;
  courseName: string;
  courseDescription?: string;
  units: number;
}

export interface UpdateCourseDto {
  courseName?: string;
  courseDescription?: string;
  units?: number;
}

export interface CreateClassDto {
  courseId: string;
  professorId: string;
  section: string;
  schoolYear: string;
  semester: string;
  room?: string;
}

export interface GetClassesFilter {
  courseId?: string;
  professorId?: string;
  schoolYear?: string;
  semester?: string;
  status?: string;
}

export interface UpdateClassDto {
  professorId?: string;
  section?: string;
  room?: string;
  status?: string;
}

export interface SetClassSchedultDto {
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface GetAttendanceRecordsDto {
  classId?: string;
  sessionId?: string;
  studentId?: string;
  startDate?: Date;
  endDate?: Date;
}