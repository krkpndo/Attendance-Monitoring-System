import { NextFunction, Request, Response } from 'express';
import ProfessorService from '../services/professor.service';
import NotificationService from '../services/notification.service';
import { AppError } from '../utils/app_error';
import { MarkAttendanceDto, ReviewExcuseLetterDto, UpdateProfileDto } from '../interfaces/professor.interface';
import path from 'path';
import fs from 'fs';


// Profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProfessorService.getProfessorProfile(req.user!.userId);

    return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { name, email, username, password, newPassword } = req.body || {};

      const profileImage = req.file
          ? `/uploads/profiles/${req.file.filename}`
          : undefined;

      await ProfessorService.updateProfile(req.user!.userId, {
          name, email, username, password, newPassword, profileImage
      });

      return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
      });
  } catch (error) {
      if (req.file) {
          const p = path.join(process.cwd(), 'uploads', 'profiles', req.file.filename);
          if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      next(error);
  }
};

// Classes
export const getAssignedClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProfessorService.getAssignedClasses(req.user!.userId);

    return res.status(200).json({
        success: true,
        message: 'Classes retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getClassRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await ProfessorService.getClassRoster(req.user!.userId, classId);

    return res.status(200).json({
        success: true,
        message: 'Class roster retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getClassSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProfessorService.getClassSchedule(req.user!.userId);

    return res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
        data: result
    });

  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message, 
        code: error.errorCode
    });
    }
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
    });
  }
};

// Attendance Sessions
export const openAttendanceSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, scheduleId, deviceId } = req.body;

    const session = await ProfessorService.openAttendanceSession(req.user!.userId, classId, scheduleId, deviceId);

    return res.status(201).json({
        success: true,
        message: 'Attendance session opened',
        data: session
    });

  } catch (error) {
    next(error);
  }
};

export const closeAttendanceSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId as string;

    await ProfessorService.closeAttendanceSession(req.user!.userId, sessionId);

    return res.status(200).json({
        success: true,
        message: 'Attendance session closed',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAttendanceSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId as string;

    await ProfessorService.cancelAttendanceSession(req.user!.userId, sessionId);

    return res.status(200).json({
        success: true,
        message: 'Attendance session cancelled',
    });

  } catch (error) {
    next(error);
  }
};

export const getAttendanceSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await ProfessorService.getAttendanceSessions(req.user!.userId, classId);

    return res.status(200).json({
        success: true,
        message: 'Attendance sessions retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Attendance Records
export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId as string;

    const result = await ProfessorService.getAttendanceRecords(req.user!.userId, sessionId);

    return res.status(200).json({
        success: true,
        message: 'Attendance records retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordId = req.params.recordId as string;
    const { status, remarks } = req.body;

    const markParam: MarkAttendanceDto = {
      userId: req.user!.userId,
      recordId,
      data: { status, remarks }
    };

    await ProfessorService.markAttendance(markParam);

    return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
    });

  } catch (error) {
    next(error);
  }
};

// Excuse Letters
export const getExcuseLetters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.query.classId as string | undefined;

    const result = await ProfessorService.getExcuseLetters(req.user!.userId, classId);

    return res.status(200).json({
        success: true,
        message: 'Excuse letters retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getExcuseLetterDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const excuseId = req.params.excuseId as string;

    const result = await ProfessorService.getExcuseLetterDetail(req.user!.userId, excuseId);

    return res.json({
        success: true,
        message: 'Excuse letter retrieved successfully',
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

    const requestParam: ReviewExcuseLetterDto = {
      userId: req.user!.userId,
      excuseId: excuseId,
      data: {
        status,
        rejectionReason
      }
    };

    const result = await ProfessorService.reviewExcuseLetter(requestParam);

    return res.status(200).json({
        success: true,
        message: `Excuse letter ${status.toLowerCase()}`,
        data: result
    });

  } catch (error) {
    next(error);
  }
};

// Attendance Reports
export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;

    const result = await ProfessorService.getAttendanceReport(req.user!.userId, classId);

    return res.status(200).json({
        success: true,
        message: 'Attendance report retrieved successfully',
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

    return res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result
    });

  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.notificationId as string;

    const result = await NotificationService.markAsRead(req.user!.userId, notificationId);

    return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: result
    });

  } catch (error) {
    next(error);
  }
};