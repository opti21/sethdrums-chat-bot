/*
  Warnings:

  - You are about to drop the column `queueId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `RequestTag` table. All the data in the column will be lost.
  - Added the required column `notes` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_queueId_fkey`;

-- DropForeignKey
ALTER TABLE `RequestTag` DROP FOREIGN KEY `RequestTag_requestId_fkey`;

-- AlterTable
ALTER TABLE `Request` DROP COLUMN `queueId`,
    ADD COLUMN `queue_id` INTEGER NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `RequestTag` DROP COLUMN `requestId`;

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `notes` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TagsOnRequests` (
    `request_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`request_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagsOnVideos` (
    `video_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`video_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_queue_id_fkey` FOREIGN KEY (`queue_id`) REFERENCES `Queue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnRequests` ADD CONSTRAINT `TagsOnRequests_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `Request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnRequests` ADD CONSTRAINT `TagsOnRequests_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `RequestTag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnVideos` ADD CONSTRAINT `TagsOnVideos_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnVideos` ADD CONSTRAINT `TagsOnVideos_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `VideoTag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
