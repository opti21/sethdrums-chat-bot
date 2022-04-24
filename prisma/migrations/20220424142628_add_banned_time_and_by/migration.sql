-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "banned_by" TEXT,
ADD COLUMN     "banned_time" TIMESTAMP(3);
