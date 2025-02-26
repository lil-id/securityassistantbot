/*
  Warnings:

  - You are about to drop the `feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_idUser_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_idUser_fkey";

-- DropTable
DROP TABLE "feedbacks";

-- DropTable
DROP TABLE "reports";

-- CreateTable
CREATE TABLE "reportusers" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER,
    "name" TEXT,
    "evidence" TEXT,
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportusers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportadmins" (
    "id" SERIAL NOT NULL,
    "idAdmin" INTEGER,
    "name" TEXT,
    "evidence" TEXT,
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbackusers" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER,
    "name" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbackusers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbackadmins" (
    "id" SERIAL NOT NULL,
    "idAdmin" INTEGER,
    "name" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbackadmins_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reportusers" ADD CONSTRAINT "reportusers_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportadmins" ADD CONSTRAINT "reportadmins_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbackusers" ADD CONSTRAINT "feedbackusers_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbackadmins" ADD CONSTRAINT "feedbackadmins_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
