/*
  Warnings:

  - You are about to drop the column `idRole` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `idRole` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_idRole_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_idRole_fkey";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "idRole",
ADD COLUMN     "role" "UserRoles" NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "idRole",
ADD COLUMN     "role" "UserRoles" NOT NULL DEFAULT 'user';

-- DropTable
DROP TABLE "role";
