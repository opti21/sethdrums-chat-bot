-- CreateTable
CREATE TABLE `Request` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requested_by` VARCHAR(191) NOT NULL,
    `video_id` INTEGER NOT NULL,
    `queue_id` INTEGER NULL DEFAULT 2,
    `played` BOOLEAN NOT NULL DEFAULT false,
    `played_at` DATETIME(3) NULL,
    `priority` BOOLEAN NOT NULL DEFAULT false,
    `requested_by_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagsOnRequests` (
    `request_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`request_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PG_Status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `video_id` INTEGER NOT NULL,
    `status` ENUM('NOT_CHECKED', 'BEING_CHECKED', 'PG', 'NON_PG') NOT NULL DEFAULT 'NOT_CHECKED',
    `checker` VARCHAR(191) NULL,
    `timestamp` INTEGER NULL,
    `previous_status` VARCHAR(191) NULL,
    `previous_checker` VARCHAR(191) NULL,

    UNIQUE INDEX `PG_Status_video_id_key`(`video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Video` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `youtube_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `region_blocked` BOOLEAN NULL,
    `embed_blocked` BOOLEAN NULL,
    `duration` INTEGER NULL,
    `notes` VARCHAR(1000) NOT NULL DEFAULT '',
    `banned` BOOLEAN NOT NULL DEFAULT false,
    `thumbnail` VARCHAR(191) NOT NULL,
    `banned_by` VARCHAR(191) NULL,
    `banned_time` DATETIME(3) NULL,

    UNIQUE INDEX `Video_youtube_id_key`(`youtube_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagsOnVideos` (
    `video_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`video_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mod` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `twitch_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
