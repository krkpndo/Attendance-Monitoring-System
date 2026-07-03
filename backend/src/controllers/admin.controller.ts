import { NextFunction, Request, Response } from 'express';
import AdminService from '../services/admin.service';
import NotificationService from '../services/notification.service';
import { AppError } from '../utils/app_error';
import { AuditAction, ClassStatus, ExcuseStatus, RfidRequestStatus, Semester, UserType, VerificationStatus } from '@prisma/client';

// User Management
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, name, type, studentData, professorData } = req.body;

    const result = await AdminService.createUser(req.user!.userId, {
      username, email, name, type, studentData, professorData,
    });

    return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const type = req.query.type as UserType | undefined;
      const search = req.query.search as string | undefined;

      const result = await AdminService.getUsers(type, search);

      return res.status(200).json({
          success: true,
          message: 'Users retrieved successfully',
          data: result
      });
  } catch (error) {
      next(error);
  }
};

export const getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;

    const result = await AdminService.getUserDetail(userId);

    return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const userId  = req.params.userId as string;
      const { name, email, username, password } = req.body;

      const result = await AdminService.updateUser(req.user!.userId, userId, { name, email, username, password });

      return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: result
      });
  } catch (error) {
      next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const userId  = req.params.userId as string;
      const { studentNumber, yearLevel, program, section, department } = req.body;

      const result = await AdminService.updateStudent(req.user!.userId, userId, {
          studentNumber, yearLevel, program, section, department
      });

      return res.status(200).json({
          success: true,
          message: 'Student updated successfully',
          data: result
      });
  } catch (error) {
      next(error);
  }
};

export const updateProfessor = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const userId  = req.params.userId as string;
      const { employeeNumber, department, position } = req.body;

      const result = await AdminService.updateProfessor(req.user!.userId, userId, {
          employeeNumber, department, position
      });

      return res.status(200).json({
          success: true,
          message: 'Professor updated successfully',
          data: result
      });
  } catch (error) {
      next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;

    const result = await AdminService.deactivateUser(req.user!.userId ,userId);

    return res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: result
    });
  } catch (error) {
    next(error);
  }
};

// Student Management
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, program, yearLevel, section, verificationStatus } = req.query;

    const result = await AdminService.getStudents({
      search: search as string | undefined,
      program: program as string | undefined,
      yearLevel: yearLevel ? parseInt(yearLevel as string) : undefined,
      section: section as string | undefined,
      verificationStatus: verificationStatus as VerificationStatus | undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: result
    });
  } catch (error) {
    next(error);
  }
};

export const revokeRfid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const { reason } = req.body ?? {};

    const result = await AdminService.revokeRfid(req.user!.userId, userId, reason);

    return res.json({
        success: true,
        message: 'RFID revoked successfully',
        data: result
    });
  } catch (error) {
    next(error);
  }
};

// Professor Management
export const getProfessors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, department } = req.query;

    const result = await AdminService.getProfessors({
      search: search as string | undefined,
      department: department as string | undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Professors retrieved successfully',
        data: result
    });
  } catch (error) {
    next(error);
  }
};

// Course Management
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseCode, courseName, courseDescription, units } = req.body;

    const result = await AdminService.createCourse({ courseCode, courseName, courseDescription, units });

    return res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getCourses();

    return res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getCourseDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.courseId as string;

    const result = await AdminService.getCourseDetail(courseId);

    return res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.courseId as string;
    const { courseName, courseDescription, units } = req.body;

    const result = await AdminService.updateCourse(courseId, { courseName, courseDescription, units });

    return res.status(200).json({ success: true, message: 'Course updated successfully', data: result });

  } catch (error) {
    next(error);
  }
};

// Class Management
export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, professorId, section, schoolYear, semester, room } = req.body;

    const result = await AdminService.createClass({ courseId, professorId, section, schoolYear, semester, room });

    return res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, professorId, schoolYear, semester, status } = req.query;

    const result = await AdminService.getClasses({
      courseId: courseId as string | undefined,
      professorId: professorId as string | undefined,
      schoolYear: schoolYear as string | undefined,
      semester: semester as Semester | undefined,
      status: status as ClassStatus | undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Classes retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getClassDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await AdminService.getClassDetail(classId);

    return res.status(200).json({
        success: true,
        message: 'Class retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;
    const { professorId, section, room, status } = req.body;

    const result = await AdminService.updateClass(classId, { professorId, section, room, status });

    return res.status(200).json({
        success: true,
        message: 'Class updated successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const setClassSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;
    const { schedules } = req.body;

    const result = await AdminService.setClassSchedule(classId, schedules);

    return res.status(200).json({
        success: true,
        message: 'Class schedule set successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Enrollment Management
export const enrollStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;
    const { studentId } = req.body;

    const result = await AdminService.enrollStudent(req.user!.userId, classId, studentId);

    return res.status(201).json({
        success: true,
        message: 'Student enrolled successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const dropStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;
    const studentId = req.params.studentId as string;

    const result = await AdminService.dropStudent(req.user!.userId ,classId, studentId);

    return res.status(200).json({
        success: true,
        message: 'Student dropped successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getClassEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await AdminService.getClassEnrollments(classId);

    return res.status(200).json({
        success: true,
        message: 'Enrollments retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Attendance Oversight
export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, sessionId, studentId, startDate, endDate } = req.query;

    const result = await AdminService.getAttendanceRecords({
      classId: classId as string | undefined,
      sessionId: sessionId as string | undefined,
      studentId: studentId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Attendance records retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await AdminService.getAttendanceReport(classId);

    return res.status(200).json({
        success: true,
        message: 'Attendance report retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Excuse Oversight
export const getExcuseLetters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, studentId } = req.query;

    const result = await AdminService.getAllExcuseLetters({
      status: status as ExcuseStatus | undefined,
      studentId: studentId as string | undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Excuse letters retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const reviewExcuseLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const excuseId = req.params.excuseId as string;
    const { status, rejectionReason } = req.body;

    const result = await AdminService.reviewExcuseLetter(req.user!.userId, excuseId, {
      status,
      rejectionReason,
    });

    return res.status(200).json({
        success: true,
        message: `Excuse letter ${status.toLowerCase()}`,
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Audit Logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, action, startDate, endDate } = req.query;

    const result = await AdminService.getAuditLogs({
      userId: userId as string | undefined,
      action: action as AuditAction | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Notifications
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationService.getNotifications(req.user!.userId);

    return res.status(200).json({ success: true, message: 'Notifications retrieved successfully', data: result });

  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.notificationId as string;

    const result = await NotificationService.markAsRead(req.user!.userId, notificationId);

    return res.status(200).json({ success: true, message: 'Notification marked as read', data: result });

  } catch (error) {
    next(error);
  }
};

export const getRfidRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as RfidRequestStatus | undefined;

    const result = await AdminService.getRfidRequests({ status });

    return res.status(200).json({
      success: true,
      message: 'RFID requests retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRfidRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const { reason } = req.body;

    const result = await AdminService.rejectRfidRequest(req.user!.userId, requestId, reason);

    return res.status(200).json({
      success: true,
      message: 'RFID request rejected',
      data: result
    });
  } catch (error) {
    next(error);
  } 
};

// Devices
export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { label } = req.body;
    const result = await AdminService.registerDevice(req.user!.userId, label);
  
    return res.status(201).json({
      success: true,
      message: 'Device registered',
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.getDevices();

    return res.status(200).json({
      success: true,
      message: 'Devices retrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const revokeDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.deviceId as string;
    const { reason } = req.body ?? {};

    const result = await AdminService.revokeDevice(req.user!.userId, deviceId, reason);

    return res.status(200).json({
      success: true,
      message: 'Device revoked',
      data: result
    });
  } catch (error) {
    next(error);
  }
};