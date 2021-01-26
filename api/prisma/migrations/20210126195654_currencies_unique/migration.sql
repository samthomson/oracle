/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[symbol]` on the table `Currency`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Currency.symbol_unique` ON `Currency`(`symbol`);
