-- Drop test table
DROP TABLE IF EXISTS test_table;

-- Create mindmaps table
CREATE TABLE IF NOT EXISTS "mindmaps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "viewport" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mindmaps_pkey" PRIMARY KEY ("id")
);

-- Create nodes table
CREATE TABLE IF NOT EXISTS "nodes" (
    "id" TEXT NOT NULL,
    "mindmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL,
    "style" JSONB NOT NULL DEFAULT '{}',
    "imageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "nodes_mindmapId_idx" ON "nodes"("mindmapId");
CREATE INDEX IF NOT EXISTS "nodes_title_idx" ON "nodes"("title");
CREATE INDEX IF NOT EXISTS "nodes_isDeleted_idx" ON "nodes"("isDeleted");

-- Add foreign key constraint
ALTER TABLE "nodes" DROP CONSTRAINT IF EXISTS "nodes_mindmapId_fkey";
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_mindmapId_fkey"
    FOREIGN KEY ("mindmapId") REFERENCES "mindmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
