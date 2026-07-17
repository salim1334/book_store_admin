-- AlterTable
ALTER TABLE `books` ADD COLUMN `swipeDirection` ENUM('RTL', 'LTR') NOT NULL DEFAULT 'RTL';

-- AlterTable
ALTER TABLE `chapter_pages` ADD COLUMN `swipeDirection` ENUM('RTL', 'LTR') NOT NULL DEFAULT 'RTL';

-- AlterTable
ALTER TABLE `chapter_texts` ADD COLUMN `swipeDirection` ENUM('RTL', 'LTR') NOT NULL DEFAULT 'RTL';
