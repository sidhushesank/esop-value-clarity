-- CreateTable
CREATE TABLE "ComplianceDone" (
    "id" TEXT NOT NULL,
    "scope" "ChangeScope" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "doneOn" DATE NOT NULL,
    "userId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceDone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReminderLog" (
    "id" TEXT NOT NULL,
    "scope" "ChangeScope" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "sentTo" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceDone_ownerId_idx" ON "ComplianceDone"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceDone_ownerId_itemKey_key" ON "ComplianceDone"("ownerId", "itemKey");

-- CreateIndex
CREATE INDEX "ComplianceReminderLog_ownerId_idx" ON "ComplianceReminderLog"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceReminderLog_ownerId_itemKey_offsetDays_key" ON "ComplianceReminderLog"("ownerId", "itemKey", "offsetDays");
