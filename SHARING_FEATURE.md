# Concept Map Sharing Feature - Design Document

## Executive Summary

This document outlines the design for a comprehensive sharing system for Principle concept maps, enabling users to share maps via public URLs, download as JSON/HTML files, and access maps through a public API.

**Key Capabilities**:
- 🌐 Public URL sharing (anyone with link can view)
- 🔐 Authenticated sharing (share with specific users - future)
- 📄 Export to JSON format (machine-readable, version-controllable)
- 🌍 Export to standalone HTML (single-file viewer, no server needed)
- 🔌 Public API endpoint for programmatic access
- 🔍 Interactive HTML viewer with search, zoom, and navigation

**Design Philosophy**: Build public sharing first (no auth required), with architecture that supports adding user authentication later.

---

## 1. Current System Architecture

### Entities
```
ConceptMap (root)
├─ id: UUID
├─ name: string
├─ description?: string
├─ viewport: {x, y, zoom}
└─ nodes: Node[]

Node
├─ id: UUID
├─ conceptMapId: UUID (FK)
├─ title: string
├─ content: JSON (TipTap document)
├─ position: {x, y}
├─ style: JSON
├─ shape: string
├─ imageIds: string[]
├─ tags: string[]
└─ isDeleted: boolean

Edge
├─ id: UUID
├─ conceptMapId: UUID
├─ sourceNodeId: UUID
├─ targetNodeId: UUID
├─ label?: string
└─ style: JSON

Media
├─ id: UUID
├─ nodeId?: UUID
├─ filename: string
├─ url: string
└─ thumbnailUrl: string
```

### Missing for Sharing
- No ownership/user model
- No sharing permissions
- No public/private visibility flags
- No share tokens/slugs for clean URLs

---

## 2. Feature Design

### 2.1 Public Sharing (Phase 1 - No Auth)

Every concept map gets a shareable URL that allows view-only access.

**URL Structure**:
```
https://yourapp.com/share/{shareSlug}
https://yourapp.com/share/my-concept-map-abc123
```

**ShareSlug**: URL-friendly identifier (e.g., "introduction-to-react-x7k3p")
- Derived from map name + random suffix
- Unique across all maps
- Persisted in database

**Visibility Options**:
- `private`: Only accessible by owner (default for now, since no auth)
- `public`: Accessible via share URL by anyone
- `unlisted`: Public but not listed in search/directory

**Share Token** (optional):
- Random cryptographic token for additional security
- Enables password-free sharing without making map fully public
- URL: `/share/{shareSlug}?token={shareToken}`

### 2.2 Authenticated Sharing (Phase 2 - Future)

Requires building user authentication system first.

**User Model** (future):
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
```

**ConceptMap Extensions** (future):
```typescript
interface ConceptMap {
  // ... existing fields
  ownerId: string;  // User who created the map
  visibility: 'private' | 'public' | 'unlisted';
  sharedWith: string[];  // Array of user IDs
}
```

**Sharing Permissions**:
- Owner can share with specific users
- Shared users can view but not edit (view-only)
- Optional: Add "can edit" permission level

### 2.3 JSON Export Format

**Complete Map Export**:
```json
{
  "version": "1.0",
  "exportedAt": "2025-12-30T12:00:00Z",
  "map": {
    "id": "uuid",
    "name": "My Concept Map",
    "description": "Description here",
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "createdAt": "...",
    "updatedAt": "..."
  },
  "nodes": [
    {
      "id": "uuid",
      "title": "Node Title",
      "content": {"type": "doc", "content": [...]},
      "position": {"x": 100, "y": 200},
      "style": {...},
      "shape": "rounded-rectangle",
      "imageIds": ["img1", "img2"],
      "tags": ["tag1", "tag2"],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceNodeId": "node1",
      "targetNodeId": "node2",
      "label": "connects to",
      "style": {"strokeColor": "#000", ...},
      "createdAt": "..."
    }
  ],
  "media": [
    {
      "id": "img1",
      "nodeId": "node1",
      "originalName": "diagram.png",
      "url": "https://yourapp.com/api/media/file/...",
      "thumbnailUrl": "https://yourapp.com/api/media/file/...",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

**Design Decisions**:
- Include version number for future format changes
- Export timestamp for reference
- Complete node content (including TipTap JSON)
- Media URLs point to server (not embedded)
- Preserves all IDs for potential re-import

**Use Cases**:
- Backup/restore
- Version control (commit to git)
- Data migration
- Programmatic analysis
- Import into other tools

### 2.4 HTML Standalone Viewer

**Single-file HTML export** with embedded data and viewer code.

**Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Concept Map - Principle</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Embedded CSS for viewer */
  </style>
</head>
<body>
  <div id="viewer"></div>

  <script>
    // Embedded concept map data
    const CONCEPT_MAP_DATA = {
      /* JSON export embedded here */
    };
  </script>

  <script>
    // Embedded ReactFlow or custom viewer code
    // React + ReactFlow libraries (minified)
    // Viewer component code
  </script>
</body>
</html>
```

**Viewer Features**:
1. **Navigation**: Pan, zoom, click nodes to expand
2. **Search**: Filter nodes by title (fuzzy search)
3. **Tag Filtering**: Show/hide nodes by tags
4. **Export**: Button to download embedded JSON
5. **Responsive**: Works on mobile/tablet
6. **No Dependencies**: All code and data embedded

**Technical Approach**:

**Option A: Bundle with Vite/Webpack** (Recommended)
- Create separate viewer app in `client/viewer/`
- Build with Vite to get optimized bundle
- Template HTML with placeholder for data injection
- Server-side: Inject JSON data into template
- Result: ~200-500KB HTML file (minified)

**Option B: CDN-based lightweight viewer**
- Load React + ReactFlow from CDN
- Simpler viewer code
- Faster to implement
- Larger file size (libraries not bundled)

**Recommendation**: Option A for better performance and offline capability

### 2.5 Share API Endpoints

**New Endpoints**:

```typescript
// Get complete concept map data (JSON export format)
GET /api/share/:shareSlug
GET /api/share/:shareSlug?token=abc123  // With optional token

Response:
{
  "version": "1.0",
  "exportedAt": "...",
  "map": {...},
  "nodes": [...],
  "edges": [...],
  "media": [...]
}

// Download JSON file
GET /api/share/:shareSlug/download.json
Response: Downloads file "my-concept-map.json"

// Download HTML viewer
GET /api/share/:shareSlug/download.html
Response: Downloads file "my-concept-map.html"

// View in browser (HTML viewer)
GET /share/:shareSlug
Response: Renders HTML viewer page

// Enable public sharing (create share slug)
POST /api/mindmaps/:id/share
Body: { visibility: 'public' | 'unlisted' }
Response: { shareSlug: "...", shareUrl: "..." }

// Disable public sharing
DELETE /api/mindmaps/:id/share
Response: { success: true }

// Get sharing settings
GET /api/mindmaps/:id/share
Response: {
  visibility: 'private' | 'public' | 'unlisted',
  shareSlug: "...",
  shareUrl: "...",
  shareToken: "..."
}
```

**Security Considerations**:
- Rate limiting on share endpoints (prevent scraping)
- Optional token for "secret" unlisted sharing
- CORS headers for API access
- Cache-Control headers for performance

---

## 3. Database Schema Changes

### ConceptMap Table Additions

```sql
ALTER TABLE conceptmap ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
ALTER TABLE conceptmap ADD COLUMN share_slug VARCHAR(255) UNIQUE;
ALTER TABLE conceptmap ADD COLUMN share_token VARCHAR(255);
ALTER TABLE conceptmap ADD COLUMN shared_at DATETIME;

CREATE INDEX idx_conceptmap_share_slug ON conceptmap(share_slug);
CREATE INDEX idx_conceptmap_visibility ON conceptmap(visibility);
```

**Entity Changes**:
```typescript
// node-service/src/entities/ConceptMap.ts

@Entity()
export class ConceptMap {
  // ... existing fields

  @Column({ type: 'varchar', length: 20, default: 'private' })
  visibility: 'private' | 'public' | 'unlisted';

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  shareSlug?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shareToken?: string;

  @Column({ type: 'datetime', nullable: true })
  sharedAt?: Date;
}
```

### Share Slug Generation

```typescript
function generateShareSlug(mapName: string): string {
  // 1. Convert to URL-friendly format
  const baseSlug = mapName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dash
    .replace(/^-|-$/g, '')         // Trim dashes
    .slice(0, 50);                 // Max 50 chars

  // 2. Add random suffix for uniqueness
  const randomSuffix = crypto.randomBytes(4).toString('hex');

  return `${baseSlug}-${randomSuffix}`;
  // Example: "introduction-to-react-a7f3c2b1"
}

function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
  // Example: "xK7p9mNqW2vR4zL8sJ3fT6hY5nB1cV0"
}
```

---

## 4. Implementation Phases

### Phase 1: Core API & JSON Export (Week 1)

**Goals**:
- Add database schema changes
- Implement share slug generation
- Create share API endpoints
- Build JSON export functionality

**Files to Create/Modify**:
```
node-service/src/entities/ConceptMap.ts          # Add sharing fields
node-service/src/services/mindmap.service.ts     # Share logic
node-service/src/services/share.service.ts       # NEW: Share export logic
node-service/src/controllers/share.controller.ts # NEW: Share endpoints
api-gateway/src/routes/share.routes.ts           # NEW: Gateway routing
client/src/api/share.api.ts                      # NEW: Frontend API
client/src/types/index.ts                        # Add share types
```

**Deliverables**:
- ✅ Database migration for sharing fields
- ✅ POST /api/mindmaps/:id/share (enable sharing)
- ✅ GET /api/share/:shareSlug (get map JSON)
- ✅ GET /api/share/:shareSlug/download.json
- ✅ DELETE /api/mindmaps/:id/share (disable sharing)

### Phase 2: HTML Viewer (Week 2)

**Goals**:
- Build standalone HTML viewer app
- Create viewer bundling system
- Implement server-side template injection
- Add download HTML endpoint

**Files to Create**:
```
client/viewer/                              # NEW: Viewer app directory
client/viewer/src/App.tsx                   # Main viewer component
client/viewer/src/components/ViewerCanvas.tsx
client/viewer/src/components/SearchBar.tsx
client/viewer/src/components/ExportButton.tsx
client/viewer/vite.config.ts                # Viewer build config
client/viewer/index.html                    # Template with placeholder
node-service/src/services/html-generator.service.ts # NEW: HTML generation
```

**Deliverables**:
- ✅ Viewer app with pan/zoom/search
- ✅ Build script to generate viewer bundle
- ✅ Server endpoint: GET /api/share/:shareSlug/download.html
- ✅ Template injection system
- ✅ Export JSON button in viewer

### Phase 3: Frontend UI Integration (Week 3)

**Goals**:
- Add share button to concept map UI
- Create share modal/dialog
- Display share URL and copy button
- Add download options (JSON/HTML)

**Files to Create/Modify**:
```
client/src/components/Share/ShareModal.tsx       # NEW: Share dialog
client/src/components/Share/ShareButton.tsx      # NEW: Toolbar button
client/src/components/ConceptMapList.tsx         # Add share indicators
client/src/store/conceptMapStore.ts              # Add share actions
client/src/components/Canvas/ConceptMapCanvas.tsx # Integrate share button
```

**Deliverables**:
- ✅ Share button in concept map toolbar
- ✅ Share modal with URL copy functionality
- ✅ Download JSON button
- ✅ Download HTML button
- ✅ Public/Unlisted toggle
- ✅ Share indicator on map list

### Phase 4: Public Viewer Page (Week 4)

**Goals**:
- Create public viewer route
- Render HTML viewer for shared maps
- Add meta tags for social sharing
- Implement error pages (not found, private)

**Files to Create/Modify**:
```
client/src/pages/PublicViewer.tsx           # NEW: Public viewer page
client/src/routes.tsx                       # Add /share/:slug route
api-gateway/src/routes/share.routes.ts      # Add HTML rendering
client/src/components/Share/NotFound.tsx    # NEW: 404 page
```

**Deliverables**:
- ✅ GET /share/:shareSlug route
- ✅ Public viewer page renders maps
- ✅ Error handling (404, private maps)
- ✅ Meta tags for social sharing (Open Graph)
- ✅ Mobile-responsive viewer

### Phase 5: Polish & Testing (Week 5)

**Goals**:
- Performance optimization
- Security audit
- End-to-end testing
- Documentation

**Tasks**:
- Rate limiting on share endpoints
- Caching strategy for public maps
- Test large maps (1000+ nodes)
- Test offline HTML viewer
- Write user documentation
- API documentation

---

## 5. Detailed Component Design

### 5.1 Share Service (Backend)

**Location**: `node-service/src/services/share.service.ts`

```typescript
export class ShareService {
  /**
   * Enable sharing for a concept map
   * Generates share slug and optional token
   */
  async enableSharing(
    mapId: string,
    options: {
      visibility: 'public' | 'unlisted';
      regenerateSlug?: boolean;
    }
  ): Promise<{
    shareSlug: string;
    shareToken?: string;
    shareUrl: string;
  }> {
    const map = await this.conceptMapRepo.findOneBy({ id: mapId });
    if (!map) throw new Error('Map not found');

    // Generate slug if not exists or regenerate requested
    if (!map.shareSlug || options.regenerateSlug) {
      map.shareSlug = await this.generateUniqueSlug(map.name);
    }

    // Generate token for unlisted maps
    if (options.visibility === 'unlisted' && !map.shareToken) {
      map.shareToken = generateShareToken();
    }

    map.visibility = options.visibility;
    map.sharedAt = new Date();

    await this.conceptMapRepo.save(map);

    const shareUrl = `${process.env.APP_URL}/share/${map.shareSlug}`;

    return {
      shareSlug: map.shareSlug,
      shareToken: map.shareToken,
      shareUrl
    };
  }

  /**
   * Get complete concept map data for sharing
   * Returns JSON export format
   */
  async getSharedMapData(
    shareSlug: string,
    token?: string
  ): Promise<ConceptMapExport> {
    const map = await this.conceptMapRepo.findOne({
      where: { shareSlug },
      relations: ['nodes']
    });

    if (!map) {
      throw new NotFoundError('Map not found');
    }

    // Check visibility and token
    if (map.visibility === 'private') {
      throw new ForbiddenError('This map is not shared');
    }

    if (map.visibility === 'unlisted' && map.shareToken !== token) {
      throw new ForbiddenError('Invalid share token');
    }

    // Fetch edges
    const edges = await this.edgeService.getByConceptMapId(map.id);

    // Fetch media for all nodes
    const nodeIds = map.nodes.map(n => n.id);
    const media = await this.mediaService.getByNodeIds(nodeIds);

    // Build export object
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      map: {
        id: map.id,
        name: map.name,
        description: map.description,
        viewport: map.viewport,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt
      },
      nodes: map.nodes.filter(n => !n.isDeleted).map(this.sanitizeNode),
      edges: edges.map(this.sanitizeEdge),
      media: media.map(this.sanitizeMedia)
    };
  }

  /**
   * Generate unique share slug
   * Checks for collisions and retries if needed
   */
  private async generateUniqueSlug(mapName: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const slug = generateShareSlug(mapName);
      const existing = await this.conceptMapRepo.findOneBy({ shareSlug: slug });

      if (!existing) {
        return slug;
      }

      attempts++;
    }

    // Fallback: use UUID-based slug
    return `map-${uuidv4()}`;
  }

  /**
   * Generate standalone HTML viewer file
   */
  async generateHTMLViewer(shareSlug: string, token?: string): Promise<string> {
    const data = await this.getSharedMapData(shareSlug, token);

    // Load viewer template
    const template = await fs.readFile(
      path.join(__dirname, '../../viewer-template.html'),
      'utf-8'
    );

    // Inject data into template
    const html = template.replace(
      '/* CONCEPT_MAP_DATA_PLACEHOLDER */',
      `const CONCEPT_MAP_DATA = ${JSON.stringify(data, null, 2)};`
    );

    return html;
  }
}
```

### 5.2 Share Controller (Backend)

**Location**: `node-service/src/controllers/share.controller.ts`

```typescript
export class ShareController {
  private shareService: ShareService;

  /**
   * GET /share/:shareSlug
   * Returns complete map data as JSON
   */
  async getSharedMap(req: Request, res: Response) {
    try {
      const { shareSlug } = req.params;
      const { token } = req.query;

      const data = await this.shareService.getSharedMapData(
        shareSlug,
        token as string
      );

      res.json(data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: 'Map not found' });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch shared map' });
    }
  }

  /**
   * GET /share/:shareSlug/download.json
   * Downloads map as JSON file
   */
  async downloadJSON(req: Request, res: Response) {
    const { shareSlug } = req.params;
    const { token } = req.query;

    const data = await this.shareService.getSharedMapData(
      shareSlug,
      token as string
    );

    const filename = `${shareSlug}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  }

  /**
   * GET /share/:shareSlug/download.html
   * Downloads standalone HTML viewer
   */
  async downloadHTML(req: Request, res: Response) {
    const { shareSlug } = req.params;
    const { token } = req.query;

    const html = await this.shareService.generateHTMLViewer(
      shareSlug,
      token as string
    );

    const filename = `${shareSlug}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  }
}
```

### 5.3 Share Modal (Frontend)

**Location**: `client/src/components/Share/ShareModal.tsx`

```typescript
export const ShareModal: React.FC<{
  conceptMapId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ conceptMapId, isOpen, onClose }) => {
  const [sharing, setSharing] = useState<ShareSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load current sharing settings
  useEffect(() => {
    if (isOpen) {
      loadSharingSettings();
    }
  }, [isOpen]);

  const loadSharingSettings = async () => {
    try {
      const settings = await shareApi.getSettings(conceptMapId);
      setSharing(settings);
    } catch (error) {
      // Not shared yet
      setSharing(null);
    }
  };

  const handleEnableSharing = async (visibility: 'public' | 'unlisted') => {
    setLoading(true);
    try {
      const result = await shareApi.enableSharing(conceptMapId, { visibility });
      setSharing(result);
    } catch (error) {
      alert('Failed to enable sharing');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    if (!confirm('Disable sharing? The share URL will stop working.')) return;

    setLoading(true);
    try {
      await shareApi.disableSharing(conceptMapId);
      setSharing(null);
    } catch (error) {
      alert('Failed to disable sharing');
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = () => {
    if (!sharing) return;
    navigator.clipboard.writeText(sharing.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    if (!sharing) return;
    window.open(`/api/share/${sharing.shareSlug}/download.json`, '_blank');
  };

  const downloadHTML = () => {
    if (!sharing) return;
    window.open(`/api/share/${sharing.shareSlug}/download.html`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Share Concept Map</h2>

      {!sharing ? (
        <div className="enable-sharing">
          <p>Enable sharing to get a public link to this concept map.</p>
          <button onClick={() => handleEnableSharing('public')}>
            Make Public
          </button>
          <button onClick={() => handleEnableSharing('unlisted')}>
            Unlisted (Secret Link)
          </button>
        </div>
      ) : (
        <div className="sharing-active">
          <div className="share-url">
            <input
              type="text"
              value={sharing.shareUrl}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button onClick={copyShareUrl}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="visibility-badge">
            {sharing.visibility === 'public' ? '🌐 Public' : '🔒 Unlisted'}
          </div>

          <div className="download-options">
            <h3>Download</h3>
            <button onClick={downloadJSON}>
              📄 Download as JSON
            </button>
            <button onClick={downloadHTML}>
              🌍 Download as HTML
            </button>
          </div>

          <button onClick={handleDisableSharing} className="danger">
            Disable Sharing
          </button>
        </div>
      )}
    </Modal>
  );
};
```

### 5.4 HTML Viewer Template

**Location**: `node-service/templates/viewer-template.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{MAP_NAME}} - Principle Concept Map</title>
  <meta name="description" content="{{MAP_DESCRIPTION}}">

  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="{{MAP_NAME}}">
  <meta property="og:description" content="{{MAP_DESCRIPTION}}">
  <meta property="og:type" content="website">

  <style>
    /* Reset & Base */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    /* Toolbar */
    .viewer-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      z-index: 1000;
    }

    .viewer-title {
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }

    .viewer-search {
      width: 300px;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
    }

    .viewer-button {
      padding: 8px 16px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .viewer-button:hover {
      background: #0052a3;
    }

    /* Canvas */
    #viewer-canvas {
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      bottom: 0;
    }

    /* ReactFlow overrides */
    .react-flow__node {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="viewer-toolbar">
    <div class="viewer-title">{{MAP_NAME}}</div>
    <input
      type="text"
      class="viewer-search"
      placeholder="Search nodes..."
      id="search-input"
    />
    <button class="viewer-button" onclick="exportJSON()">
      Export JSON
    </button>
  </div>

  <div id="viewer-canvas"></div>

  <script>
    /* CONCEPT_MAP_DATA_PLACEHOLDER */
  </script>

  <script>
    /* VIEWER_CODE_BUNDLE */
    // React, ReactFlow, and viewer component code will be injected here during build
  </script>
</body>
</html>
```

---

## 6. Security Considerations

### 6.1 Access Control

**Public Visibility**:
- Anyone with URL can view
- No authentication required
- Rate limit: 100 requests/minute per IP

**Unlisted Visibility**:
- Requires share token in URL
- Token is cryptographically secure (32 bytes)
- Not guessable, not in public listings
- Rate limit: Same as public

**Private Visibility**:
- Returns 403 Forbidden
- Even with correct slug
- Future: Require authentication

### 6.2 Rate Limiting

```typescript
// api-gateway/src/middleware/rateLimiter.ts

const shareLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/share', shareLimiter);
```

### 6.3 Data Sanitization

**Remove Sensitive Data**:
- Never expose internal system fields
- Don't include soft-deleted nodes
- Sanitize user-generated content (future)

```typescript
function sanitizeNode(node: Node) {
  return {
    id: node.id,
    title: node.title,
    content: node.content,
    position: node.position,
    style: node.style,
    shape: node.shape,
    imageIds: node.imageIds,
    tags: node.tags,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    // Excluded: isDeleted, deletedAt, conceptMapId
  };
}
```

### 6.4 CORS Configuration

```typescript
// api-gateway/src/index.ts

app.use('/api/share', cors({
  origin: '*', // Allow all origins for public API
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));
```

---

## 7. Performance Optimizations

### 7.1 Caching Strategy

**Redis Caching** (future):
```typescript
// Cache shared map data for 5 minutes
const cacheKey = `share:${shareSlug}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await this.getSharedMapData(shareSlug);
await redis.setex(cacheKey, 300, JSON.stringify(data));
return data;
```

**HTTP Caching Headers**:
```typescript
res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
res.setHeader('ETag', generateETag(data));
```

### 7.2 HTML Viewer Optimizations

**Lazy Loading**:
- Load ReactFlow only when needed
- Defer non-critical scripts
- Lazy load images in nodes

**Minification**:
- Minify JavaScript bundle
- Minify CSS
- Compress HTML output
- Use Brotli compression for large maps

**Target Size**:
- Empty viewer: ~150KB gzipped
- With typical map (50 nodes): ~200KB gzipped
- With large map (500 nodes): ~500KB gzipped

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// share.service.test.ts

describe('ShareService', () => {
  it('generates unique share slugs', async () => {
    const slug1 = await shareService.generateUniqueSlug('My Map');
    const slug2 = await shareService.generateUniqueSlug('My Map');
    expect(slug1).not.toBe(slug2);
  });

  it('prevents access to private maps', async () => {
    await expect(
      shareService.getSharedMapData('private-map-slug')
    ).rejects.toThrow(ForbiddenError);
  });

  it('requires token for unlisted maps', async () => {
    await expect(
      shareService.getSharedMapData('unlisted-map-slug')
    ).rejects.toThrow(ForbiddenError);

    const data = await shareService.getSharedMapData(
      'unlisted-map-slug',
      'correct-token'
    );
    expect(data).toBeDefined();
  });
});
```

### 8.2 Integration Tests

```typescript
// share.integration.test.ts

describe('Share API', () => {
  it('enables sharing for a map', async () => {
    const map = await createTestMap();

    const response = await request(app)
      .post(`/api/mindmaps/${map.id}/share`)
      .send({ visibility: 'public' })
      .expect(200);

    expect(response.body.shareSlug).toBeDefined();
    expect(response.body.shareUrl).toContain('/share/');
  });

  it('returns complete map data via share URL', async () => {
    const map = await createSharedMap();

    const response = await request(app)
      .get(`/api/share/${map.shareSlug}`)
      .expect(200);

    expect(response.body.version).toBe('1.0');
    expect(response.body.map.id).toBe(map.id);
    expect(response.body.nodes).toBeInstanceOf(Array);
    expect(response.body.edges).toBeInstanceOf(Array);
  });
});
```

### 8.3 E2E Tests

```typescript
// share.e2e.test.ts

describe('Share Feature E2E', () => {
  it('allows user to share a map and access via public URL', async () => {
    // 1. Create a map
    await page.goto('/');
    await page.click('[data-testid="create-map"]');
    await page.fill('input[name="map-name"]', 'Test Map');
    await page.click('[data-testid="confirm"]');

    // 2. Enable sharing
    await page.click('[data-testid="share-button"]');
    await page.click('[data-testid="enable-public-sharing"]');

    // 3. Get share URL
    const shareUrl = await page.inputValue('[data-testid="share-url"]');

    // 4. Open in new incognito context (simulate different user)
    const context = await browser.newContext();
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);

    // 5. Verify map loads
    await newPage.waitForSelector('[data-testid="viewer-canvas"]');
    const title = await newPage.textContent('[data-testid="viewer-title"]');
    expect(title).toBe('Test Map');
  });
});
```

---

## 9. Future Enhancements

### Phase 6+: Authentication & Collaboration

**User Accounts**:
- Email/password authentication
- OAuth (Google, GitHub)
- User profiles

**Advanced Sharing**:
- Share with specific users
- Edit permissions
- Commenting on nodes
- Real-time collaboration

**Version History**:
- Track all changes
- Restore previous versions
- Compare versions (diff view)
- Branch/fork maps

**Embeddable Widget**:
```html
<iframe
  src="https://yourapp.com/embed/share-slug"
  width="800"
  height="600"
  frameborder="0"
></iframe>
```

**Public Gallery**:
- Browse public maps
- Featured/trending maps
- Search by tags/topics
- Like/bookmark maps

---

## 10. Success Metrics

**Technical Metrics**:
- Share API response time < 200ms (p95)
- HTML viewer loads in < 2s
- JSON export size < 1MB for typical map
- Zero security vulnerabilities

**User Metrics**:
- % of maps that are shared
- Share link click-through rate
- JSON downloads per month
- HTML downloads per month
- API usage (requests/day)

**Quality Metrics**:
- Test coverage > 80%
- Zero data loss incidents
- 99.9% uptime for share endpoints

---

## 11. Open Questions

1. **Media Handling**: Should HTML export embed images as base64 or link to server?
   - **Recommendation**: Link to server for smaller files, offer "embed images" option

2. **Import Feature**: Should we support importing JSON back into the app?
   - **Recommendation**: Yes, Phase 6 feature for backups/migration

3. **API Authentication**: Should the share API require API keys for programmatic access?
   - **Recommendation**: No for read-only public access, yes for write access (future)

4. **Viewer Customization**: Should users be able to customize the HTML viewer appearance?
   - **Recommendation**: Phase 7 feature - theme customization in export options

---

## Conclusion

This design provides a comprehensive sharing system that:
- ✅ Enables public URL sharing without authentication
- ✅ Exports to JSON for data portability
- ✅ Exports to standalone HTML for offline viewing
- ✅ Provides API access for programmatic integration
- ✅ Architected for future authentication and collaboration features
- ✅ Maintains security and performance
- ✅ Follows existing codebase patterns

**Estimated Timeline**: 5 weeks for complete implementation
**Team Size**: 1-2 developers
**Risk Level**: Medium (new infrastructure, no auth system yet)

**Recommendation**: Start with Phase 1 (Core API & JSON Export) to validate the approach, then proceed with HTML viewer and frontend integration.
