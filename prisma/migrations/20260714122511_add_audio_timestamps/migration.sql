-- AlterTable
ALTER TABLE `chapter_pages` ADD COLUMN `audioEndTime` DOUBLE NULL,
    ADD COLUMN `audioStartTime` DOUBLE NULL;

-- AlterTable
ALTER TABLE `chapter_texts` ADD COLUMN `audioEndTime` DOUBLE NULL,
    ADD COLUMN `audioStartTime` DOUBLE NULL;
