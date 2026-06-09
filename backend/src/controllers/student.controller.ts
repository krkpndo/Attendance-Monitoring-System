import { NextFunction, Request, Response } from "express";
import StudentService from "../services/student.service";
import { AppError } from "../utils/app-error";
import NotificationService from "../services/notification.service";
import multer from "multer";
import { UploadExcuseLetterAttachmentsDto } from "../interfaces/student.interface";

export const getStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.userId;

        if (!req.user) {
            return  res.status(403).json({
                success: false,
                message: 'Missing required parameter: user'
            });
        }

        const record = await StudentService.getStudentProfile(studentId!);

        return res.status(200).json({
            success: true,
            message: 'Student records fetched successfully',
            data: record
        });

    } catch (error) {
        next(error);
    }
};

export const registerRFID = async (req: Request, res: Response, next: NextFunction) => {
    const { rfidNumber } = req.body;
    const { userId } = req.user!;

    try {
        const updatedStudentInfo = await StudentService.updateRfidInfo(userId, rfidNumber);

        return res.status(200).json({
            success: true,
            message: 'RFID registration successful',
            data: updatedStudentInfo
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

        await StudentService.updateProfile(req.user!.userId, {
            name, email, username, password, newPassword, profileImage
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;

        const record = await StudentService.getStudentClasses(studentId);

        if (record.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Class record empty'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student classes fetched successfully',
            data: record
        });

    } catch (error) {
        next(error);
    }
};

export const getClassSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await StudentService.getClassSchedule(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: 'Schedule retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {

    const classId = req.query.classId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    try {
        const record = await StudentService.getStudentAttendance({
            userId: req.user!.userId,
            classId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });

        if (record.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Attendance records empty',
                data: record
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Attendance records fetched successfully',
            data: record
        });

    } catch (error) {
        next(error);
    }
};

export const getAttendanceSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const summary = await StudentService.getStudentAttendanceSummary(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: 'Attendance summary fetched successfully',
            data: summary
        });
    } catch (error) {
        next(error);
    }

};

export const getAbsencesByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and End date are required'
            });
        }

        const result = await StudentService.getAbsencesByDateRange({
            studentId: userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        return res.status(200).json({
            success: true,
            message: 'Absences retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const submitExcuseLetter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { excuseType, description, attendanceRecordIds } = req.body;

        await StudentService.submitExcuseLetter(req.user!.userId, { excuseType, description, attendanceRecordIds });

        return res.status(201).json({
            success: true,
            message: 'Excuse letter submission success',
        });
    } catch (error) {
        next(error);
    }
};

export const uploadExcuseAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const excuseId = req.params.excuseId as string;

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one file is required' });
        }

        const uploadParams: UploadExcuseLetterAttachmentsDto = {
            userId: req.user!.userId,
            excuseId,
            files: files.map(file => ({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                filePath: `/uploads/excuses/${file.filename}`,
            }))
        };

        await StudentService.uploadExcuseAttachments(uploadParams);

        return res.status(201).json({
            success: true,
            message: files.length > 1 ? `Attachments uploaded successfully` : `Attachment uploaded successfully`,
        });
    } catch (error) {
        next(error);
    }
};

export const getExcuseLetters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await StudentService.getExcuseLetters(req.user!.userId);

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
        const { excuseId } = req.params;

        const result = await StudentService.getExcuseLetterDetail(req.user!.userId, excuseId as string);

        return res.status(200).json({
            success: true,
            message: 'Excuse letter detail retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const result = await NotificationService.getNotifications(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
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
            message: 'Internal Server Error',
            code: 'SERVER_ERROR'
        });
    }
};

export const markNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        const result = await NotificationService.markAsRead(req.user!.userId, notificationId as string);

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read',
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
            message: 'Internal Server Error',
            code: 'SERVER_ERROR'
        });
    }
};