/*
  Warnings:

  - Added the required column `being_updated_by` to the `Queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Queue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Queue` ADD COLUMN `being_updated_by` VARCHAR(191) NOT NULL,
    ADD COLUMN `is_updating` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `order` VARCHAR(191) NOT NULL;
