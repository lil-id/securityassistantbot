/*
  Warnings:

  - A unique constraint covering the columns `[numberPhone]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numberPhone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `numberPhone` on table `admins` required. This step will fail if there are existing NULL values in that column.
  - Made the column `numberPhone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "numberPhone" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "numberPhone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_numberPhone_key" ON "admins"("numberPhone");

-- CreateIndex
CREATE UNIQUE INDEX "users_numberPhone_key" ON "users"("numberPhone");
