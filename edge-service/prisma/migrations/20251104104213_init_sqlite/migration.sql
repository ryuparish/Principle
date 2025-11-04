-- CreateTable
CREATE TABLE "mindmaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "viewport" TEXT NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mindmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{}',
    "position" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT '{}',
    "imageIds" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "nodes_mindmapId_fkey" FOREIGN KEY ("mindmapId") REFERENCES "mindmaps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mindmapId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "label" TEXT,
    "style" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Node_mindmapId_idx" ON "nodes"("mindmapId");

-- CreateIndex
CREATE INDEX "nodes_title_idx" ON "nodes"("title");

-- CreateIndex
CREATE INDEX "nodes_isDeleted_idx" ON "nodes"("isDeleted");

-- CreateIndex
CREATE INDEX "Edge_mindmapId_idx" ON "edges"("mindmapId");

-- CreateIndex
CREATE INDEX "edges_sourceNodeId_idx" ON "edges"("sourceNodeId");

-- CreateIndex
CREATE INDEX "edges_targetNodeId_idx" ON "edges"("targetNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "edges_sourceNodeId_targetNodeId_key" ON "edges"("sourceNodeId", "targetNodeId");
