-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_idUser_fkey";

-- AlterTable
ALTER TABLE "reports" ALTER COLUMN "idUser" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
