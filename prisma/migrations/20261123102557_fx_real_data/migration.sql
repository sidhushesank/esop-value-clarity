-- AlterEnum
ALTER TYPE "FxRateRule" ADD VALUE 'AT_SALE_RATE';

-- AlterTable
ALTER TABLE "FxTransaction" ADD COLUMN     "basisDate" TIMESTAMP(3),
ADD COLUMN     "fmvCost" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FxSplit" (
    "symbol" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxSplit_pkey" PRIMARY KEY ("symbol","date")
);

-- CreateTable
CREATE TABLE "FxSync" (
    "key" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "message" TEXT,

    CONSTRAINT "FxSync_pkey" PRIMARY KEY ("key")
);
