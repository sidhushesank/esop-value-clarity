-- CreateTable
CREATE TABLE "GrantJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrantJourney_grantId_key" ON "GrantJourney"("grantId");

-- CreateIndex
CREATE INDEX "GrantJourney_userId_idx" ON "GrantJourney"("userId");

-- AddForeignKey
ALTER TABLE "GrantJourney" ADD CONSTRAINT "GrantJourney_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "EsopGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
