import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import multer from "multer";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.errorCode
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        code: 'SERVER_ERROR'
    });
};

export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_COUNT':
                return next(new AppError('Only one file is allowed for profile image', 400, 'TOO_MANY_FILES'));
            case 'LIMIT_FILE_SIZE':
                return next(new AppError('File size exceeds the allowed limit', 400, 'FILE_TOO_LARGE'));
            case 'LIMIT_UNEXPECTED_FILE':
                return next(new AppError(`Unexpected field name: "${err.field}". Use "profileImage" for profile uploads or "files" for attachments`, 400, 'UNEXPECTED_FIELD'));
            default:
                return next(new AppError('File upload error', 400, 'UPLOAD_ERROR'));
        }
    }
    next(err);
};