-- AlterTable
ALTER TABLE `Queue` MODIFY `being_updated_by` VARCHAR(191) NULL,
    MODIFY `order` VARCHAR(191) NOT NULL DEFAULT '';
