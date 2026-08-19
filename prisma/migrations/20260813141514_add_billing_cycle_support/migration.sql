/*
  Warnings:

  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `billingCycle` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'SIX_MONTHS', 'YEARLY');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL,
ADD COLUMN     "plan" "PlanType" NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingCycle" "BillingCycle";
