-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('DULCE', 'PURE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "CategoryStatus" NOT NULL DEFAULT 'DULCE',
ADD COLUMN     "color" TEXT;
