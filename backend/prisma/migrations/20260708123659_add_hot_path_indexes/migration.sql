-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_class_id_status_idx" ON "attendance_sessions"("class_id", "status");

-- CreateIndex
CREATE INDEX "attendance_sessions_device_id_status_idx" ON "attendance_sessions"("device_id", "status");

-- CreateIndex
CREATE INDEX "class_enrollments_student_id_idx" ON "class_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "classes_professor_id_idx" ON "classes"("professor_id");

-- CreateIndex
CREATE INDEX "excuse_dates_attendance_id_idx" ON "excuse_dates"("attendance_id");

-- CreateIndex
CREATE INDEX "excuse_letters_student_id_idx" ON "excuse_letters"("student_id");
