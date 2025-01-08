/*
  Warnings:

  - You are about to drop the `acticitylogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "acticitylogs" DROP CONSTRAINT "acticitylogs_idAdmin_fkey";

-- DropForeignKey
ALTER TABLE "acticitylogs" DROP CONSTRAINT "acticitylogs_idUser_fkey";

-- DropTable
DROP TABLE "acticitylogs";

-- CreateTable
CREATE TABLE "adminacticitylogs" (
    "id" SERIAL NOT NULL,
    "idAdmin" INTEGER NOT NULL,
    "activity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adminacticitylogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "useracticitylogs" (
    "id" SERIAL NOT NULL,
    "idUser" INTEGER NOT NULL,
    "activity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "useracticitylogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "adminacticitylogs" ADD CONSTRAINT "adminacticitylogs_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "useracticitylogs" ADD CONSTRAINT "useracticitylogs_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
