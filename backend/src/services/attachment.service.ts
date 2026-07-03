import prisma from '../config/prisma';
import { AppError } from '../utils/app_error';
import { UserType } from '@prisma/client';

class AttachmentService {

    /**
     * Resolves an excuse attachment for download, enforcing that the requester is
     * allowed to see it: the owning student, a professor who teaches one of the
     * excuse's classes, or any admin. Returns only what the download route needs.
     */
    static async getExcuseAttachmentForUser(
        requester: { userId: string; role: UserType },
        attachmentId: string
    ) {
        const attachment = await prisma.excuseAttachment.findUnique({
            where: { id: attachmentId },
            select: {
                fileName: true,
                fileType: true,
                filePath: true,
                excuseLetter: {
                    select: {
                        studentId: true,
                        excuseDates: {
                            select: {
                                attendanceRecord: {
                                    select: {
                                        session: {
                                            select: { class: { select: { professorId: true } } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!attachment) {
            throw new AppError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
        }

        const excuse = attachment.excuseLetter;

        const authorized =
            requester.role === 'ADMIN' ||
            (requester.role === 'STUDENT' && excuse.studentId === requester.userId) ||
            (requester.role === 'PROFESSOR' &&
                excuse.excuseDates.some(
                    (d) => d.attendanceRecord.session.class.professorId === requester.userId
                ));

        if (!authorized) {
            throw new AppError('You are not allowed to access this attachment', 403, 'FORBIDDEN');
        }

        return {
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            filePath: attachment.filePath
        };
    }
}

export default AttachmentService;
