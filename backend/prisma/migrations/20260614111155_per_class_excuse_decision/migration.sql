/*
  Warnings:

  - You are about to drop the column `approval_date` on the `excuse_letters` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by` on the `excuse_letters` table. All the data in the column will be lost.
  - You are about to drop the column `rejection_reason` on the `excuse_letters` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `excuse_letters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "excuse_letters" DROP CONSTRAINT "excuse_letters_approved_by_fkey";

-- AlterTable
ALTER TABLE "excuse_dates" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "status" "ExcuseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "excuse_letters" DROP COLUMN "approval_date",
DROP COLUMN "approved_by",
DROP COLUMN "rejection_reason",
DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "excuse_dates_status_idx" ON "excuse_dates"("status");

-- AddForeignKey
ALTER TABLE "excuse_dates" ADD CONSTRAINT "excuse_dates_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
