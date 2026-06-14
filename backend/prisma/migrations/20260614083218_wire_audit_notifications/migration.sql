/*
  Warnings:

  - The values [RFID_DEACTIVATED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('MANUAL_ATTENDANCE', 'ATTENDANCE_OVERRIDE', 'EXCUSE_APPROVED', 'EXCUSE_REJECTED', 'SESSION_OPENED', 'SESSION_CLOSED', 'SESSION_CANCELLED', 'ENROLLMENT_DROPPED', 'RFID_REVOKED', 'RFID_REQUEST_REJECTED', 'USER_STATUS_CHANGED');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'RFID_CARD_REVOKED';
ALTER TYPE "NotificationType" ADD VALUE 'RFID_REQUEST_REJECTED';

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" SET DATA TYPE TEXT USING "entity_id"::text;
