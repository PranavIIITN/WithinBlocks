-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "financialYear" TEXT NOT NULL DEFAULT '2526',
ADD COLUMN     "invoiceCounter" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "invoicePrefix" TEXT NOT NULL DEFAULT 'INV';
