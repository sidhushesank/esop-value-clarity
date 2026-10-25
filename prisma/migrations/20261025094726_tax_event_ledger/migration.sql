-- CreateEnum
CREATE TYPE "TaxEventType" AS ENUM ('EXERCISE', 'SALE', 'LEAVE', 'BUYBACK');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('NEW', 'OLD');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('SENT', 'FAILED');

-- AlterTable
ALTER TABLE "AdvisorFirm" ADD COLUMN     "reminderEmail" TEXT;

-- CreateTable
CREATE TABLE "TaxEmployee" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeRef" TEXT,
    "pan" TEXT,
    "regime" "TaxRegime" NOT NULL DEFAULT 'NEW',
    "estimatedIncomeExclPerq" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyNetPay" DOUBLE PRECISION,
    "isPromoter" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "TaxEventType" NOT NULL,
    "eventDate" DATE NOT NULL,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "exercisePrice" DOUBLE PRECISION,
    "valuationId" TEXT,
    "pricePerShare" DOUBLE PRECISION,
    "lotEventId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxComputation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ruleSetVersion" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxComputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "TaxReminderLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deadlineKey" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "sentTo" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxEmployee_clientId_idx" ON "TaxEmployee"("clientId");

-- CreateIndex
CREATE INDEX "TaxEmployee_archivedAt_idx" ON "TaxEmployee"("archivedAt");

-- CreateIndex
CREATE INDEX "TaxEvent_clientId_idx" ON "TaxEvent"("clientId");

-- CreateIndex
CREATE INDEX "TaxEvent_employeeId_idx" ON "TaxEvent"("employeeId");

-- CreateIndex
CREATE INDEX "TaxEvent_eventDate_idx" ON "TaxEvent"("eventDate");

-- CreateIndex
CREATE INDEX "TaxComputation_clientId_idx" ON "TaxComputation"("clientId");

-- CreateIndex
CREATE INDEX "TaxComputation_eventId_createdAt_idx" ON "TaxComputation"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "TaxReminderLog_clientId_idx" ON "TaxReminderLog"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReminderLog_deadlineKey_offsetDays_key" ON "TaxReminderLog"("deadlineKey", "offsetDays");

-- AddForeignKey
ALTER TABLE "TaxEmployee" ADD CONSTRAINT "TaxEmployee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD CONSTRAINT "TaxEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD CONSTRAINT "TaxEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "TaxEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD CONSTRAINT "TaxEvent_valuationId_fkey" FOREIGN KEY ("valuationId") REFERENCES "ClientValuation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxComputation" ADD CONSTRAINT "TaxComputation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxComputation" ADD CONSTRAINT "TaxComputation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TaxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReminderLog" ADD CONSTRAINT "TaxReminderLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
