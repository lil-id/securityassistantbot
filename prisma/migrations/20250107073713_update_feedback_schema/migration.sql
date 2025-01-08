/*
  Warnings:

  - You are about to drop the column `report` on the `feedbacks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "report",
ADD COLUMN     "feedback" TEXT;
