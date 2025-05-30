-- AlterTable
ALTER TABLE "Captain" ALTER COLUMN "isAvailable" DROP NOT NULL,
ALTER COLUMN "isAvailable" SET DEFAULT false;
