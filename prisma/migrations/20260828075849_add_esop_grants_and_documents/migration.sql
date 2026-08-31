-- CreateEnum
CREATE TYPE "EsopDocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'CONFIRMED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "EsopDocumentSource" AS ENUM ('UPLOAD', 'MANUAL');

-- CreateEnum
CREATE TYPE "EsopGrantStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'CONFIRMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EsopFieldStatus" AS ENUM ('VERIFIED', 'REVIEW', 'NOT_FOUND');

-- CreateEnum
CREATE TYPE "EsopVestingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EsopClauseType" AS ENUM ('TERMINATION', 'EXERCISE_WINDOW', 'FORFEITURE', 'CHANGE_OF_CONTROL', 'ACCELERATION', 'EXPIRY', 'VESTING', 'TRANSFER_RESTRICTION', 'REPURCHASE', 'LIQUIDITY', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "EsopClauseImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_UPLOADED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_PROCESSING_STARTED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_PROCESSED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_REVIEWED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_CONFIRMED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_FAILED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_DOCUMENT_DELETED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_GRANT_CREATED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_GRANT_UPDATED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_GRANT_CONFIRMED';
ALTER TYPE "UserActivityType" ADD VALUE 'ESOP_GRANT_ARCHIVED';

-- CreateTable
CREATE TABLE "EsopDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "EsopDocumentSource" NOT NULL DEFAULT 'UPLOAD',
    "status" "EsopDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "originalFileName" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "extractedText" JSONB,
    "extractionData" JSONB,
    "extractionError" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsopDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsopGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "status" "EsopGrantStatus" NOT NULL DEFAULT 'DRAFT',
    "companyName" TEXT,
    "grantName" TEXT,
    "grantDate" TIMESTAMP(3),
    "optionCount" INTEGER,
    "strikePrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "vestingStartDate" TIMESTAMP(3),
    "vestingDurationMonths" INTEGER,
    "cliffMonths" INTEGER,
    "vestingFrequency" "EsopVestingFrequency" NOT NULL DEFAULT 'UNKNOWN',
    "expiryDate" TIMESTAMP(3),
    "postTerminationExerciseDays" INTEGER,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsopGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsopGrantField" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "extractedValue" JSONB,
    "confirmedValue" JSONB,
    "status" "EsopFieldStatus" NOT NULL DEFAULT 'REVIEW',
    "sourceText" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsopGrantField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsopDocumentClause" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "EsopClauseType" NOT NULL,
    "importance" "EsopClauseImportance" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "extractedText" TEXT,
    "fieldStatus" "EsopFieldStatus" NOT NULL DEFAULT 'REVIEW',
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsopDocumentClause_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EsopDocument_userId_idx" ON "EsopDocument"("userId");

-- CreateIndex
CREATE INDEX "EsopDocument_status_idx" ON "EsopDocument"("status");

-- CreateIndex
CREATE INDEX "EsopDocument_createdAt_idx" ON "EsopDocument"("createdAt");

-- CreateIndex
CREATE INDEX "EsopGrant_userId_idx" ON "EsopGrant"("userId");

-- CreateIndex
CREATE INDEX "EsopGrant_documentId_idx" ON "EsopGrant"("documentId");

-- CreateIndex
CREATE INDEX "EsopGrant_status_idx" ON "EsopGrant"("status");

-- CreateIndex
CREATE INDEX "EsopGrant_companyName_idx" ON "EsopGrant"("companyName");

-- CreateIndex
CREATE INDEX "EsopGrant_createdAt_idx" ON "EsopGrant"("createdAt");

-- CreateIndex
CREATE INDEX "EsopGrantField_grantId_idx" ON "EsopGrantField"("grantId");

-- CreateIndex
CREATE INDEX "EsopGrantField_status_idx" ON "EsopGrantField"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EsopGrantField_grantId_fieldKey_key" ON "EsopGrantField"("grantId", "fieldKey");

-- CreateIndex
CREATE INDEX "EsopDocumentClause_documentId_idx" ON "EsopDocumentClause"("documentId");

-- CreateIndex
CREATE INDEX "EsopDocumentClause_type_idx" ON "EsopDocumentClause"("type");

-- CreateIndex
CREATE INDEX "EsopDocumentClause_importance_idx" ON "EsopDocumentClause"("importance");

-- AddForeignKey
ALTER TABLE "EsopDocument" ADD CONSTRAINT "EsopDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsopGrant" ADD CONSTRAINT "EsopGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsopGrant" ADD CONSTRAINT "EsopGrant_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsopDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsopGrantField" ADD CONSTRAINT "EsopGrantField_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "EsopGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsopDocumentClause" ADD CONSTRAINT "EsopDocumentClause_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsopDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
