-- Add shareToken column as nullable first for existing rows
ALTER TABLE "Group" ADD COLUMN "shareToken" TEXT;

-- Backfill existing rows with unique tokens
UPDATE "Group" SET "shareToken" = gen_random_uuid()::text WHERE "shareToken" IS NULL;

-- Add unique constraint and make NOT NULL
ALTER TABLE "Group" ALTER COLUMN "shareToken" SET NOT NULL;
CREATE UNIQUE INDEX "Group_shareToken_key" ON "Group"("shareToken");
