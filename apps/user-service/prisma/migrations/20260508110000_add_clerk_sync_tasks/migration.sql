-- CreateEnum
CREATE TYPE "public"."ClerkSyncAction" AS ENUM ('UPSERT', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."ClerkSyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."clerk_sync_tasks" (
    "id" TEXT NOT NULL,
    "action" "public"."ClerkSyncAction" NOT NULL,
    "status" "public"."ClerkSyncStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 8,
    "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "last_error" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clerk_sync_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clerk_sync_tasks_status_next_retry_at_idx" ON "public"."clerk_sync_tasks"("status", "next_retry_at");
