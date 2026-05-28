-- AlterTable
ALTER TABLE "public"."clerk_sync_tasks"
ADD COLUMN "sync_key" TEXT,
ADD COLUMN "dead_lettered_at" TIMESTAMP(3);

-- Backfill existing rows with deterministic fallback keys
UPDATE "public"."clerk_sync_tasks"
SET "sync_key" = CONCAT('legacy:', "id")
WHERE "sync_key" IS NULL;

-- Enforce constraints aligned with phase 03
ALTER TABLE "public"."clerk_sync_tasks"
ALTER COLUMN "sync_key" SET NOT NULL,
ALTER COLUMN "max_attempts" SET DEFAULT 3;

-- CreateIndex
CREATE UNIQUE INDEX "clerk_sync_tasks_sync_key_key" ON "public"."clerk_sync_tasks"("sync_key");
