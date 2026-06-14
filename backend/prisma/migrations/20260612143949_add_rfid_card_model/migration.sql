/*
  Warnings:

  - You are about to drop the column `registered_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `rfid_deactivated_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `rfid_number` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `rfid_status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `verification_status` on the `students` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RfidCardStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- DropIndex
DROP INDEX "students_rfid_number_key";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "registered_at",
DROP COLUMN "rfid_deactivated_at",
DROP COLUMN "rfid_number",
DROP COLUMN "rfid_status",
DROP COLUMN "verification_status";

-- DropEnum
DROP TYPE "RfidStatus";

-- CreateTable
CREATE TABLE "rfid_cards" (
    "id" TEXT NOT NULL,
    "rfid_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "RfidCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,

    CONSTRAINT "rfid_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rfid_cards_rfid_number_key" ON "rfid_cards"("rfid_number");

-- CreateIndex
CREATE INDEX "rfid_cards_student_id_idx" ON "rfid_cards"("student_id");

-- AddForeignKey
ALTER TABLE "rfid_cards" ADD CONSTRAINT "rfid_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
