-- CreateEnum
CREATE TYPE "FxTxnType" AS ENUM ('VEST', 'BUY', 'SELL', 'DIVIDEND', 'TAX_WITHHELD');

-- CreateEnum
CREATE TYPE "FxRateRule" AS ENUM ('SAME_DAY', 'PREV_MONTH_END');

-- CreateTable
CREATE TABLE "FxClient" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "slabRate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "costRateRule" "FxRateRule" NOT NULL DEFAULT 'SAME_DAY',
    "saleRateRule" "FxRateRule" NOT NULL DEFAULT 'PREV_MONTH_END',
    "dividendRateRule" "FxRateRule" NOT NULL DEFAULT 'PREV_MONTH_END',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "FxClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxTransaction" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "FxTxnType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "company" TEXT,
    "broker" TEXT,
    "account" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceUsd" DOUBLE PRECISION,
    "amountUsd" DOUBLE PRECISION,
    "feesUsd" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lotRef" TEXT,
    "costInrPerShare" DOUBLE PRECISION,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "firmId" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ttbr" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("firmId","currency","date")
);

-- CreateTable
CREATE TABLE "FxPrice" (
    "firmId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxPrice_pkey" PRIMARY KEY ("firmId","symbol","date")
);

-- CreateIndex
CREATE INDEX "FxClient_firmId_idx" ON "FxClient"("firmId");

-- CreateIndex
CREATE INDEX "FxTransaction_clientId_date_idx" ON "FxTransaction"("clientId", "date");

-- CreateIndex
CREATE INDEX "FxTransaction_firmId_idx" ON "FxTransaction"("firmId");

-- CreateIndex
CREATE INDEX "FxRate_currency_date_idx" ON "FxRate"("currency", "date");

-- AddForeignKey
ALTER TABLE "FxTransaction" ADD CONSTRAINT "FxTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "FxClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
