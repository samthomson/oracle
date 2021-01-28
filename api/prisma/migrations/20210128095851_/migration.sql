/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[nomicsId]` on the table `Currency`. If there are existing duplicate values, the migration will fail.

*/
-- DropIndex
DROP INDEX `Currency.symbol_unique` ON `Currency`;

-- CreateIndex
CREATE UNIQUE INDEX `Currency.nomicsId_unique` ON `Currency`(`nomicsId`);
