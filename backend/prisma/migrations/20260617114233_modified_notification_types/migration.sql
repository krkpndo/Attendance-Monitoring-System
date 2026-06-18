/*
  Warnings:

  - The values [ABSENCE_ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ATTENDANCE_ALERT', 'EXCUSE_SUBMITTED', 'EXCUSE_APPROVED', 'EXCUSE_REJECTED', 'SESSION_OPENED', 'SESSION_CANCELLED', 'ENROLLMENT_DROPPED', 'RFID_CARD_REVOKED', 'RFID_REQUEST_SUBMITTED', 'RFID_REQUEST_REJECTED', 'CLASS_ASSIGNED', 'SCHEDULE_CHANGED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
