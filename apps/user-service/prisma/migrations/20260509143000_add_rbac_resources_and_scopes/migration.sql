-- CreateEnum
CREATE TYPE "public"."PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'VALIDATE', 'MANAGE');

-- CreateEnum
CREATE TYPE "public"."PermissionScope" AS ENUM ('OWN', 'CINEMA', 'GLOBAL');

-- CreateTable
CREATE TABLE "public"."resources" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_code_key" ON "public"."resources"("code");

-- Add columns to permissions in a backfill-safe way
ALTER TABLE "public"."permissions" ADD COLUMN "action" "public"."PermissionAction";
ALTER TABLE "public"."permissions" ADD COLUMN "scope" "public"."PermissionScope";
ALTER TABLE "public"."permissions" ADD COLUMN "resource_id" TEXT;

-- Seed a fallback resource for legacy rows
INSERT INTO "public"."resources" ("id", "code", "description")
VALUES ('res_legacy', 'legacy', 'Legacy permissions migrated before resource-action-scope rollout')
ON CONFLICT ("code") DO NOTHING;

-- Backfill existing rows
UPDATE "public"."permissions"
SET "action" = 'MANAGE',
    "scope" = 'GLOBAL',
    "resource_id" = (SELECT "id" FROM "public"."resources" WHERE "code" = 'legacy' LIMIT 1)
WHERE "action" IS NULL OR "scope" IS NULL OR "resource_id" IS NULL;

-- Enforce not-null after backfill
ALTER TABLE "public"."permissions" ALTER COLUMN "action" SET NOT NULL;
ALTER TABLE "public"."permissions" ALTER COLUMN "scope" SET NOT NULL;
ALTER TABLE "public"."permissions" ALTER COLUMN "resource_id" SET NOT NULL;

-- Add FK
ALTER TABLE "public"."permissions"
ADD CONSTRAINT "permissions_resource_id_fkey"
FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
