-- AlterTable
ALTER TABLE "OptionGrant" ADD COLUMN     "letterDownloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "letterDownloadedAt" TIMESTAMP(3),
ADD COLUMN     "letterFileName" TEXT,
ADD COLUMN     "letterFileSize" INTEGER,
ADD COLUMN     "letterStorageKey" TEXT,
ADD COLUMN     "letterUploadedAt" TIMESTAMP(3);
