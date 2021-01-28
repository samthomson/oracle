/*
  Warnings:

  - Added the required column `nomicsId` to the `Currency` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Currency` ADD COLUMN     `nomicsId` VARCHAR(191) NOT NULL;
