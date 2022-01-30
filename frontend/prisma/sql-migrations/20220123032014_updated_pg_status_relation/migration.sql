/*
  Warnings:

  - You are about to alter the column `video_id` on the `PG_Status` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `PG_Status` DROP FOREIGN KEY `PG_Status_video_id_fkey`;

-- AlterTable
ALTER TABLE `PG_Status` MODIFY `video_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `PG_Status` ADD CONSTRAINT `PG_Status_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
