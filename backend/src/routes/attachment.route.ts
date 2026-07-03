import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { attachmentIdParamSchema } from '../validators/shared.validators';
import * as AttachmentController from '../controllers/attachment.controller';

const router = Router();

// Any authenticated user; per-attachment authorization is enforced in the service.
router.get(
    '/excuse/:attachmentId',
    authenticate,
    validate(attachmentIdParamSchema, 'params'),
    AttachmentController.downloadExcuseAttachment
);

export default router;
