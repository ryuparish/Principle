-- Create media table
CREATE TABLE IF NOT EXISTS "media" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_filename_key" UNIQUE ("filename")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "media_nodeId_idx" ON "media"("nodeId");
CREATE INDEX IF NOT EXISTS "media_filename_idx" ON "media"("filename");
