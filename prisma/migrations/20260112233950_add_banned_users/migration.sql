-- CreateTable
CREATE TABLE "BannedUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "twitch_id" TEXT NOT NULL,
    "twitch_username" TEXT NOT NULL,
    "reason" TEXT,
    "banned_by" TEXT NOT NULL,
    "banned_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedUser_twitch_id_key" ON "BannedUser"("twitch_id");
