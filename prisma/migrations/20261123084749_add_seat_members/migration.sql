-- CreateEnum
CREATE TYPE "SeatKind" AS ENUM ('COMPANY', 'ADVISOR');

-- CreateEnum
CREATE TYPE "SeatRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "SeatMember" (
    "id" TEXT NOT NULL,
    "kind" "SeatKind" NOT NULL,
    "workspaceId" TEXT,
    "firmId" TEXT,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "role" "SeatRole" NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SeatMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatMember_kind_email_idx" ON "SeatMember"("kind", "email");

-- CreateIndex
CREATE INDEX "SeatMember_userId_idx" ON "SeatMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatMember_workspaceId_email_key" ON "SeatMember"("workspaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "SeatMember_firmId_email_key" ON "SeatMember"("firmId", "email");
