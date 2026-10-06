-- CreateEnum
CREATE TYPE "TeamWorkspaceStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TeamMembershipStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateTable
CREATE TABLE "TeamWorkspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "TeamWorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TeamMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPayment" (
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

    CONSTRAINT "TeamPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamWorkspace_ownerId_key" ON "TeamWorkspace"("ownerId");

-- CreateIndex
CREATE INDEX "TeamWorkspace_status_idx" ON "TeamWorkspace"("status");

-- CreateIndex
CREATE INDEX "TeamWorkspace_expiresAt_idx" ON "TeamWorkspace"("expiresAt");

-- CreateIndex
CREATE INDEX "TeamMembership_workspaceId_status_idx" ON "TeamMembership"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_status_idx" ON "TeamMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_workspaceId_userId_key" ON "TeamMembership"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_razorpayOrderId_key" ON "TeamPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_razorpayPaymentId_key" ON "TeamPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "TeamPayment_workspaceId_idx" ON "TeamPayment"("workspaceId");

-- CreateIndex
CREATE INDEX "TeamPayment_userId_idx" ON "TeamPayment"("userId");

-- CreateIndex
CREATE INDEX "TeamPayment_status_idx" ON "TeamPayment"("status");

-- CreateIndex
CREATE INDEX "TeamPayment_expiresAt_idx" ON "TeamPayment"("expiresAt");

-- AddForeignKey
ALTER TABLE "TeamWorkspace" ADD CONSTRAINT "TeamWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPayment" ADD CONSTRAINT "TeamPayment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPayment" ADD CONSTRAINT "TeamPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
