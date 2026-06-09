import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/app-error';

// Ensure upload directory exists
// Creates the uploads/excuses/ folder if it doesn't exist. process.cwd() is the root of your project. recursive: true creates parent folders too.
const uploadDir = path.join(process.cwd(), 'uploads', 'excuses');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    // Tells multer where to save files. cb is a callback — first argument is error (null means no error), second is the directory.
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    // Renames the file to avoid collisions. If two students upload medical_cert.pdf, they'd overwrite each other. This generates something like 1712345678-123456789.pdf instead. path.extname extracts the extension from the original filename.
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// This runs for every file before it's saved. If the file type isn't allowed, it rejects it with an error. If it passes, cb(null, true) lets it through.
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImages = ['image/jpeg'];
    const allowedDocs = ['application/pdf'];
    const allAllowed = [...allowedImages, ...allowedDocs];

    if (!allAllowed.includes(file.mimetype)) {
        cb(new AppError('Invalid File Format. Please, upload JPEG and PDF file type', 400, 'INVALID_FILE_TYPE'));
        return;
    }

    // Check size limits based on type
    // Note: multer checks total limit, per-type check happens here
    if (allowedImages.includes(file.mimetype) && file.size > 5 * 1024 * 1024) {
        cb(new AppError('Image files must be under 5MB', 400, 'FILE_TOO_LARGE'));
        return;
    }

    if (allowedDocs.includes(file.mimetype) && file.size > 10 * 1024 * 1024) {
        cb(new AppError('PDF files must be under 10MB', 400, 'FILE_TOO_LARGE'));
        return;
    }

    cb(null, true);
};

export const excuseUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 3,
    },
});