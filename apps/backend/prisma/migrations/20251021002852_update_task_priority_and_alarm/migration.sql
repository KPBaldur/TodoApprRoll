/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "dueDate",
ADD COLUMN     "alarmId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
