-- AlterEnum
ALTER TYPE "EsopFieldStatus" ADD VALUE 'USER_CONFIRMED';

-- AlterTable
ALTER TABLE "EsopGrantField" ADD COLUMN     "reviewedAt" TIMESTAMP(3);
