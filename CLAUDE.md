# Claude Code Project Instructions

## CRITICAL: Image Upload Fix (MCP Server)

**Problem:** The MCP server's `mcp__principle__upload_image` tool fails with `"no such table: media"` error.

**Root Cause:** The MCP server uses sql.js which loads the SQLite database into memory at startup. The `media` table didn't exist in the original schema, and `synchronize: false` prevents auto-creation.

**The Fix (Already Applied):**
1. Added `ensureMediaTable()` method in `mcp-server/src/services/MediaService.ts` that creates the table on-demand before any media operation
2. Added the same table creation logic in `mcp-server/src/config/database.ts` during initialization

**If the error still occurs:** The MCP server is caching an old database state. Solutions:
1. **Preferred:** Use the media-service REST API instead:
   ```bash
   curl -X POST http://localhost:3003/upload \
     -F "image=@/path/to/image.png" \
     -F "nodeId=<node-uuid>"
   ```
2. **Alternative:** Restart Claude Code to restart the MCP server (which will pick up the fix)
3. **Manual fix:** Create the table directly:
   ```bash
   sqlite3 /Users/ryuparish/Code/Principle/node-service/dev.db << 'EOF'
   CREATE TABLE IF NOT EXISTS media (
     id TEXT PRIMARY KEY,
     nodeId TEXT,
     filename TEXT UNIQUE,
     thumbnailFilename TEXT,
     originalName TEXT NOT NULL,
     mimeType TEXT NOT NULL,
     sizeBytes INTEGER NOT NULL,
     width INTEGER,
     height INTEGER,
     url TEXT,
     thumbnailUrl TEXT,
     s3Key TEXT,
     s3Url TEXT,
     thumbnailS3Key TEXT,
     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   CREATE INDEX IF NOT EXISTS idx_media_nodeId ON media(nodeId);
   CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
   EOF
   ```
   Then restart the MCP server.

**Remember:** The MCP server's sql.js database is in-memory. Direct sqlite3 modifications to the file won't be seen until the MCP server restarts and reloads the file.

---

## Concept Map Creation Guidelines

When creating concept maps using the Principle MCP server, ALWAYS apply auto-layout after adding nodes and edges. The default parameters are now optimized for well-spaced layouts:

```
Default auto-layout parameters (no need to specify unless customizing):
- width: 8000
- height: 6000
- linkDistance: 600
- repulsionStrength: -5000
- collisionRadius: 300
- iterations: 600
```

Simply call `mcp__principle__auto_layout` with just the mapId - the defaults will spread nodes out well.

### Best Practices for Concept Maps:
1. Create all nodes first using batch_create_nodes
2. Create all edges using batch_create_edges
3. Apply auto_layout as the final step (defaults are sufficient for most maps)
4. If the user says nodes are still crowded, you can increase repulsionStrength to -8000 or -10000
