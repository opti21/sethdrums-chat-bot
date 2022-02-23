/*
  Warnings:

  - You are about to drop the `Mod` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `thumbnail` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_mod" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- DropTable
DROP TABLE "Mod";
