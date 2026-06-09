# Backend API Contract — Reference

Mapped directly from the backend source (`routes/ → controllers/ → services/ → Prisma`)
on **2026-06-01**. This is the source of truth for defining frontend Zod schemas
(see [`react-mental-model.md`](./react-mental-model.md), Step 0/1).

> ⚠️ Shapes reflect what the code **actually returns** (Prisma `select`/`omit`), not what
> it "should" return. Where the backend is inconsistent or buggy, it's flagged in
> **[Quirks & gotchas](#quirks--gotchas)** at the bottom — read that section before building.

---

## Global conventions

**Base URL:** `http://localhost:3000` (no `/api` prefix). Routers mount at `/auth`,
`/student`, `/professor`, `/admin`.

**Success envelope:**
```jsonc
{ "success": true, "message": "string", "data": <payload> }
```
`data` is sometimes **omitted entirely** on success (see quirks). Some write endpoints
return no `data` at all (just `success` + `message`).

**Error envelope:**
```jsonc
{ "success": false, "message": "string", "code": "ERROR_CODE" }   // AppError
{ "success": false, "message": "Validation failed", "errors": [{ "field": "x", "message": "y" }] } // Zod
```

**Auth:** send `Authorization: Bearer <accessToken>`. Role routers guard every route:
`/student/*` → STUDENT, `/professor/*` → PROFESSOR, `/admin/*` → ADMIN.

**Date/time serialization (important):**
- `DateTime` fields → ISO strings (`"2026-06-01T08:30:00.000Z"`).
- `@db.Time` fields (`startTime`, `endTime` on schedules/sessions) → full ISO timestamps
  **anchored to `1970-01-01`** (e.g. `"1970-01-01T08:00:00.000Z"`) — only the time part is meaningful.
- `@db.Date` (`sessionDate`) → ISO at midnight UTC.
- `dayOfWeek` is an **array of ints** `0–6` (`Int[]`), not a single value.

---

## Enums

```ts
UserType        = 'STUDENT' | 'PROFESSOR' | 'ADMIN'
UserStatus      = 'ACTIVE' | 'INACTIVE'
RfidStatus      = 'ACTIVE' | 'INACTIVE'
VerificationStatus = 'UNVERIFIED' | 'RFID_VERIFIED'
Semester        = 'FIRST' | 'SECOND' | 'THIRD' | 'SUMMER'
ClassStatus     = 'ACTIVE' | 'INACTIVE'
EnrollmentStatus= 'ENROLLED' | 'DROPPED'
AttendanceSessionStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
AttendanceStatus= 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'
ExcuseType      = 'MEDICAL' | 'EMERGENCY' | 'SCHOOL_BUSINESS' | 'PERSONAL' | 'OTHERS'
ExcuseStatus    = 'PENDING' | 'APPROVED' | 'REJECTED'
NotificationType= 'ABSENCE_ALERT' | 'EXCUSE_SUBMITTED' | 'EXCUSE_APPROVED'
                | 'EXCUSE_REJECTED' | 'SESSION_OPENED' | 'SESSION_CANCELLED' | 'ENROLLMENT_DROPPED'
AuditAction     = 'MANUAL_ATTENDANCE' | 'ATTENDANCE_OVERRIDE' | 'EXCUSE_APPROVED'
                | 'EXCUSE_REJECTED' | 'SESSION_OPENED' | 'SESSION_CLOSED' | 'SESSION_CANCELLED'
                | 'ENROLLMENT_DROPPED' | 'RFID_DEACTIVATED' | 'USER_STATUS_CHANGED'
```

---

# AUTH  (`/auth`) — public

### `POST /auth/login`
**Body:** `{ identifier: string, password: string }`
(`identifier` = studentNumber | employeeNumber | username, resolved in that order)

**200 `data`:**
```ts
{
  tokens: { accessToken: string; refreshToken: string };
  user:   { id: string; type: UserType; status: UserStatus };
}
```
**Errors:** `400` missing fields (no `code`) · `401 INVALID_CREDENTIALS` · `403 ACCOUNT_DEACTIVATED`
> Note: login `user` only carries `id/type/status` — **no name/email**. Fetch the full profile after login via the role's `/profile` endpoint.

### `POST /auth/refresh-token`
**Body:** `{ refreshToken: string }`
**200 `data`:** `{ accessToken: string; refreshToken: string }`
**Errors:** `400` missing · `401` invalid token type

### `POST /auth/change-password`
🚧 **Not implemented** — handler is an empty stub, returns nothing. Don't wire this yet.

---

# STUDENT  (`/student`) — Bearer + STUDENT

### `GET /student/profile`
**200 `data`:**
```ts
{
  studentNumber: string; rfidNumber: string | null; registeredAt: string;
  rfidStatus: RfidStatus; rfidDeactivatedAt: string | null;
  yearLevel: number; program: string; section: string; department: string | null;
  verificationStatus: VerificationStatus;
  user: { id: string; username: string; email: string; name: string;
          type: UserType; status: UserStatus; profileImage: string | null };
}
```

### `PATCH /student/profile`
**Body** (`updateProfileSchema`): `{ name?, email?, username?, password (required = current pw), newPassword? }`
**200:** `{ success, message }` — **no `data`**.
> ⚠️ No file-upload middleware on this route, so `profileImage` can't actually be set here.

### `PATCH /student/rfid/register`
**Body** (`registerRfidSchema`): `{ rfidNumber: string }` (hex chars only)
**200 `data`:** `{ rfidNumber: string; rfidStatus: RfidStatus; verificationStatus: VerificationStatus; registeredAt: string }`
**Errors:** `404 STUDENT_NOT_FOUND` · `400 RFID_ALREADY_REGISTERED` · `400 RFID_IN_USE`

### `GET /student/classes`
**200 `data`:** `ClassEnrollment[]`
```ts
{
  enrollmentDate: string; status: EnrollmentStatus; droppedDate: string | null;
  class: {
    id: string; section: string; schoolYear: string; semester: Semester;
    room: string | null; status: ClassStatus;
    course: { id: string; courseCode: string; courseName: string;
              courseDescription: string | null; units: number };
    professor: { id: string; name: string; profileImage: string | null };
    classSchedules: { id: string; dayOfWeek: number[]; startTime: string; endTime: string }[];
  };
}[]
```
### `GET /student/classes/schedule`
**200 `data`:** `ClassSchedule[]`
```ts
{
  id: string; dayOfWeek: number[]; startTime: string; endTime: string;
  class: {
    id: string; section: string; schoolYear: string; semester: Semester;
    room: string | null; status: ClassStatus;
    course: { id: string; courseCode: string; courseName: string;
              courseDescription: string | null; units: number };
    professor: { id: string; name: string; profileImage: string | null };
  };
}[]
```
### `GET /student/attendance`  · query: `classId?`, `startDate?`, `endDate?`
**200 `data`:** `AttendanceRecord[]` (returns `[]` when empty)
```ts
{
  sessionId: string; timeIn: string | null; status: AttendanceStatus;
  isManual: boolean; recordedBy: string | null; remarks: string | null;
  session: {
    classId: string; sessionDate: string; startTime: string; endTime: string;
    status: AttendanceSessionStatus; openedAt: string | null; closedAt: string | null;
    cancelledBy: string | null; cancelledAt: string | null;
    class: { /* same class shape as above, with course + professor{id,name,profileImage} */ };
  };
}[]
```

### `GET /student/attendance/summary`
**`data`:** `{ present: number; late: number; absent: number; excused: number }`

### `GET /student/attendance/absences`  · query: `startDate` & `endDate` (**required**)
**200 `data`:**
```ts
{
  id: string; status: AttendanceStatus;
  session: {
    id: string; sessionDate: string; startTime: string; endTime: string;
    schedule: { class: {
      section: string; schoolYear: string; semester: Semester; room: string | null;
      professor: { id: string; name: string };
      course: { id: string; courseCode: string; courseName: string; units: number };
    }};
  };
}[]
```
**Errors:** `400` if dates missing.

### `GET /student/excuse-letters`
**200 `data`:**
```ts
{
  id: string; excuseType: ExcuseType; description: string; submittedAt: string;
  status: ExcuseStatus;
  excuseDates: { attendanceRecord: { session: { class: {
    course: { courseCode: string; courseName: string };
  }}}}[];
  _count: { attachments: number };
}[]
```

### `GET /student/excuse-letters/:excuseId`
**200 `data`:**
```ts
{
  id: string; excuseType: ExcuseType; description: string; submittedAt: string;
  status: ExcuseStatus; approvedBy: string | null; approvalDate: string | null;
  rejectionReason: string | null; approvedByUser: { name: string } | null;
  excuseDates: { attendanceRecord: {
    id: string; timeIn: string | null; status: AttendanceStatus;
    session: { sessionDate: string; startTime: string; endTime: string; class: {
      section: string; schoolYear: string; semester: Semester; room: string | null; status: ClassStatus;
      course: { courseCode: string; courseName: string; courseDescription: string | null; units: number };
      professor: { name: string };
    }};
  }}[];
  attachments: { fileName: string; fileType: string; fileSize: number }[];
}
```
**Errors:** `404 EXCUSE_NOT_FOUND`

### `POST /student/excuse-letters/submit`
**Body** (`submitExcuseLetterSchema`): `{ excuseType: ExcuseType; description: string; attendanceRecordIds: string[] }`
**201:** `{ success, message }` — **no `data`**.
**Errors:** `400 BAD_REQUEST` / `400 INVALID_ATTENDANCE_STATUS` (only ABSENT/LATE excusable; no existing excuse)

### `POST /student/excuse-letters/:excuseId/attachments`
**multipart/form-data**, field **`files`** (≤5; JPEG ≤5MB or PDF ≤10MB)
**201:** `{ success, message }` — **no `data`**.
**Errors:** `400` no files · `404 EXCUSE_NOT_FOUND` · `400 EXCUSE_ALREADY_PROCESSED`

### `GET /student/notifications`
**200 `data`:** `Notification[]`
```ts
{ id: string; userId: string; type: NotificationType; title: string; message: string;
  isRead: boolean; readAt: string | null; metadata: unknown | null; createdAt: string }[]
```

### `PATCH /student/notifications/:notificationId/read`
**200 `data`:** the updated `Notification` (full shape above).

---

# PROFESSOR  (`/professor`) — Bearer + PROFESSOR

### `GET /professor/profile`
**200 `data`:**
```ts
{
  employeeNumber: string; department: string; position: string;
  user: { id: string; name: string; email: string; username: string;
          type: UserType; status: UserStatus; profileImage: string | null };
}
```

### `PATCH /professor/profile`
**multipart/form-data**, file field **`profile-image`** (JPEG, ≤5MB). Body: `{ name?, email?, username?, password (current), newPassword? }`
**200:** `{ success, message }` — **no `data`**.
> Note the field name is `profile-image` (hyphen) on this route.

### `GET /professor/classes`
**200 `data`:**
```ts
{
  id: string; section: string; schoolYear: string; semester: Semester;
  room: string | null; status: ClassStatus;
  course: { id: string; courseCode: string; courseName: string;
            courseDescription: string | null; units: number };
  classSchedules: { dayOfWeek: number[]; startTime: string; endTime: string }[];
  _count: { classEnrollments: number };   // enrolled count only
}[]
```

### `GET /professor/classes/schedule`
**200 `data`:**
```ts
{
  dayOfWeek: number[]; startTime: string; endTime: string;
  class: { section: string; schoolYear: string; semester: Semester;
           room: string | null; status: ClassStatus;
           course: { courseCode: string; courseName: string } };
}[]
```

### `GET /professor/classes/:classId/roster`
**200 `data`:**
```ts
{ enrollmentDate: string; status: EnrollmentStatus; droppedDate: string | null;
  student: { id: string; name: string; email: string } }[]
```
**Errors:** `404 NOT_FOUND` (class not owned by professor)

### `GET /professor/classes/:classId/session`
**200 `data`:**
```ts
{ id: string; classId: string; scheduleId: string; sessionDate: string;
  startTime: string; endTime: string; status: AttendanceSessionStatus;
  openedAt: string | null; closedAt: string | null;
  cancelledBy: string | null; cancelledAt: string | null;
  _count: { attendanceRecords: number } }[]
```

### `GET /professor/classes/:classId/report`
**200 `data`:**
```ts
{
  class: { id: string; courseCode: string; courseName: string;
           section: string; schoolYear: string; semester: Semester };
  students: { studentId: string; studentName: string; studentNumber: string | undefined;
              totalSessions: number; present: number; late: number;
              absent: number; excused: number }[];
}
```

### `POST /professor/sessions`
**Body:** `{ classId: string; scheduleId: string }`
**201:** `{ success, message }` — **no `data`**.
**Errors:** `404 NOT_FOUND` · `400 INVALID_REQUEST` (a session is already OPEN)

### `PATCH /professor/sessions/:sessionId/close`  → 200, no `data`
### `PATCH /professor/sessions/:sessionId/cancel` → 200, no `data`

### `GET /professor/sessions/:sessionId/attendance`
**200 `data`:**
```ts
{ id: string; sessionId: string; studentId: string; timeIn: string | null;
  status: AttendanceStatus; isManual: boolean; recordedBy: string | null;
  remarks: string | null; student: { name: string } }[]
```

### `PATCH /professor/sessions/attendance/:recordId`
**Body:** `{ status: AttendanceStatus; remarks?: string }` (status required, validated in controller)
**200:** `{ success, message }` — **no `data`**.

### `GET /professor/excuse-letters`  · query: `classId?`
**200 `data`:**
```ts
{
  id: string; studentId: string; excuseType: ExcuseType; description: string;
  submittedAt: string; status: ExcuseStatus; approvedBy: string | null;
  approvalDate: string | null; rejectionReason: string | null;
  student: { name: string };
  excuseDates: { /* attendanceRecord → session → class → course{id,courseCode,courseName} */ }[];
  attachments: ExcuseAttachment[];   // full rows: id, excuseId, fileName, fileType, fileSize, filePath, uploadedAt
}[]
```

### `GET /professor/excuse-letters/:excuseId`
**200 `data`:** like the list item above, but `student` = `{ id, name, email }`, plus
`approvedByUser: { name } | null`, and nested attendance/session/class/course detail.

### `PATCH /professor/excuse-letters/:excuseId/review`
**Body:** `{ status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }` (required if REJECTED)
**200 `data`:** the updated `ExcuseLetter` row (full).
**Errors:** `404 EXCUSE_NOT_FOUND` · `400 REJECTION_REASON_REQUIRED`. Approving flips the linked records to `EXCUSED`.

### `GET /professor/notifications` · `PATCH /professor/notifications/:notificationId/read`
Same shapes as the student notification endpoints.

---

# ADMIN  (`/admin`) — Bearer + ADMIN

### `POST /admin/users/create`
**Body:**
```ts
{
  username: string; password: string; email: string; name: string; type: UserType;
  studentData?:   { studentNumber: string; yearLevel: number; program: string;
                    section: string; department?: string };   // required if type=STUDENT
  professorData?: { employeeNumber: string; department: string; position: string }; // required if type=PROFESSOR
}
```
**201 `data`:** the created **`User` row** (with `password` omitted).
**Errors:** `400 USERNAME_EXISTS` / `EMAIL_EXISTS` / `STUDENT_NUMBER_EXISTS` / `EMPLOYEE_NUMBER_EXISTS` / `*_DATA_REQUIRED`

### `GET /admin/users`  · query: `type?`, `search?`
**200 `data`:**
```ts
{ id: string; username: string; email: string; name: string;
  type: UserType; status: UserStatus; profileImage: string | null; createdAt: string }[]
```

### `GET /admin/users/:userId`
**200 `data`:**
```ts
{
  id: string; username: string; email: string; name: string;
  type: UserType; status: UserStatus; profileImage: string | null;
  student:   StudentProfile | null;     // student fields minus id/userId/timestamps
  professor: ProfessorProfile | null;   // professor fields minus id/userId/timestamps
}
```
**Errors:** `404 USER_NOT_FOUND`

### `PATCH /admin/users/:userId`
**Body:** `{ name?, email?, username?, password? }`
**200 `data`:** `{ id, username, email, name, type, status, profileImage }`

### `PATCH /admin/users/:userId/deactivate`
**200 `data`:** `{ id, username, name, type, status }`
**Errors:** `404 USER_NOT_FOUND` · `400 ALREADY_DEACTIVATED`

### `PATCH /admin/users/students/:userId`
**Body:** `{ studentNumber?, rfidStatus?, yearLevel?, program?, section?, department? }`
**200 `data`:** full `Student` row.   **Errors:** `404 STUDENT_NOT_FOUND` · `400 STUDENT_NUMBER_EXISTS`

### `PATCH /admin/users/professors/:userId`
**Body:** `{ employeeNumber?, department?, position? }`
**200 `data`:** full `Professor` row.   **Errors:** `404 PROFESSOR_NOT_FOUND` · `400 EMPLOYEE_NUMBER_EXISTS`

### `GET /admin/students`  · query: `search?`, `program?`, `yearLevel?`, `section?`, `verificationStatus?`
**200 `data`:**
```ts
{ /* full Student fields */ id, userId, studentNumber, rfidNumber, registeredAt, rfidStatus,
  rfidDeactivatedAt, yearLevel, program, section, department, verificationStatus, createdAt, updatedAt,
  user: { id: string; name: string; email: string; status: UserStatus; profileImage: string | null } }[]
```

### `PATCH /admin/students/:userId/rfid/deactivate`
**200 `data`:** full `Student` row (rfid cleared).
**Errors:** `404 STUDENT_NOT_FOUND` · `400 RFID_ALREADY_DEACTIVATED`

### `GET /admin/professors`  · query: `search?`, `department?`
**200 `data`:**
```ts
{ id: string; employeeNumber: string; department: string; position: string;
  user: { id: string; name: string; email: string; status: UserStatus; profileImage: string | null } }[]
```

### `POST /admin/courses/create`
**Body** (`createCourseSchema`): `{ courseCode: string; courseName: string; courseDescription?: string; units: number }`
**201 `data`:** `{ id, courseCode, courseName, courseDescription, units }`
**Errors:** `400 COURSE_CODE_EXISTS`

### `GET /admin/courses`
**200 `data`:** `{ id, courseCode, courseName, courseDescription, units, _count: { classes: number } }[]`

### `GET /admin/courses/:courseId`
**200 `data`:**
```ts
{ id, courseCode, courseName, courseDescription, units;
  classes: { id, section, schoolYear, semester, room, status;
             professor: { name }; _count: { classEnrollments: number } }[] }
```
**Errors:** `404 COURSE_NOT_FOUND` · ⚠️ see quirk about the `idParamSchema` validator on this route.

### `PATCH /admin/courses/:courseId/update`
**Body:** `{ courseName?, courseDescription?, units? }`
**200 `data`:** `{ id, courseCode, courseName, courseDescription, units }`

### `POST /admin/classes/create`
**Body** (`createClassSchema`): `{ courseId, professorId, section, schoolYear, semester: Semester, room? }`
(`professorId` is a **User id**, not Professor id.)
**201 `data`:**
```ts
{ id, section, schoolYear, semester, room, status;
  course: { id, courseCode, courseName, courseDescription, units };
  professor: { id, name } }
```
**Errors:** `404 COURSE_NOT_FOUND` / `PROFESSOR_NOT_FOUND`

### `GET /admin/classes`  · query: `courseId?`, `professorId?`, `schoolYear?`, `semester?`, `status?`
**200 `data`:**
```ts
{ id, section, schoolYear, semester, room, status;
  course: { id, courseCode, courseName };
  professor: { id, name };
  _count: { classEnrollments: number } }[]
```

### `GET /admin/classes/:classId`
**200 `data`:**
```ts
{ id, section, schoolYear, semester, room, status;
  course: { id, courseCode, courseName, courseDescription, units };
  professor: { id, name, profileImage };
  classSchedules: { id, classId, dayOfWeek, startTime, endTime }[];
  classEnrollments: { enrollmentDate, status, droppedDate, studentId?,
                      student: { name, profileImage } }[]; }   // ENROLLED only
```
**Errors:** `404 CLASS_NOT_FOUND`

### `PATCH /admin/classes/:classId/update`
**Body:** `{ professorId?, section?, room?, status? }`
**200 `data`:** `{ id, section, schoolYear, semester, room, status; course{...}; professor{id,name} }`

### `PUT /admin/classes/:classId/schedule`
**Body** (`setClassScheduleSchema`):
```ts
{ schedules: { dayOfWeek: number[] /* 0-6, ≥1 */; startTime: 'HH:MM:SS'; endTime: 'HH:MM:SS' }[] }
```
(replaces all existing schedules for the class)
**200 `data`:** `{ id, classId, dayOfWeek, startTime, endTime }[]`

### `POST /admin/classes/:classId/enroll`
**Body:** `{ studentId: string }`  (a **User id**)
**201 `data`:** an enrollment — shape differs for new vs. re-enroll:
- new: `{ enrollmentDate, status, droppedDate; student: { id, name }; class: { ...; course: { courseCode, courseName } } }`
- re-enroll (was DROPPED): plain `ClassEnrollment` row.
**Errors:** `404 CLASS_NOT_FOUND` / `STUDENT_NOT_FOUND` · `400 ALREADY_ENROLLED`

### `PATCH /admin/classes/:classId/students/:studentId/drop`
**200 `data`:** updated `ClassEnrollment` (minus timestamps).
**Errors:** `404 ENROLLMENT_NOT_FOUND` · `400 ALREADY_DROPPED`

### `GET /admin/classes/:classId/enrollments`
**200 `data`:**
```ts
{ id, classId, enrollmentDate, status, droppedDate;
  student: { id, name, email, profileImage } }[]
```
**Errors:** `404 CLASS_NOT_FOUND`

### `GET /admin/attendance`  · query: `classId?`, `sessionId?`, `studentId?`, `startDate?`, `endDate?`
**200 `data`:**
```ts
{ id, timeIn, status, isManual, recordedBy, remarks;
  student: { id, name };
  session: { id, scheduleId, sessionDate, startTime, endTime, status,
             openedAt, closedAt, cancelledBy, cancelledAt;
             class: { id, section, schoolYear, semester, room, status;
                      course: { id, courseCode, courseName };
                      professor: { id, name } } } }[]
```

### `GET /admin/attendance/:classId/report`
**200 `data`:** same shape as the professor report (`{ class, students[] }`).

### `GET /admin/excuse-letters`  · query: `status?`, `studentId?`
**200 `data`:**
```ts
{ id, excuseType, description, submittedAt, status, approvedBy, approvalDate, rejectionReason;
  student: { id, name, profileImage };
  excuseDates: { attendanceRecord: { ...; session: { ...; class: { ...; course: { id, courseCode, courseName } } } } }[];
  attachments: ExcuseAttachment[];
  approvedByUser: { name } | null }[]
```

### `PATCH /admin/excuse-letters/:excuseId/review`
**Body** (`reviewExcuseLetterSchema`): `{ status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }`
**200 `data`:** updated `ExcuseLetter` (minus timestamps).
**Errors:** `404 EXCUSE_NOT_FOUND` · `400 EXCUSE_ALREADY_PROCESSED` · `400 REJECTION_REASON_REQUIRED`

### `GET /admin/audit-logs`  · query: `userId?`, `action?`, `startDate?`, `endDate?`
**200 `data`:**
```ts
{ id, userId, action: AuditAction, entityType, entityId, description,
  oldValue, newValue, ipAddress, createdAt;
  user: { name, type } }[]
```

### `GET /admin/notifications` · `PATCH /admin/notifications/:notificationId/read`
Same shapes as student/professor notifications.

---

## Quirks & gotchas

These are real inconsistencies in the current backend. Plan the frontend defensively
(our Zod parsing in the api layer is exactly where we absorb these).

1. **Time fields are `1970-01-01T..` timestamps.** Format with a time-only formatter; ignore the date part of `startTime`/`endTime`.

2. **`idParamSchema` on some admin GETs validates the `body`** (default source) for a
   `classId` field — on `GET /courses/:courseId` and `GET /classes/:classId` this may
   reject requests since there's no body. If you hit unexpected validation errors on those
   GETs, this is why — flag to backend.

3. **IDs are User ids, not profile ids.** `professorId`/`studentId` in class/enrollment
   payloads reference `User.id`. Use the `user`-derived ids consistently.

4. **`change-password` is a stub** — no behavior.
```
