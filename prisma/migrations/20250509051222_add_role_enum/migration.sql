-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('car', 'bike', 'auto');

-- CreateTable
CREATE TABLE "Captain" (
    "id" SERIAL NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "socketId" TEXT,
    "isAvailable" BOOLEAN NOT NULL,
    "vehicleColor" TEXT NOT NULL DEFAULT 'white',
    "vehiclePlate" TEXT NOT NULL,
    "vehicleCapacity" INTEGER NOT NULL DEFAULT 4,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'bike',
    "latitude" DOUBLE PRECISION DEFAULT 0.0,
    "longitude" DOUBLE PRECISION DEFAULT 0.0,

    CONSTRAINT "Captain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Captain_email_key" ON "Captain"("email");
