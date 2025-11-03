/*
  Warnings:

  - Added the required column `percent` to the `Split` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Split" ADD COLUMN     "percent" DOUBLE PRECISION NOT NULL;
