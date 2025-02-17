-- CreateTable
CREATE TABLE "jwtaccesstokenadmins" (
    "id" TEXT NOT NULL,
    "idAdmin" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredIn" TIMESTAMP(3),

    CONSTRAINT "jwtaccesstokenadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwtaccesstokenusers" (
    "id" TEXT NOT NULL,
    "idUser" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredIn" TIMESTAMP(3),

    CONSTRAINT "jwtaccesstokenusers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jwtaccesstokenadmins_idAdmin_key" ON "jwtaccesstokenadmins"("idAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "jwtaccesstokenusers_idUser_key" ON "jwtaccesstokenusers"("idUser");

-- AddForeignKey
ALTER TABLE "jwtaccesstokenadmins" ADD CONSTRAINT "jwtaccesstokenadmins_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jwtaccesstokenusers" ADD CONSTRAINT "jwtaccesstokenusers_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
