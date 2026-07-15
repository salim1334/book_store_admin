/*
  Warnings:

  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `inviteExpiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `inviteToken` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `users_googleId_key` ON `users`;

-- DropIndex
DROP INDEX `users_inviteToken_key` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `googleId`,
    DROP COLUMN `inviteExpiry`,
    DROP COLUMN `inviteToken`;
