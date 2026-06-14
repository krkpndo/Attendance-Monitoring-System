-- CreateEnum
CREATE TYPE "RfidRequestType" AS ENUM ('LOST', 'DAMAGED', 'NEW');

-- CreateEnum
CREATE TYPE "RfidRequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'REJECTED');

-- CreateTable
CREATE TABLE "rfid_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "RfidRequestType" NOT NULL,
    "status" "RfidRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfid_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rfid_requests_student_id_idx" ON "rfid_requests"("student_id");

-- CreateIndex
CREATE INDEX "rfid_requests_status_idx" ON "rfid_requests"("status");

-- AddForeignKey
ALTER TABLE "rfid_requests" ADD CONSTRAINT "rfid_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_requests" ADD CONSTRAINT "rfid_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
