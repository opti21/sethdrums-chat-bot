/*
  Warnings:

  - You are about to alter the column `video_id` on the `Request` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_video_id_fkey`;

-- AlterTable
ALTER TABLE `Request` MODIFY `video_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
