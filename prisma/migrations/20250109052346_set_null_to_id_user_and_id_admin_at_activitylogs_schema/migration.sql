-- DropForeignKey
ALTER TABLE "adminacticitylogs" DROP CONSTRAINT "adminacticitylogs_idAdmin_fkey";

-- DropForeignKey
ALTER TABLE "useracticitylogs" DROP CONSTRAINT "useracticitylogs_idUser_fkey";

-- AlterTable
ALTER TABLE "adminacticitylogs" ALTER COLUMN "idAdmin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "useracticitylogs" ALTER COLUMN "idUser" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "adminacticitylogs" ADD CONSTRAINT "adminacticitylogs_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "useracticitylogs" ADD CONSTRAINT "useracticitylogs_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
