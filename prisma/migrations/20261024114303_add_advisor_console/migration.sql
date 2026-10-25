-- CreateEnum
CREATE TYPE "AdvisorFirmStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClientCompanyType" AS ENUM ('PRIVATE_LIMITED', 'UNLISTED_PUBLIC');

-- CreateEnum
CREATE TYPE "ResolutionKind" AS ENUM ('BOARD_SCHEME_APPROVAL', 'SHAREHOLDER_SCHEME_APPROVAL');

-- CreateEnum
CREATE TYPE "ResolutionVote" AS ENUM ('ORDINARY', 'SPECIAL');

-- CreateEnum
CREATE TYPE "HolderType" AS ENUM ('FOUNDER', 'INVESTOR', 'ESOP_POOL', 'OTHER');

-- CreateEnum
CREATE TYPE "RegisterGrantStatus" AS ENUM ('ACTIVE', 'LAPSED', 'LEFT', 'FULLY_EXERCISED');

-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('REGISTER', 'CAP_TABLE');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('RED', 'AMBER', 'GREEN', 'INFO');

-- AlterEnum
ALTER TYPE "AdminActionType" ADD VALUE 'ADVISOR_FIRM_GRANTED';

-- CreateTable
CREATE TABLE "AdvisorFirm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "AdvisorFirmStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientLimit" INTEGER NOT NULL DEFAULT 10,
    "source" "SubscriptionSource" NOT NULL DEFAULT 'PAYMENT',
    "grantedById" TEXT,
    "grantReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "brandName" TEXT,
    "brandFooter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorFirm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorPayment" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
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

    CONSTRAINT "AdvisorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCompany" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cin" TEXT,
    "companyType" "ClientCompanyType" NOT NULL DEFAULT 'PRIVATE_LIMITED',
    "incorporationDate" TIMESTAMP(3),
    "approvedPoolSize" INTEGER,
    "dpiitRecognised" BOOLEAN,
    "imbCertificate" BOOLEAN,
    "overseasParent" BOOLEAN,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientResolution" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "ResolutionKind" NOT NULL,
    "vote" "ResolutionVote" NOT NULL,
    "passedOn" TIMESTAMP(3) NOT NULL,
    "mgt14Filed" TIMESTAMP(3),
    "explanatoryStatementOnFile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientValuation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "fmvPerShare" DOUBLE PRECISION NOT NULL,
    "valuerName" TEXT,
    "signedBySebiCat1MerchantBanker" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientValuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "ImportKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "mapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisterGrant" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "batchId" TEXT,
    "sourceRow" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeRef" TEXT,
    "grantDate" TIMESTAMP(3) NOT NULL,
    "optionsGranted" INTEGER NOT NULL,
    "exercisePrice" DOUBLE PRECISION NOT NULL,
    "vestingStartDate" TIMESTAMP(3),
    "vestingMonths" INTEGER,
    "cliffMonths" INTEGER,
    "expiryDate" TIMESTAMP(3),
    "postExitExerciseDays" INTEGER,
    "forfeitureTermsOnFile" BOOLEAN,
    "optionsLapsed" INTEGER NOT NULL DEFAULT 0,
    "status" "RegisterGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "leftOn" TIMESTAMP(3),
    "letterOptions" INTEGER,
    "letterExercisePrice" DOUBLE PRECISION,
    "letterGrantDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisterGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisterExercise" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "valuationId" TEXT,
    "exerciseDate" TIMESTAMP(3) NOT NULL,
    "optionsExercised" INTEGER NOT NULL,
    "allotmentDate" TIMESTAMP(3),
    "pas3FiledOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisterExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableRow" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "batchId" TEXT,
    "holderName" TEXT NOT NULL,
    "holderType" "HolderType" NOT NULL DEFAULT 'OTHER',
    "shares" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapTableRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "taxYear" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "severityVerified" "FindingSeverity" NOT NULL DEFAULT 'RED',
    "severityUnverified" "FindingSeverity" NOT NULL DEFAULT 'AMBER',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiligenceRun" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rulesSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiligenceFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "sourceRef" JSONB,
    "suggestedOwner" TEXT,
    "dueDate" TIMESTAMP(3),
    "ruleVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiligenceFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "runId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "passcodeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLinkView" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLinkView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorFirm_ownerId_key" ON "AdvisorFirm"("ownerId");

-- CreateIndex
CREATE INDEX "AdvisorFirm_status_idx" ON "AdvisorFirm"("status");

-- CreateIndex
CREATE INDEX "AdvisorFirm_expiresAt_idx" ON "AdvisorFirm"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorPayment_razorpayOrderId_key" ON "AdvisorPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorPayment_razorpayPaymentId_key" ON "AdvisorPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "AdvisorPayment_firmId_idx" ON "AdvisorPayment"("firmId");

-- CreateIndex
CREATE INDEX "AdvisorPayment_userId_idx" ON "AdvisorPayment"("userId");

-- CreateIndex
CREATE INDEX "AdvisorPayment_status_idx" ON "AdvisorPayment"("status");

-- CreateIndex
CREATE INDEX "ClientCompany_firmId_idx" ON "ClientCompany"("firmId");

-- CreateIndex
CREATE INDEX "ClientCompany_archivedAt_idx" ON "ClientCompany"("archivedAt");

-- CreateIndex
CREATE INDEX "ClientResolution_clientId_idx" ON "ClientResolution"("clientId");

-- CreateIndex
CREATE INDEX "ClientValuation_clientId_idx" ON "ClientValuation"("clientId");

-- CreateIndex
CREATE INDEX "ImportBatch_clientId_idx" ON "ImportBatch"("clientId");

-- CreateIndex
CREATE INDEX "RegisterGrant_clientId_idx" ON "RegisterGrant"("clientId");

-- CreateIndex
CREATE INDEX "RegisterGrant_batchId_idx" ON "RegisterGrant"("batchId");

-- CreateIndex
CREATE INDEX "RegisterExercise_clientId_idx" ON "RegisterExercise"("clientId");

-- CreateIndex
CREATE INDEX "RegisterExercise_grantId_idx" ON "RegisterExercise"("grantId");

-- CreateIndex
CREATE INDEX "CapTableRow_clientId_idx" ON "CapTableRow"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleDefinition_code_key" ON "RuleDefinition"("code");

-- CreateIndex
CREATE INDEX "DiligenceRun_clientId_idx" ON "DiligenceRun"("clientId");

-- CreateIndex
CREATE INDEX "DiligenceRun_createdAt_idx" ON "DiligenceRun"("createdAt");

-- CreateIndex
CREATE INDEX "DiligenceFinding_runId_idx" ON "DiligenceFinding"("runId");

-- CreateIndex
CREATE INDEX "DiligenceFinding_severity_idx" ON "DiligenceFinding"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tokenHash_key" ON "ShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ShareLink_clientId_idx" ON "ShareLink"("clientId");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareLinkView_linkId_idx" ON "ShareLinkView"("linkId");

-- AddForeignKey
ALTER TABLE "AdvisorFirm" ADD CONSTRAINT "AdvisorFirm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorPayment" ADD CONSTRAINT "AdvisorPayment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "AdvisorFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorPayment" ADD CONSTRAINT "AdvisorPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCompany" ADD CONSTRAINT "ClientCompany_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "AdvisorFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientResolution" ADD CONSTRAINT "ClientResolution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientValuation" ADD CONSTRAINT "ClientValuation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterGrant" ADD CONSTRAINT "RegisterGrant_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterGrant" ADD CONSTRAINT "RegisterGrant_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterExercise" ADD CONSTRAINT "RegisterExercise_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterExercise" ADD CONSTRAINT "RegisterExercise_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "RegisterGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterExercise" ADD CONSTRAINT "RegisterExercise_valuationId_fkey" FOREIGN KEY ("valuationId") REFERENCES "ClientValuation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableRow" ADD CONSTRAINT "CapTableRow_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableRow" ADD CONSTRAINT "CapTableRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiligenceRun" ADD CONSTRAINT "DiligenceRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiligenceFinding" ADD CONSTRAINT "DiligenceFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiligenceRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiligenceRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLinkView" ADD CONSTRAINT "ShareLinkView_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
