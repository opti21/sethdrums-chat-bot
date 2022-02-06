-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "region_blocked" DROP NOT NULL,
ALTER COLUMN "embed_blocked" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;
