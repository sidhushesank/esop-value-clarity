-- CreateEnum
CREATE TYPE "ExpenseStandard" AS ENUM ('IND_AS_102', 'ICAI_GUIDANCE_NOTE', 'ASC_718');

-- CreateEnum
CREATE TYPE "ExpenseAttribution" AS ENUM ('GRADED', 'STRAIGHT_LINE');

-- CreateEnum
CREATE TYPE "ExpenseValuationBasis" AS ENUM ('FAIR_VALUE', 'INTRINSIC');

-- AlterTable
ALTER TABLE "OptionGrant" ADD COLUMN     "lapsedOn" DATE;

-- CreateTable
CREATE TABLE "ExpenseSettings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "standard" "ExpenseStandard" NOT NULL,
    "attribution" "ExpenseAttribution" NOT NULL DEFAULT 'GRADED',
    "valuationBasis" "ExpenseValuationBasis" NOT NULL DEFAULT 'FAIR_VALUE',
    "volatility" DOUBLE PRECISION,
    "riskFreeRate" DOUBLE PRECISION,
    "dividendYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "forfeitureRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractualYears" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "fyEndMonth" INTEGER NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantValuation" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fmvPerShare" DOUBLE PRECISION,
    "volatility" DOUBLE PRECISION,
    "riskFreeRate" DOUBLE PRECISION,
    "dividendYield" DOUBLE PRECISION,
    "expectedTermYears" DOUBLE PRECISION,
    "fairValueOverride" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantValuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSettings_workspaceId_key" ON "ExpenseSettings"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GrantValuation_grantId_key" ON "GrantValuation"("grantId");

-- CreateIndex
CREATE INDEX "GrantValuation_workspaceId_idx" ON "GrantValuation"("workspaceId");

-- AddForeignKey
ALTER TABLE "GrantValuation" ADD CONSTRAINT "GrantValuation_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "OptionGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
