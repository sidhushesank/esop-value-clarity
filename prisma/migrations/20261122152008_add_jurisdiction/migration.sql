-- CreateEnum
CREATE TYPE "EquityJurisdiction" AS ENUM ('IN', 'US');

-- CreateEnum
CREATE TYPE "UsOptionType" AS ENUM ('ISO', 'NSO');

-- AlterTable
ALTER TABLE "CompanyWorkspace" ADD COLUMN     "jurisdiction" "EquityJurisdiction" NOT NULL DEFAULT 'IN',
ADD COLUMN     "usStateOfIncorporation" TEXT;

-- AlterTable
ALTER TABLE "OptionGrant" ADD COLUMN     "usOptionType" "UsOptionType";
