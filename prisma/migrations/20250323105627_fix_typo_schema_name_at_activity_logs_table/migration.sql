/*
  Warnings:

  - You are about to drop the `adminacticitylogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `useracticitylogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "adminacticitylogs" DROP CONSTRAINT "adminacticitylogs_idAdmin_fkey";

-- DropForeignKey
ALTER TABLE "useracticitylogs" DROP CONSTRAINT "useracticitylogs_idUser_fkey";

-- DropTable
DROP TABLE "adminacticitylogs";

-- DropTable
DROP TABLE "useracticitylogs";

-- CreateTable
CREATE TABLE "adminactivitylogs" (
    "id" SERIAL NOT NULL,
    "idAdmin" INTEGER,
    "name" TEXT,
    "activity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adminactivitylogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "useractivitylogs" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER,
    "name" TEXT,
    "activity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "useractivitylogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "adminactivitylogs" ADD CONSTRAINT "adminactivitylogs_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "useractivitylogs" ADD CONSTRAINT "useractivitylogs_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
