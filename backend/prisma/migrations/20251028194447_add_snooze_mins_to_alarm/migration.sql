-- AlterTable
ALTER TABLE "Alarm" ADD COLUMN     "cronExpr" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "snoozeMins" INTEGER NOT NULL DEFAULT 5;
