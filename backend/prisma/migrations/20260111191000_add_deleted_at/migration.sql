-- Add deleted_at column to blocks (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blocks' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE "blocks" ADD COLUMN "deleted_at" TIMESTAMP;
    END IF;
END $$;

-- Add deleted_at column to tasks (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE "tasks" ADD COLUMN "deleted_at" TIMESTAMP;
    END IF;
END $$;

-- Create indexes for deleted_at (idempotent)
CREATE INDEX IF NOT EXISTS "blocks_deleted_at_idx" ON "blocks"("deleted_at");
CREATE INDEX IF NOT EXISTS "tasks_deleted_at_idx" ON "tasks"("deleted_at");
