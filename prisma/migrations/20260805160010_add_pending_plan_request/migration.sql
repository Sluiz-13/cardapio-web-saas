-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "pendingPlanRequest" "Plan",
ADD COLUMN     "pendingPlanRequestedAt" TIMESTAMP(3);
