-- RenameColumn: firebase_uid to clerk_id
ALTER TABLE "users" RENAME COLUMN "firebase_uid" TO "clerk_id";

-- RenameIndex: rename unique index
DROP INDEX IF EXISTS "users_firebase_uid_key";
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- RenameIndex: rename regular index
DROP INDEX IF EXISTS "users_firebase_uid_idx";
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");
