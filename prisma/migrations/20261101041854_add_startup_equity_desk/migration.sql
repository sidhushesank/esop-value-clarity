-- CreateEnum
CREATE TYPE "CompanyWorkspaceStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecurityKind" AS ENUM ('EQUITY', 'CCPS', 'CCD', 'CONVERTIBLE_NOTE', 'ISAFE', 'WARRANT');

-- CreateEnum
CREATE TYPE "ShareholderType" AS ENUM ('FOUNDER', 'INVESTOR', 'EMPLOYEE', 'OTHER');

-- CreateEnum
CREATE TYPE "ShareMovementKind" AS ENUM ('ALLOTMENT', 'TRANSFER', 'CONVERSION', 'BUYBACK');

-- CreateEnum
CREATE TYPE "OptionGrantStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACCEPTED', 'LEFT', 'LAPSED', 'EXERCISED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'COMPANY_WORKSPACE_GRANTED';
ALTER TYPE "AdminActionType" ADD VALUE 'COMPANY_WORKSPACE_EXTENDED';
ALTER TYPE "AdminActionType" ADD VALUE 'COMPANY_WORKSPACE_UPDATED';
ALTER TYPE "AdminActionType" ADD VALUE 'COMPANY_WORKSPACE_REVOKED';

-- CreateTable
CREATE TABLE "CompanyWorkspace" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cin" TEXT,
    "companyType" "ClientCompanyType" NOT NULL DEFAULT 'PRIVATE_LIMITED',
    "incorporationDate" TIMESTAMP(3),
    "dpiitRecognised" BOOLEAN,
    "status" "CompanyWorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "holderLimit" INTEGER NOT NULL DEFAULT 25,
    "source" "SubscriptionSource" NOT NULL DEFAULT 'PAYMENT',
    "grantedById" TEXT,
    "grantReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentReference" TEXT,
    "expiryReminderFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPayment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityClass" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SecurityKind" NOT NULL DEFAULT 'EQUITY',
    "faceValue" DOUBLE PRECISION,
    "conversionRatio" DOUBLE PRECISION,
    "liqPrefMultiple" DOUBLE PRECISION,
    "participating" BOOLEAN,
    "valuationCap" DOUBLE PRECISION,
    "discountPct" DOUBLE PRECISION,
    "principalAmount" DOUBLE PRECISION,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shareholder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShareholderType" NOT NULL DEFAULT 'OTHER',
    "email" TEXT,
    "isResident" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareMovement" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kind" "ShareMovementKind" NOT NULL,
    "date" DATE NOT NULL,
    "classId" TEXT NOT NULL,
    "toClassId" TEXT,
    "fromHolderId" TEXT,
    "toHolderId" TEXT,
    "quantity" INTEGER NOT NULL,
    "toQuantity" INTEGER,
    "pricePerShare" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsopScheme" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "poolSize" INTEGER NOT NULL,
    "boardApprovedOn" DATE,
    "shareholderApprovedOn" DATE,
    "resolutionVote" "ResolutionVote",
    "mgt14FiledOn" DATE,
    "explanatoryStatement" BOOLEAN NOT NULL DEFAULT false,
    "defaultVestingMonths" INTEGER NOT NULL DEFAULT 48,
    "defaultCliffMonths" INTEGER NOT NULL DEFAULT 12,
    "defaultPostExitDays" INTEGER NOT NULL DEFAULT 90,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsopScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionGrant" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeEmail" TEXT,
    "employeeRef" TEXT,
    "holderKey" TEXT NOT NULL,
    "isPromoterOver10Pct" BOOLEAN NOT NULL DEFAULT false,
    "grantDate" DATE NOT NULL,
    "options" INTEGER NOT NULL,
    "exercisePrice" DOUBLE PRECISION NOT NULL,
    "vestingStart" DATE NOT NULL,
    "vestingMonths" INTEGER NOT NULL,
    "cliffMonths" INTEGER NOT NULL,
    "expiryDate" DATE,
    "postExitDays" INTEGER NOT NULL,
    "status" "OptionGrantStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "leftOn" DATE,
    "optionsLapsed" INTEGER NOT NULL DEFAULT 0,
    "optionsExercised" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantLink" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "passcodeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyWorkspace_ownerId_key" ON "CompanyWorkspace"("ownerId");

-- CreateIndex
CREATE INDEX "CompanyWorkspace_status_idx" ON "CompanyWorkspace"("status");

-- CreateIndex
CREATE INDEX "CompanyWorkspace_expiresAt_idx" ON "CompanyWorkspace"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPayment_razorpayOrderId_key" ON "CompanyPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPayment_razorpayPaymentId_key" ON "CompanyPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "CompanyPayment_workspaceId_idx" ON "CompanyPayment"("workspaceId");

-- CreateIndex
CREATE INDEX "CompanyPayment_userId_idx" ON "CompanyPayment"("userId");

-- CreateIndex
CREATE INDEX "CompanyPayment_status_idx" ON "CompanyPayment"("status");

-- CreateIndex
CREATE INDEX "SecurityClass_workspaceId_idx" ON "SecurityClass"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityClass_workspaceId_name_key" ON "SecurityClass"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "Shareholder_workspaceId_idx" ON "Shareholder"("workspaceId");

-- CreateIndex
CREATE INDEX "ShareMovement_workspaceId_date_idx" ON "ShareMovement"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "ShareMovement_classId_idx" ON "ShareMovement"("classId");

-- CreateIndex
CREATE INDEX "EsopScheme_workspaceId_idx" ON "EsopScheme"("workspaceId");

-- CreateIndex
CREATE INDEX "OptionGrant_workspaceId_idx" ON "OptionGrant"("workspaceId");

-- CreateIndex
CREATE INDEX "OptionGrant_schemeId_idx" ON "OptionGrant"("schemeId");

-- CreateIndex
CREATE INDEX "OptionGrant_workspaceId_holderKey_idx" ON "OptionGrant"("workspaceId", "holderKey");

-- CreateIndex
CREATE UNIQUE INDEX "GrantLink_tokenHash_key" ON "GrantLink"("tokenHash");

-- CreateIndex
CREATE INDEX "GrantLink_grantId_idx" ON "GrantLink"("grantId");

-- CreateIndex
CREATE INDEX "GrantLink_expiresAt_idx" ON "GrantLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "CompanyWorkspace" ADD CONSTRAINT "CompanyWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPayment" ADD CONSTRAINT "CompanyPayment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPayment" ADD CONSTRAINT "CompanyPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityClass" ADD CONSTRAINT "SecurityClass_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shareholder" ADD CONSTRAINT "Shareholder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareMovement" ADD CONSTRAINT "ShareMovement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareMovement" ADD CONSTRAINT "ShareMovement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SecurityClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareMovement" ADD CONSTRAINT "ShareMovement_fromHolderId_fkey" FOREIGN KEY ("fromHolderId") REFERENCES "Shareholder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareMovement" ADD CONSTRAINT "ShareMovement_toHolderId_fkey" FOREIGN KEY ("toHolderId") REFERENCES "Shareholder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsopScheme" ADD CONSTRAINT "EsopScheme_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionGrant" ADD CONSTRAINT "OptionGrant_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CompanyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionGrant" ADD CONSTRAINT "OptionGrant_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "EsopScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantLink" ADD CONSTRAINT "GrantLink_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "OptionGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
