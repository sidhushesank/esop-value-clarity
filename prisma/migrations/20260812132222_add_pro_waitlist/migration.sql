-- CreateTable
CREATE TABLE "ProWaitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProWaitlist_userId_key" ON "ProWaitlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProWaitlist_email_key" ON "ProWaitlist"("email");

-- AddForeignKey
ALTER TABLE "ProWaitlist" ADD CONSTRAINT "ProWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
