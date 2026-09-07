-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceType" "PriceType" NOT NULL DEFAULT 'EXCLUSIVE';
