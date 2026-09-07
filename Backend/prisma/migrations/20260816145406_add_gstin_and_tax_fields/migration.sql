/*
  Warnings:

  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "gstin" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cgst" DOUBLE PRECISION,
ADD COLUMN     "igst" DOUBLE PRECISION,
ADD COLUMN     "sgst" DOUBLE PRECISION,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "cgst" DOUBLE PRECISION,
ADD COLUMN     "igst" DOUBLE PRECISION,
ADD COLUMN     "sgst" DOUBLE PRECISION,
ADD COLUMN     "tax" DOUBLE PRECISION;
