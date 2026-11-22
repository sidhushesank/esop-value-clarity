-- CreateEnum
CREATE TYPE "ChangeScope" AS ENUM ('COMPANY', 'ADVISOR');

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "scope" "ChangeScope" NOT NULL,
    "workspaceId" TEXT,
    "firmId" TEXT,
    "clientId" TEXT,
    "actorUserId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangeLog_workspaceId_createdAt_idx" ON "ChangeLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ChangeLog_firmId_clientId_createdAt_idx" ON "ChangeLog"("firmId", "clientId", "createdAt");
