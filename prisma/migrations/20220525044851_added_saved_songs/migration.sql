-- CreateTable
CREATE TABLE `SavedSongs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `twitch_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SavedSongs_twitch_id_key`(`twitch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SavedSongsToVideo` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_SavedSongsToVideo_AB_unique`(`A`, `B`),
    INDEX `_SavedSongsToVideo_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
