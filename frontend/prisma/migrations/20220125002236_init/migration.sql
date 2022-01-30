-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_CHECKED', 'BEING_CHECKED', 'PG', 'NON_PG');

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "video_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "region_blocked" BOOLEAN NOT NULL,
    "embed_blocked" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PG_Status" (
    "id" SERIAL NOT NULL,
    "video_id" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT E'NOT_CHECKED',
    "checker" TEXT,
    "timestamp" INTEGER,

    CONSTRAINT "PG_Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "requested_by" TEXT NOT NULL,
    "video_id" INTEGER NOT NULL,
    "queue_id" INTEGER DEFAULT 2,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnRequests" (
    "request_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "TagsOnRequests_pkey" PRIMARY KEY ("request_id","tag_id")
);

-- CreateTable
CREATE TABLE "TagsOnVideos" (
    "video_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "TagsOnVideos_pkey" PRIMARY KEY ("video_id","tag_id")
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" SERIAL NOT NULL,
    "order" TEXT NOT NULL DEFAULT E'',
    "is_updating" BOOLEAN NOT NULL DEFAULT false,
    "being_updated_by" TEXT,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VideoTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RequestTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_video_id_key" ON "Video"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "PG_Status_video_id_key" ON "PG_Status"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "Request_video_id_key" ON "Request"("video_id");

-- AddForeignKey
ALTER TABLE "PG_Status" ADD CONSTRAINT "PG_Status_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "Queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnRequests" ADD CONSTRAINT "TagsOnRequests_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnRequests" ADD CONSTRAINT "TagsOnRequests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "RequestTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnVideos" ADD CONSTRAINT "TagsOnVideos_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnVideos" ADD CONSTRAINT "TagsOnVideos_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "VideoTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
