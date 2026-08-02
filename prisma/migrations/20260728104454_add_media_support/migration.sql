-- AlterTable
ALTER TABLE "Review" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Review" ADD COLUMN "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "ShopSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "allowPhoto" BOOLEAN NOT NULL DEFAULT false,
    "allowVideo" BOOLEAN NOT NULL DEFAULT false
);
