/*
  Warnings:

  - Added the required column `idAdmin` to the `acticitylogs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "acticitylogs" ADD COLUMN     "idAdmin" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "acticitylogs" ADD CONSTRAINT "acticitylogs_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
