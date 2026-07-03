import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import AttachmentService from '../services/attachment.service';
import { AppError } from '../utils/app_error';

export const downloadExcuseAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const attachmentId = req.params.attachmentId as string;

        const attachment = await AttachmentService.getExcuseAttachmentForUser(
            { userId: req.user!.userId, role: req.user!.role },
            attachmentId
        );

        // filePath is stored web-style (e.g. "/uploads/excuses/xxx.pdf"); resolve to disk.
        const excusesDir = path.join(process.cwd(), 'uploads', 'excuses');
        const absolutePath = path.join(process.cwd(), attachment.filePath);

        // Defense-in-depth: the resolved path must stay inside uploads/excuses.
        if (!absolutePath.startsWith(excusesDir + path.sep) || !fs.existsSync(absolutePath)) {
            throw new AppError('Attachment file is missing', 404, 'FILE_NOT_FOUND');
        }

        // Strip characters that could break out of the header value.
        const safeName = attachment.fileName.replace(/["\r\n]/g, '');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

        return res.sendFile(absolutePath, (err) => {
            if (err) next(err);
        });
    } catch (error) {
        next(error);
    }
};
