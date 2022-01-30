-- CreateTable
CREATE TABLE `Video` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `videoId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `regionBlocked` BOOLEAN NOT NULL,
    `embedBlocked` BOOLEAN NOT NULL,
    `Duration` INTEGER NOT NULL,

    UNIQUE INDEX `Video_videoId_key`(`videoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PG_Status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `videoId` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `checker` VARCHAR(191) NULL,
    `timestamp` INTEGER NULL,

    UNIQUE INDEX `PG_Status_videoId_key`(`videoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Request` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestedBy` VARCHAR(191) NOT NULL,
    `videoId` INTEGER NOT NULL,
    `queueId` INTEGER NULL,

    UNIQUE INDEX `Request_videoId_key`(`videoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Queue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `Queue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
