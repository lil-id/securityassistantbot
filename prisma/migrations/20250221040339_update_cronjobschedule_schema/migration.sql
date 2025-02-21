/*
  Warnings:

  - You are about to drop the column `hour` on the `cronjobsschedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cronjobsschedule" DROP COLUMN "hour",
ADD COLUMN     "hourMinute" TEXT;
