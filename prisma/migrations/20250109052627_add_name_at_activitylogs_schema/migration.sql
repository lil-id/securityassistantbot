-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_idUser_fkey";

-- AlterTable
ALTER TABLE "adminacticitylogs" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "name" TEXT,
ALTER COLUMN "idUser" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "useracticitylogs" ADD COLUMN     "name" TEXT;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
