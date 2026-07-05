import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as AdminController from '../controllers/admin.controller';
import { validate } from '../middlewares/validation.middleware';
import { courseIdParamSchema, createClassSchema, createCourseSchema, createUserSchema, deviceIdParamSchema, enrollStudentSchema, getAttendanceQuerySchema, getAuditLogsQuerySchema, getClassesQuerySchema, getExcuseLettersQuerySchema, getRfidRequestsQuerySchema, getStudentsQuerySchema, getUsersQuerySchema, idParamSchema, registerDeviceSchema, rejectRfidRequestSchema, revokeDeviceSchema, setClassScheduleSchema, updateClassSchema, updateCourseSchema, updateProfessorSchema, updateStudentSchema, updateUserSchema } from '../validators/admin.validators';
import { paginationQuerySchema, reviewExcuseLetterSchema } from '../validators/shared.validators';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// User Management
router.post('/users/create', validate(createUserSchema), AdminController.createUser);
router.get('/users', validate(getUsersQuerySchema, 'query'), AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserDetail);
router.patch('/users/:userId', validate(updateUserSchema), AdminController.updateUser);
router.patch('/users/:userId/deactivate', AdminController.deactivateUser);
router.patch('/users/students/:userId', validate(updateStudentSchema), AdminController.updateStudent);
router.patch('/users/professors/:userId', validate(updateProfessorSchema), AdminController.updateProfessor);

// Student Management
router.get('/students', validate(getStudentsQuerySchema, 'query'), AdminController.getStudents);

// Professor Management
router.get('/professors', AdminController.getProfessors);

// Course Management
router.post('/courses/create', validate(createCourseSchema) ,AdminController.createCourse);
router.get('/courses', AdminController.getCourses);
router.get('/courses/:courseId', validate(courseIdParamSchema, 'params'), AdminController.getCourseDetail);
router.patch('/courses/:courseId/update', validate(updateCourseSchema),AdminController.updateCourse);

// Class Management
router.post('/classes/create', validate(createClassSchema), AdminController.createClass);
router.get('/classes', validate(getClassesQuerySchema, 'query'), AdminController.getClasses);
router.get('/classes/:classId', validate(idParamSchema), AdminController.getClassDetail);
router.patch('/classes/:classId/update', validate(updateClassSchema), AdminController.updateClass);
router.put('/classes/:classId/schedule', validate(setClassScheduleSchema), AdminController.setClassSchedule);

// Enrollment Management
router.post('/classes/:classId/enroll', validate(idParamSchema, 'params'), validate(enrollStudentSchema), AdminController.enrollStudent);
router.patch('/classes/:classId/students/:studentId/drop', AdminController.dropStudent);
router.get('/classes/:classId/enrollments', AdminController.getClassEnrollments);

// Attendance Oversight
router.get('/attendance', validate(getAttendanceQuerySchema, 'query'), AdminController.getAttendanceRecords);
router.get('/attendance/:classId/report', AdminController.getAttendanceReport);

// Excuse Oversight
router.get('/excuse-letters', validate(getExcuseLettersQuerySchema, 'query'), AdminController.getExcuseLetters);
router.patch('/excuse-letters/:excuseId/review', validate(reviewExcuseLetterSchema) ,AdminController.reviewExcuseLetter);

// Audit Logs
router.get('/audit-logs', validate(getAuditLogsQuerySchema, 'query'), AdminController.getAuditLogs);

// Notifications
router.get('/notifications', validate(paginationQuerySchema, 'query'), AdminController.getNotifications);
router.patch('/notifications/:notificationId/read', AdminController.markNotificationAsRead);

// RFID
router.patch('/students/:userId/rfid/revoke', AdminController.revokeRfid);
router.get('/rfid/requests', validate(getRfidRequestsQuerySchema, 'query'), AdminController.getRfidRequests);
router.patch('/rfid/requests/:requestId/reject', validate(rejectRfidRequestSchema), AdminController.rejectRfidRequest);

// Device Management
router.post('/devices', validate(registerDeviceSchema), AdminController.registerDevice);
router.get('/devices', AdminController.getDevices);
router.patch('/devices/:deviceId/revoke', validate(deviceIdParamSchema, 'params'), validate(revokeDeviceSchema), AdminController.revokeDevice);

export default router;