import { Router } from 'express';
import * as StudentController from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { excuseUpload } from '../config/attachment-upload';
import { validate } from '../middlewares/validation.middleware';
import { registerRfidSchema, submitExcuseLetterSchema } from '../validators/student.validators';
import { updateProfileSchema } from '../validators/shared.validators';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

// Profile
router.get('/profile', StudentController.getStudentProfile);
router.patch('/profile', validate(updateProfileSchema), StudentController.updateProfile);

// RFID
router.patch('/rfid/register', validate(registerRfidSchema), StudentController.registerRFID);

// Classes
router.get('/classes', StudentController.getClasses);
router.get('/classes/schedule', StudentController.getClassSchedule);
router.get('/attendance', StudentController.getAttendance);
router.get('/attendance/summary', StudentController.getAttendanceSummary);
router.get('/attendance/absences', StudentController.getAbsencesByDateRange);

// Excuse Letters
router.get('/excuse-letters', StudentController.getExcuseLetters);
router.get('/excuse-letters/:excuseId', StudentController.getExcuseLetterDetail);
router.post('/excuse-letters/submit', validate(submitExcuseLetterSchema), StudentController.submitExcuseLetter);
router.post('/excuse-letters/:excuseId/attachments',
    excuseUpload.array('files', 5),
    StudentController.uploadExcuseAttachment
);

// Notifications
router.get('/notifications', StudentController.getNotifications);
router.patch('/notifications/:notificationId/read', StudentController.markNotificationsAsRead);

export default router;