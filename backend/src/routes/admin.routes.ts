import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as AdminController from '../controllers/admin.controller';
import { validate } from '../middlewares/validation.middleware';
import { createClassSchema, createCourseSchema, getAttendanceQuerySchema, getClassesQuerySchema, getExcuseLettersQuerySchema, getStudentsQuerySchema, getUsersQuerySchema, idParamSchema, reviewExcuseLetterSchema, setClassScheduleSchema, updateClassSchema, updateCourseSchema } from '../validators/admin.validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// User Management
router.post('/users/create', AdminController.createUser);
router.get('/users', validate(getUsersQuerySchema, 'query'), AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserDetail);
router.patch('/users/:userId', AdminController.updateUser);
router.patch('/users/:userId/deactivate', AdminController.deactivateUser);
router.patch('/users/students/:userId', AdminController.updateStudent);
router.patch('/users/professors/:userId', AdminController.updateProfessor);

// Student Management
router.get('/students', validate(getStudentsQuerySchema), AdminController.getStudents);
router.patch('/students/:userId/rfid/deactivate', AdminController.deactivateRfid);

// Untested
// router.post('/students/:studentId/rfid', AdminController.assignRfid);


// Professor Management
router.get('/professors', AdminController.getProfessors);

// Course Management
router.post('/courses/create', validate(createCourseSchema) ,AdminController.createCourse);
router.get('/courses', AdminController.getCourses);
router.get('/courses/:courseId', validate(idParamSchema),AdminController.getCourseDetail);
router.patch('/courses/:courseId/update', validate(updateCourseSchema),AdminController.updateCourse);

// Class Management
router.post('/classes/create', validate(createClassSchema), AdminController.createClass);
router.get('/classes', validate(getClassesQuerySchema), AdminController.getClasses);
router.get('/classes/:classId', validate(idParamSchema), AdminController.getClassDetail);
router.patch('/classes/:classId/update', validate(updateClassSchema), AdminController.updateClass);
router.put('/classes/:classId/schedule', validate(setClassScheduleSchema), AdminController.setClassSchedule);

// Enrollment Management
router.post('/classes/:classId/enroll', validate(idParamSchema, 'params'), AdminController.enrollStudent);
router.patch('/classes/:classId/students/:studentId/drop', AdminController.dropStudent);
router.get('/classes/:classId/enrollments', AdminController.getClassEnrollments);

// Attendance Oversight
router.get('/attendance', validate(getAttendanceQuerySchema, 'query'), AdminController.getAttendanceRecords);
router.get('/attendance/:classId/report', AdminController.getAttendanceReport);

// Excuse Oversight
router.get('/excuse-letters', validate(getExcuseLettersQuerySchema), AdminController.getExcuseLetters);
router.patch('/excuse-letters/:excuseId/review', validate(reviewExcuseLetterSchema) ,AdminController.reviewExcuseLetter);

// Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

// Notifications
router.get('/notifications', AdminController.getNotifications);
router.patch('/notifications/:notificationId/read', AdminController.markNotificationAsRead);

export default router;