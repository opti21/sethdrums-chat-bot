/*
  Warnings:

  - You are about to drop the column `videoId` on the `PG_Status` table. All the data in the column will be lost.
  - You are about to drop the column `queueId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `requestedBy` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `embedBlocked` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `regionBlocked` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `Video` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[video_id]` on the table `PG_Status` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[video_id]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[video_id]` on the table `Video` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `video_id` to the `PG_Status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_by` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_id` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `embed_blocked` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_blocked` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_id` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `PG_Status` DROP FOREIGN KEY `PG_Status_videoId_fkey`;

-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_queueId_fkey`;

-- DropForeignKey
ALTER TABLE `Request` DROP FOREIGN KEY `Request_videoId_fkey`;

-- DropIndex
DROP INDEX `Video_videoId_key` ON `Video`;

-- AlterTable
ALTER TABLE `PG_Status` DROP COLUMN `videoId`,
    ADD COLUMN `video_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Request` DROP COLUMN `queueId`,
    DROP COLUMN `requestedBy`,
    DROP COLUMN `videoId`,
    ADD COLUMN `queue_id` INTEGER NULL,
    ADD COLUMN `requested_by` VARCHAR(191) NOT NULL,
    ADD COLUMN `video_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Video` DROP COLUMN `embedBlocked`,
    DROP COLUMN `regionBlocked`,
    DROP COLUMN `videoId`,
    ADD COLUMN `embed_blocked` BOOLEAN NOT NULL,
    ADD COLUMN `region_blocked` BOOLEAN NOT NULL,
    ADD COLUMN `video_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PG_Status_video_id_key` ON `PG_Status`(`video_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Request_video_id_key` ON `Request`(`video_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Video_video_id_key` ON `Video`(`video_id`);

-- AddForeignKey
ALTER TABLE `PG_Status` ADD CONSTRAINT `PG_Status_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`video_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_queue_id_fkey` FOREIGN KEY (`queue_id`) REFERENCES `Queue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
