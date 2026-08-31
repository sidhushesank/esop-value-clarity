-- CreateEnum
CREATE TYPE "OfferIntelligenceStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'CONFIRMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OfferIntelligenceSource" AS ENUM ('PDF_UPLOAD', 'MANUAL');

-- CreateTable
CREATE TABLE "OfferIntelligence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OfferIntelligenceStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "OfferIntelligenceSource" NOT NULL DEFAULT 'PDF_UPLOAD',
    "companyName" TEXT,
    "roleTitle" TEXT,
    "location" TEXT,
    "employmentType" TEXT,
    "workMode" TEXT,
    "joiningDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "headlineCTC" DOUBLE PRECISION,
    "fixedSalary" DOUBLE PRECISION,
    "basicSalary" DOUBLE PRECISION,
    "hra" DOUBLE PRECISION,
    "specialAllowance" DOUBLE PRECISION,
    "otherFixedAllowance" DOUBLE PRECISION,
    "targetVariablePay" DOUBLE PRECISION,
    "maximumVariablePay" DOUBLE PRECISION,
    "joiningBonus" DOUBLE PRECISION,
    "retentionBonus" DOUBLE PRECISION,
    "relocationBonus" DOUBLE PRECISION,
    "performanceBonus" DOUBLE PRECISION,
    "employerPF" DOUBLE PRECISION,
    "gratuity" DOUBLE PRECISION,
    "insuranceValue" DOUBLE PRECISION,
    "otherEmployerBenefits" DOUBLE PRECISION,
    "equityType" TEXT,
    "companyEquityStatus" TEXT,
    "employerHeadlineEquityValue" DOUBLE PRECISION,
    "totalOptionsOrShares" INTEGER,
    "exercisePrice" DOUBLE PRECISION,
    "currentFMV" DOUBLE PRECISION,
    "listedSharePrice" DOUBLE PRECISION,
    "companyValuation" DOUBLE PRECISION,
    "totalCompanyShares" DOUBLE PRECISION,
    "ownershipPercentage" DOUBLE PRECISION,
    "vestingDurationMonths" INTEGER,
    "cliffMonths" INTEGER,
    "vestingFrequency" TEXT,
    "vestingStartDate" TIMESTAMP(3),
    "grantDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "postTerminationExerciseDays" INTEGER,
    "expectedDilutionPercentage" DOUBLE PRECISION,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "pageCount" INTEGER,
    "rawScanSnapshot" JSONB,
    "confirmedScanSnapshot" JSONB,
    "normalizedSnapshot" JSONB,
    "validationSnapshot" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferIntelligence_userId_idx" ON "OfferIntelligence"("userId");

-- CreateIndex
CREATE INDEX "OfferIntelligence_status_idx" ON "OfferIntelligence"("status");

-- CreateIndex
CREATE INDEX "OfferIntelligence_companyName_idx" ON "OfferIntelligence"("companyName");

-- CreateIndex
CREATE INDEX "OfferIntelligence_createdAt_idx" ON "OfferIntelligence"("createdAt");

-- AddForeignKey
ALTER TABLE "OfferIntelligence" ADD CONSTRAINT "OfferIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
