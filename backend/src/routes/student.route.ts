import { Router } from 'express';
import * as StudentController from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { excuseUpload } from '../config/attachment-upload';
import { validate } from '../middlewares/validation.middleware';
import { getAbsencesQuerySchema, getStudentAttendanceQuerySchema, registerRfidSchema, studentUpdateProfileSchema, submitExcuseLetterSchema, submitRfidRequestSchema } from '../validators/student.validators';
import { profileUpload } from '../config/profile-upload';
import { paginationQuerySchema } from '../validators/shared.validators';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

// Profile
router.get('/profile', StudentController.getStudentProfile);
router.patch('/profile', profileUpload.single('profileImage'), validate(studentUpdateProfileSchema), StudentController.updateProfile);

// Classes
router.get('/classes', StudentController.getClasses);
router.get('/classes/schedule', StudentController.getClassSchedule);
router.get('/attendance', validate(getStudentAttendanceQuerySchema, 'query'), StudentController.getAttendance);
router.get('/attendance/summary', StudentController.getAttendanceSummary);
router.get('/attendance/absences', validate(getAbsencesQuerySchema, 'query'), StudentController.getAbsencesByDateRange);

// Excuse Letters
router.get('/excuse-letters', StudentController.getExcuseLetters);
router.get('/excuse-letters/:excuseId', StudentController.getExcuseLetterDetail);
router.post('/excuse-letters/submit', validate(submitExcuseLetterSchema), StudentController.submitExcuseLetter);
router.post('/excuse-letters/:excuseId/attachments',
    excuseUpload.array('files', 3),
    StudentController.uploadExcuseAttachment
);

// Notifications
router.get('/notifications', validate(paginationQuerySchema, 'query'),StudentController.getNotifications);
router.patch('/notifications/:notificationId/read', StudentController.markNotificationsAsRead);

// RFID
router.patch('/rfid/register', validate(registerRfidSchema), StudentController.registerRFID);
router.post('/rfid/requests', validate(submitRfidRequestSchema), StudentController.submitRfidRequest);
router.get('/rfid/requests', StudentController.getRfidRequests);

export default router;