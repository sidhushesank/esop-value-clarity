-- CreateTable
CREATE TABLE "OptionExercise" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "exerciseDate" DATE NOT NULL,
    "options" INTEGER NOT NULL,
    "exercisePrice" DOUBLE PRECISION NOT NULL,
    "fmvPerShare" DOUBLE PRECISION,
    "allotmentDate" DATE,
    "classId" TEXT,
    "shareholderId" TEXT,
    "movementId" TEXT,
    "pas3FiledOn" DATE,
    "pas3Srn" TEXT,
    "shareCertificateOn" DATE,
    "tdsDeferred" BOOLEAN NOT NULL DEFAULT false,
    "tdsAmount" DOUBLE PRECISION,
    "tdsDeductedOn" DATE,
    "tdsDepositedOn" DATE,
    "tdsChallanRef" TEXT,
    "form3921FurnishedOn" DATE,
    "form3921FiledOn" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionExercise_workspaceId_exerciseDate_idx" ON "OptionExercise"("workspaceId", "exerciseDate");

-- CreateIndex
CREATE INDEX "OptionExercise_grantId_idx" ON "OptionExercise"("grantId");

-- AddForeignKey
ALTER TABLE "OptionExercise" ADD CONSTRAINT "OptionExercise_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "OptionGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
