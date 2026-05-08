-- CreateEnum
CREATE TYPE "public"."OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."OutboxEvents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregate_id" UUID NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "correlation_id" UUID,
    "request_id" UUID,
    "delivery_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(6),

    CONSTRAINT "OutboxEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvents_aggregate_id_event_type_key" ON "public"."OutboxEvents"("aggregate_id", "event_type");

-- CreateIndex
CREATE INDEX "OutboxEvents_status_created_at_idx" ON "public"."OutboxEvents"("status", "created_at");

-- CreateIndex
CREATE INDEX "OutboxEvents_aggregate_id_idx" ON "public"."OutboxEvents"("aggregate_id");
