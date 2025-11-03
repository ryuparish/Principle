-- Create edges table
CREATE TABLE IF NOT EXISTS "edges" (
    "id" TEXT NOT NULL,
    "mindmapId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "label" TEXT,
    "style" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "edges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "edges_sourceNodeId_targetNodeId_key" UNIQUE ("sourceNodeId", "targetNodeId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "edges_mindmapId_idx" ON "edges"("mindmapId");
CREATE INDEX IF NOT EXISTS "edges_sourceNodeId_idx" ON "edges"("sourceNodeId");
CREATE INDEX IF NOT EXISTS "edges_targetNodeId_idx" ON "edges"("targetNodeId");
