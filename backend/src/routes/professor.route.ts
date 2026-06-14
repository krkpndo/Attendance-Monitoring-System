import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as ProfessorController from '../controllers/professor.controller';
import { profileUpload } from '../config/profile-upload';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate, authorize('PROFESSOR'));

// Profile
router.get('/profile', ProfessorController.getProfile);
router.patch('/profile', profileUpload.single('profileImage'), ProfessorController.updateProfile);

// Classes
router.get('/classes', ProfessorController.getAssignedClasses);
router.get('/classes/schedule', ProfessorController.getClassSchedule);
router.get('/classes/:classId/roster', ProfessorController.getClassRoster);
router.get('/classes/:classId/session', ProfessorController.getAttendanceSessions);
router.get('/classes/:classId/report', ProfessorController.getAttendanceReport);

// Attendance Sessions
router.post('/sessions', ProfessorController.openAttendanceSession);
router.patch('/sessions/:sessionId/close', ProfessorController.closeAttendanceSession);
router.patch('/sessions/:sessionId/cancel', ProfessorController.cancelAttendanceSession);

// Attendance Records
router.get('/sessions/:sessionId/attendance', ProfessorController.getAttendanceRecords);
router.patch('/sessions/attendance/:recordId', ProfessorController.markAttendance);

// Excuse Letters
router.get('/excuse-letters', ProfessorController.getExcuseLetters);
router.get('/excuse-letters/:excuseId', ProfessorController.getExcuseLetterDetail);
router.patch('/excuse-letters/:excuseId/review', ProfessorController.reviewExcuseLetter);

// Notifications
router.get('/notifications', ProfessorController.getNotifications);
router.patch('/notifications/:notificationId/read', ProfessorController.markNotificationAsRead);

export default router;