-- Add staff <-> Clerk mapping
ALTER TABLE "public"."staffs"
ADD COLUMN IF NOT EXISTS "clerk_user_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "staffs_clerk_user_id_key"
ON "public"."staffs"("clerk_user_id");

-- Webhook idempotency store
CREATE TABLE IF NOT EXISTS "public"."clerk_webhook_events" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clerk_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "clerk_webhook_events_event_id_key"
ON "public"."clerk_webhook_events"("event_id");
