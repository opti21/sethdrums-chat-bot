/*
  Warnings:

  - You are about to alter the column `status` on the `PG_Status` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum("PG_Status_status")`.
  - You are about to drop the column `queue_id` on the `Request` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_queue_id_fkey`;

-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_video_id_fkey`;

-- AlterTable
ALTER TABLE `PG_Status` MODIFY `status` ENUM('NOT_CHECKED', 'BEING_CHECKED', 'PG', 'NON_PG') NOT NULL DEFAULT 'NOT_CHECKED';

-- AlterTable
ALTER TABLE `Request` DROP COLUMN `queue_id`,
    ADD COLUMN `queueId` INTEGER NULL,
    MODIFY `video_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `VideoTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `requestId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`video_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `Queue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestTag` ADD CONSTRAINT `RequestTag_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `Request`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
