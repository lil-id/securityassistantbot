-- CreateTable
CREATE TABLE "cronjobsschedule" (
    "id" SERIAL NOT NULL,
    "hour" TEXT,
    "dayOfMonth" TEXT,
    "dayOfWeek" TEXT,
    "month" TEXT,

    CONSTRAINT "cronjobsschedule_pkey" PRIMARY KEY ("id")
);
