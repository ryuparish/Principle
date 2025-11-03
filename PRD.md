# Product Requirements Document (PRD)
# Principle - Interactive World Mindmap Application

**Version:** 1.0
**Date:** November 1, 2025
**Status:** Draft
**Author:** System Architect

---

## 1. Executive Summary

### 1.1 Product Overview
Principle is an interactive, node-based mindmap application designed to help users visualize and organize their entire world of knowledge. Each node functions as a rich content canvas (whiteboard) containing text and images, similar to a presentation slide. Nodes can branch and interconnect, forming a navigable graph structure that represents relationships between ideas, concepts, and information.

### 1.2 Vision Statement
To create the most intuitive and flexible personal knowledge management system that allows users to build, navigate, and evolve their mental models through an infinite, interactive canvas.

### 1.3 Target Users
- Knowledge workers organizing complex information
- Students building study materials and concept maps
- Writers planning stories and world-building
- Researchers mapping literature and ideas
- Creatives organizing projects and inspiration
- Anyone who thinks visually and wants to map their knowledge

### 1.4 Key Differentiators
- **Rich Content Nodes:** Each node is a full whiteboard with text + images, not just a label
- **Microservices Architecture:** Scalable, maintainable, independently deployable services
- **Local-First:** All data stored locally with full privacy and offline capability
- **Extensible:** Easy to add AI capabilities and external integrations via wrapper services
- **Graph-Based:** True graph structure, not just hierarchical trees

---

## 2. Goals and Objectives

### 2.1 Primary Goals
1. ✅ Create an intuitive mindmap interface that feels natural to use
2. ✅ Enable users to create rich content nodes with text and images
3. ✅ Allow flexible graph structures with multiple parent-child relationships
4. ✅ Ensure all user data is stored locally and private
5. ✅ Build with microservices for future scalability

### 2.2 Success Criteria
- Users can create and navigate 500+ nodes without performance degradation
- Image upload and display completes in < 2 seconds
- Node creation to display time < 500ms
- Zero data loss (100% persistence)
- All services run locally without external dependencies (except optional AI features)

### 2.3 Non-Goals (Out of Scope for MVP)
- ❌ Real-time collaboration (future phase)
- ❌ Mobile apps (future phase)
- ❌ Cloud sync (future phase)
- ❌ Blockchain/Web3 features
- ❌ Video/audio content (future phase)

---

## 3. User Personas and Use Cases

### 3.1 Primary Persona: "Knowledge Mapper Kyle"
- **Background:** Software engineer who reads a lot and wants to organize learnings
- **Goals:** Connect ideas from different sources, build knowledge graph
- **Pain Points:** Traditional note apps are linear, mind maps are too simple
- **Use Case:** Creates nodes for each concept, adds screenshots from articles, connects related ideas

### 3.2 Secondary Persona: "World-Builder Wendy"
- **Background:** Fantasy author building a complex fictional world
- **Goals:** Map locations, characters, events, and their relationships
- **Pain Points:** Needs both visual (maps/art) and text (descriptions) together
- **Use Case:** Each node is a location/character with images and lore text, connections show relationships

### 3.3 Tertiary Persona: "Student Sam"
- **Background:** Medical student preparing for exams
- **Goals:** Visual study materials with diagrams and notes
- **Pain Points:** Flashcards too isolated, notes too linear
- **Use Case:** Nodes for anatomy systems with diagrams, connected by physiological relationships

---

## 4. Functional Requirements

### 4.1 Core Features (MVP - Phase 1)

#### FR-1: Mindmap Management
- **FR-1.1:** User can create a new mindmap
- **FR-1.2:** User can view list of all mindmaps
- **FR-1.3:** User can open an existing mindmap
- **FR-1.4:** User can delete a mindmap
- **FR-1.5:** System remembers last viewport position (zoom and pan) per mindmap

#### FR-2: Node Operations
- **FR-2.1:** User can create a new node at any position on canvas
- **FR-2.2:** User can create a child node from an existing node (auto-positions and connects)
- **FR-2.3:** User can select a node by clicking
- **FR-2.4:** User can drag to reposition nodes
- **FR-2.5:** User can resize nodes (width/height)
- **FR-2.6:** User can delete nodes
- **FR-2.7:** System auto-saves node changes after 2 seconds of inactivity
- **FR-2.8:** Deleted nodes are soft-deleted for 30 days before permanent deletion

#### FR-3: Node Content - Text
- **FR-3.1:** User can add a title to each node
- **FR-3.2:** User can add rich text content (bold, italic, underline, lists)
- **FR-3.3:** User can format text with headings (H1, H2, H3)
- **FR-3.4:** User can create bulleted and numbered lists
- **FR-3.5:** User can add inline links
- **FR-3.6:** Text editor provides toolbar with formatting options
- **FR-3.7:** Text content supports markdown syntax

#### FR-4: Node Content - Images
- **FR-4.1:** User can upload images (PNG, JPG, GIF, WebP)
- **FR-4.2:** User can drag-drop images into node editor
- **FR-4.3:** User can add multiple images per node
- **FR-4.4:** User can reorder images within a node
- **FR-4.5:** User can remove images from nodes
- **FR-4.6:** Images are displayed inline with text content
- **FR-4.7:** User can click image to view full-size preview
- **FR-4.8:** System validates file size (max 10MB per image)
- **FR-4.9:** System validates file types

#### FR-5: Node Connections (Edges)
- **FR-5.1:** User can create directed edge from node A to node B
- **FR-5.2:** User can delete edges
- **FR-5.3:** Edges are visually represented as arrows
- **FR-5.4:** User can see which nodes connect to selected node
- **FR-5.5:** System prevents duplicate edges (same source and target)
- **FR-5.6:** System allows multiple parents per node (graph, not tree)

#### FR-6: Canvas Navigation
- **FR-6.1:** User can pan canvas by clicking and dragging empty space
- **FR-6.2:** User can zoom in/out with mouse wheel
- **FR-6.3:** User can zoom in/out with toolbar buttons
- **FR-6.4:** User can fit all nodes in viewport (zoom to fit)
- **FR-6.5:** User can center on a specific node
- **FR-6.6:** Canvas is infinite in all directions
- **FR-6.7:** Minimap shows overview of all nodes

#### FR-7: Node Styling
- **FR-7.1:** User can change node background color
- **FR-7.2:** User can choose from preset color palette
- **FR-7.3:** User can set custom border style
- **FR-7.4:** System provides default styling that looks clean

#### FR-8: Search and Navigation
- **FR-8.1:** User can search nodes by title
- **FR-8.2:** User can search nodes by text content
- **FR-8.3:** Search results highlight matching nodes on canvas
- **FR-8.4:** User can click search result to navigate to node

#### FR-9: Data Persistence
- **FR-9.1:** All node data stored in local PostgreSQL database
- **FR-9.2:** All images stored in local filesystem
- **FR-9.3:** System auto-saves every change
- **FR-9.4:** No cloud sync or external storage required
- **FR-9.5:** System provides data export (JSON format)

### 4.2 Advanced Features (Phase 2 - Future)

#### FR-10: Keyboard Shortcuts
- **FR-10.1:** Tab - Create child node
- **FR-10.2:** Delete/Backspace - Delete selected node
- **FR-10.3:** Cmd/Ctrl + F - Open search
- **FR-10.4:** Cmd/Ctrl + Z - Undo
- **FR-10.5:** Cmd/Ctrl + Shift + Z - Redo
- **FR-10.6:** Space + Drag - Pan canvas
- **FR-10.7:** Cmd/Ctrl + 0 - Reset zoom

#### FR-11: Context Menus
- **FR-11.1:** Right-click node shows context menu
- **FR-11.2:** Context menu options: Edit, Delete, Create Child, Duplicate, Change Color
- **FR-11.3:** Right-click canvas shows: Create Node, Paste

#### FR-12: Node Templates
- **FR-12.1:** User can save node as template
- **FR-12.2:** User can create node from template
- **FR-12.3:** Templates include content, style, and size

#### FR-13: Tags and Categories
- **FR-13.1:** User can add tags to nodes
- **FR-13.2:** User can filter nodes by tag
- **FR-13.3:** Tags shown as colored chips on nodes

#### FR-14: Export
- **FR-14.1:** Export entire mindmap as JSON
- **FR-14.2:** Export visible canvas area as PNG
- **FR-14.3:** Export mindmap as PDF

### 4.3 External API Features (Phase 3 - Optional)

#### FR-15: AI Integration (External API Required)
- **FR-15.1:** User can request AI summary of node content (requires OpenAI/Anthropic API key)
- **FR-15.2:** AI suggests related nodes to connect (requires LLM API)
- **FR-15.3:** AI generates node title from content (requires LLM API)
- **FR-15.4:** AI extracts tags from content (requires LLM API)
- **FR-15.5:** All AI features are opt-in and require user's own API key

#### FR-16: Image Processing (External API Optional)
- **FR-16.1:** OCR text extraction from images (external API or local Tesseract.js)
- **FR-16.2:** Image optimization/compression (Sharp library - local)
- **FR-16.3:** Thumbnail generation (Sharp library - local)
- **FR-16.4:** Background removal (external API - optional)

---

## 5. Technical Architecture

### 5.1 Architecture Overview

**Architecture Pattern:** Microservices
**Deployment:** Local (all services run on localhost)
**Communication:** REST APIs (HTTP/JSON)
**Data Storage:** Local PostgreSQL databases + Local filesystem

```
┌──────────────────────────────────────────────────────────┐
│                     USER'S MACHINE                        │
│                                                           │
│  ┌─────────────┐                                         │
│  │   Browser   │                                         │
│  │   (Client)  │ ← React App (localhost:5173)           │
│  └──────┬──────┘                                         │
│         │                                                 │
│         ↓                                                 │
│  ┌─────────────────────────────────────────────┐        │
│  │       API Gateway (localhost:3000)          │        │
│  │  - Routes requests to services              │        │
│  │  - Aggregates data from multiple services   │        │
│  │  - Single entry point for client            │        │
│  └────┬─────────────────────────────────┬──────┘        │
│       │                                  │               │
│       ↓                                  ↓               │
│  ┌─────────────────┐              ┌─────────────────┐   │
│  │  Node Service   │              │  Edge Service   │   │
│  │  (port 3001)    │              │  (port 3002)    │   │
│  │  - Node CRUD    │              │  - Connections  │   │
│  │  - PostgreSQL   │              │  - PostgreSQL   │   │
│  └─────────────────┘              └─────────────────┘   │
│                                                           │
│  ┌─────────────────┐              ┌─────────────────┐   │
│  │  Media Service  │              │   AI Service    │   │
│  │  (port 3003)    │              │  (port 3004)    │   │
│  │  - Image upload │              │  - AI wrapper   │   │
│  │  - Local files  │              │  - External API │   │
│  │  - PostgreSQL   │              │    calls        │   │
│  └─────────────────┘              └─────────────────┘   │
│         │                                  │             │
│         ↓                                  ↓             │
│  ┌─────────────┐                   ┌──────────────┐     │
│  │ ./uploads/  │                   │ External API │     │
│  │ (files)     │                   │ (OpenAI, etc)│     │
│  └─────────────┘                   └──────────────┘     │
│                                            ↑             │
│  ┌──────────────────────────────┐         │             │
│  │  PostgreSQL (local)          │   INTERNET (optional) │
│  │  - principle_nodes_db (5432)  │         │             │
│  │  - principle_edges_db (5433)  │         │             │
│  │  - principle_media_db (5434)  │         │             │
│  └──────────────────────────────┘         │             │
│                                            │             │
└────────────────────────────────────────────┼─────────────┘
                                             │
                                    (Only for AI features)
```

### 5.2 Service Descriptions

#### Service 1: API Gateway
- **Port:** 3000
- **Purpose:** Single entry point, request orchestration
- **Tech Stack:** Express + TypeScript + Axios
- **Database:** None (stateless)
- **Local:** ✅ 100% Local
- **Responsibilities:**
  - Route client requests to appropriate services
  - Aggregate data from multiple services
  - Handle CORS
  - Validate requests
  - Error handling and consistent response format

#### Service 2: Node Service
- **Port:** 3001
- **Purpose:** Manage node data and content
- **Tech Stack:** Express + TypeScript + Prisma + PostgreSQL
- **Database:** `principle_nodes_db` (port 5432)
- **Local:** ✅ 100% Local
- **Responsibilities:**
  - CRUD operations for nodes
  - Store node content (text, formatting)
  - Store node metadata (position, style, size)
  - Search nodes by title and content
  - Track node relationships (stores imageIds)

#### Service 3: Edge Service
- **Port:** 3002
- **Purpose:** Manage connections between nodes
- **Tech Stack:** Express + TypeScript + Prisma + PostgreSQL
- **Database:** `principle_edges_db` (port 5433)
- **Local:** ✅ 100% Local
- **Responsibilities:**
  - Create and delete edges
  - Query graph structure (children, parents, paths)
  - Prevent duplicate connections
  - Graph traversal queries
  - Validate edge operations

#### Service 4: Media Service
- **Port:** 3003
- **Purpose:** Handle image uploads and storage
- **Tech Stack:** Express + TypeScript + Multer + Sharp + Prisma + PostgreSQL
- **Database:** `principle_media_db` (port 5434)
- **Storage:** `./uploads/` directory (local filesystem)
- **Local:** ✅ 100% Local
- **Responsibilities:**
  - Upload and store images locally
  - Serve image files
  - Store image metadata in database
  - Generate thumbnails (local with Sharp)
  - Validate file types and sizes
  - Clean up orphaned images

#### Service 5: AI Service (Optional - Future Phase)
- **Port:** 3004
- **Purpose:** Wrapper for external AI API calls
- **Tech Stack:** Express + TypeScript + Axios
- **Database:** None (stateless wrapper)
- **Local:** ⚠️ **Requires External API**
- **External Dependencies:**
  - OpenAI API (user provides API key)
  - OR Anthropic Claude API (user provides API key)
  - OR Ollama (local LLM - fully local option)
- **Responsibilities:**
  - Summarize node content
  - Suggest node connections
  - Generate titles from content
  - Extract tags/entities
  - All calls require user's API key

#### Client Application
- **Port:** 5173
- **Purpose:** User interface
- **Tech Stack:** React + TypeScript + Vite + React Flow + TipTap + Tailwind CSS + Zustand
- **Local:** ✅ 100% Local
- **Responsibilities:**
  - Render mindmap canvas
  - Node creation and editing UI
  - Rich text editor
  - Image upload UI
  - Pan/zoom controls
  - Search interface
  - State management

### 5.3 Data Flow Examples

#### Example 1: Create a New Node
```
1. User clicks "New Node" button in Client
2. Client → API Gateway: POST /api/nodes
3. Gateway → Node Service: POST /nodes
4. Node Service:
   - Validates data
   - Creates node in principle_nodes_db
   - Returns node object
5. Node Service → Gateway: { id, title, content, ... }
6. Gateway → Client: { id, title, content, ... }
7. Client updates canvas with new node
```

#### Example 2: Upload Image to Node
```
1. User drags image into node editor
2. Client → API Gateway: POST /api/nodes/:id/images (multipart/form-data)
3. Gateway → Media Service: POST /upload
4. Media Service:
   - Validates file (type, size)
   - Generates unique filename
   - Saves file to ./uploads/
   - Creates metadata record in principle_media_db
   - Returns media object { id, url, filename }
5. Gateway → Node Service: PATCH /nodes/:id (add imageId to array)
6. Node Service updates node.imageIds
7. Gateway → Client: { media object }
8. Client displays image in node
```

#### Example 3: Load Complete Mindmap
```
1. User opens mindmap
2. Client → API Gateway: GET /api/mindmap/:id
3. Gateway makes parallel requests:
   3a. Node Service: GET /nodes?mindmapId=:id
   3b. Edge Service: GET /edges?mindmapId=:id
4. Gateway receives nodes and edges
5. Gateway extracts all imageIds from nodes
6. Gateway → Media Service: GET /media?ids=... (bulk fetch)
7. Media Service returns image metadata with URLs
8. Gateway enriches nodes with image data
9. Gateway → Client: { mindmap, nodes (with images), edges }
10. Client renders complete mindmap on canvas
```

### 5.4 Inter-Service Communication

**Communication Protocol:** HTTP/REST
- **Format:** JSON
- **Authentication:** None (local services, future: service tokens)
- **Error Handling:** Standard HTTP status codes
- **Timeout:** 30 seconds per request
- **Retry Logic:** 3 retries with exponential backoff

**Service Discovery:**
- Configuration files with service URLs
- Environment variables for each service
- Future: Service registry (Consul/Eureka) if moving to cloud

---

## 6. Data Models

### 6.1 Node Service Database (principle_nodes_db)

#### Table: mindmaps
```sql
CREATE TABLE mindmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  viewport JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**JSONB Structure for viewport:**
```json
{
  "x": 0,
  "y": 0,
  "zoom": 1.0
}
```

#### Table: nodes
```sql
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  position JSONB NOT NULL,
  style JSONB NOT NULL DEFAULT '{}',
  image_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_mindmap_id (mindmap_id),
  INDEX idx_title_search (title),
  INDEX idx_deleted (is_deleted),
  FULLTEXT INDEX idx_content_search (content)
);
```

**JSONB Structure for content:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "This is rich text content",
          "marks": [{ "type": "bold" }]
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [...]
    }
  ]
}
```

**JSONB Structure for position:**
```json
{
  "x": 100,
  "y": 200
}
```

**JSONB Structure for style:**
```json
{
  "backgroundColor": "#ffffff",
  "borderColor": "#e5e7eb",
  "borderWidth": 1,
  "width": 300,
  "height": 200,
  "fontSize": 14
}
```

### 6.2 Edge Service Database (principle_edges_db)

#### Table: edges
```sql
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mindmap_id UUID NOT NULL,
  source_node_id UUID NOT NULL,
  target_node_id UUID NOT NULL,
  label VARCHAR(255),
  style JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (source_node_id, target_node_id),
  INDEX idx_mindmap_id (mindmap_id),
  INDEX idx_source (source_node_id),
  INDEX idx_target (target_node_id)
);
```

**JSONB Structure for style:**
```json
{
  "color": "#6b7280",
  "strokeWidth": 2,
  "animated": false,
  "type": "smoothstep"
}
```

### 6.3 Media Service Database (principle_media_db)

#### Table: media
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID,
  filename VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_node_id (node_id),
  INDEX idx_filename (filename)
);
```

---

## 7. API Specifications

### 7.1 API Gateway Endpoints

**Base URL:** `http://localhost:3000/api`

#### Mindmap Endpoints

##### GET /mindmaps
Get all mindmaps

**Response:**
```json
{
  "mindmaps": [
    {
      "id": "uuid",
      "name": "My World",
      "description": "...",
      "nodeCount": 42,
      "createdAt": "2025-11-01T00:00:00Z",
      "updatedAt": "2025-11-01T12:00:00Z"
    }
  ]
}
```

##### POST /mindmaps
Create new mindmap

**Request:**
```json
{
  "name": "My New World",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My New World",
  "description": "...",
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "createdAt": "2025-11-01T00:00:00Z"
}
```

##### GET /mindmap/:id
Get complete mindmap with all nodes and edges

**Response:**
```json
{
  "id": "uuid",
  "name": "My World",
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "nodes": [
    {
      "id": "uuid",
      "title": "Node Title",
      "content": { /* rich text JSON */ },
      "position": { "x": 100, "y": 200 },
      "style": { /* style object */ },
      "images": [
        {
          "id": "uuid",
          "url": "/uploads/filename.jpg",
          "thumbnailUrl": "/uploads/thumb_filename.jpg",
          "width": 800,
          "height": 600
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source": "node-uuid-1",
      "target": "node-uuid-2",
      "label": "connects to",
      "style": { /* edge style */ }
    }
  ]
}
```

##### PATCH /mindmap/:id
Update mindmap (e.g., save viewport position)

**Request:**
```json
{
  "viewport": { "x": 100, "y": 50, "zoom": 1.5 }
}
```

##### DELETE /mindmap/:id
Delete mindmap and all its nodes/edges

---

#### Node Endpoints

##### POST /nodes
Create new node

**Request:**
```json
{
  "mindmapId": "uuid",
  "title": "New Node",
  "content": { /* rich text JSON */ },
  "position": { "x": 100, "y": 200 },
  "style": { "backgroundColor": "#ffffff" }
}
```

**Response:**
```json
{
  "id": "uuid",
  "mindmapId": "uuid",
  "title": "New Node",
  "content": {},
  "position": { "x": 100, "y": 200 },
  "style": {},
  "imageIds": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

##### GET /nodes/:id
Get single node with images

**Response:**
```json
{
  "id": "uuid",
  "title": "Node Title",
  "content": {},
  "position": { "x": 100, "y": 200 },
  "style": {},
  "images": [
    { "id": "uuid", "url": "/uploads/...", ... }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

##### PATCH /nodes/:id
Update node

**Request:**
```json
{
  "title": "Updated Title",
  "content": { /* updated content */ },
  "position": { "x": 150, "y": 250 },
  "style": { "backgroundColor": "#fef3c7" }
}
```

##### DELETE /nodes/:id
Delete node (soft delete)

**Response:**
```json
{
  "success": true,
  "message": "Node deleted"
}
```

##### POST /nodes/:id/images
Upload image to node

**Request:** `multipart/form-data`
- `file`: Image file

**Response:**
```json
{
  "id": "uuid",
  "url": "/uploads/filename.jpg",
  "thumbnailUrl": "/uploads/thumb_filename.jpg",
  "width": 800,
  "height": 600,
  "size": 123456
}
```

##### GET /nodes/search?q=query
Search nodes

**Query Params:**
- `q`: Search query
- `mindmapId`: Filter by mindmap

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Matching Node",
      "snippet": "...highlighted text...",
      "relevance": 0.95
    }
  ]
}
```

---

#### Edge Endpoints

##### POST /edges
Create edge between nodes

**Request:**
```json
{
  "mindmapId": "uuid",
  "sourceNodeId": "uuid",
  "targetNodeId": "uuid",
  "label": "connects to",
  "style": {}
}
```

**Response:**
```json
{
  "id": "uuid",
  "mindmapId": "uuid",
  "source": "uuid",
  "target": "uuid",
  "label": "connects to",
  "style": {},
  "createdAt": "..."
}
```

##### DELETE /edges/:id
Delete edge

**Response:**
```json
{
  "success": true
}
```

##### GET /edges/graph/:nodeId/children
Get all child nodes

**Response:**
```json
{
  "children": [
    { "id": "uuid", "title": "Child Node 1" },
    { "id": "uuid", "title": "Child Node 2" }
  ]
}
```

---

#### AI Endpoints (Optional - External API)

##### POST /ai/summarize
Summarize node content

**Request:**
```json
{
  "nodeId": "uuid",
  "content": "Long text content...",
  "apiKey": "user-api-key",
  "provider": "openai"
}
```

**Response:**
```json
{
  "summary": "Concise summary of content...",
  "tokensUsed": 150
}
```

##### POST /ai/suggest-connections
AI suggests related nodes to connect

**Request:**
```json
{
  "nodeId": "uuid",
  "mindmapId": "uuid",
  "apiKey": "user-api-key"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "nodeId": "uuid",
      "title": "Related Node",
      "reason": "Both discuss neural networks",
      "confidence": 0.85
    }
  ]
}
```

---

### 7.2 Service-Specific Endpoints

#### Node Service (port 3001)
```
GET    /nodes
POST   /nodes
GET    /nodes/:id
PATCH  /nodes/:id
DELETE /nodes/:id
GET    /nodes/search
GET    /mindmaps
POST   /mindmaps
GET    /mindmaps/:id
PATCH  /mindmaps/:id
DELETE /mindmaps/:id
```

#### Edge Service (port 3002)
```
GET    /edges?mindmapId=...
POST   /edges
DELETE /edges/:id
GET    /edges/from/:nodeId
GET    /edges/to/:nodeId
GET    /graph/:nodeId/children
GET    /graph/:nodeId/parents
GET    /graph/:nodeId/ancestors
```

#### Media Service (port 3003)
```
POST   /upload
GET    /media/:id
GET    /media/:id/file
GET    /media/:id/thumbnail
DELETE /media/:id
GET    /media?nodeIds=...
```

#### AI Service (port 3004) - Optional
```
POST   /summarize
POST   /suggest-connections
POST   /generate-tags
POST   /generate-title
```

---

## 8. User Interface Specifications

### 8.1 Main Canvas View

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [☰] Principle  [Search...]  [+ New Node]  [Zoom: 100%] [User]│ ← Top Bar
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐                    ┌──────────┐          │
│  │  Node 1  │ ────────────────→  │  Node 2  │          │
│  │          │                    │          │          │
│  │ Text...  │                    │ Text...  │          │
│  │ [Image]  │                    │          │          │
│  └──────────┘                    └──────────┘          │
│      ↓                               ↓                  │
│  ┌──────────┐                    ┌──────────┐          │
│  │  Node 3  │                    │  Node 4  │          │
│  │          │                    │          │          │
│  └──────────┘                    └──────────┘          │
│                                                          │
│                                                          │
│                                    [Minimap]            │
│                                    ┌────────┐           │
│                                    │ • • •  │           │
│                                    │  •   • │           │
│                                    └────────┘           │
└─────────────────────────────────────────────────────────┘
```

**Top Bar Components:**
1. **Menu Button (☰):** Opens sidebar with mindmap list
2. **Mindmap Title:** Current mindmap name (editable)
3. **Search Bar:** Global search across nodes
4. **New Node Button:** Creates node at center of viewport
5. **Zoom Controls:** Zoom in/out, reset, fit to view
6. **User Menu:** Settings, export, help

**Canvas:**
- Infinite scroll in all directions
- Grid background (subtle)
- Nodes displayed as cards
- Edges shown as arrows with smooth curves

**Minimap:**
- Fixed bottom-right corner
- Shows all nodes as dots
- Current viewport highlighted
- Click to navigate

### 8.2 Node Card (Closed State)

```
┌─────────────────────────────┐
│ Node Title                  │ ← Title bar (colored)
├─────────────────────────────┤
│                             │
│ First few lines of text...  │ ← Preview of content
│                             │
│ [Image thumbnail]           │ ← First image if exists
│                             │
└─────────────────────────────┘
```

**Interactions:**
- **Click:** Select node (highlight border)
- **Double-click:** Open node editor
- **Drag:** Move node
- **Right-click:** Context menu

### 8.3 Node Editor (Modal/Panel)

```
┌──────────────────────────────────────────────────────┐
│  Edit Node                                      [X]  │
├──────────────────────────────────────────────────────┤
│  Title: [Node Title_________________________]        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐│
│  │ [B] [I] [U] [H1] [H2] [•] [1.] [Link] [Image] ││ ← Toolbar
│  ├─────────────────────────────────────────────────┤│
│  │                                                  ││
│  │ Type your content here...                       ││ ← Rich text
│  │                                                  ││   editor
│  │ • Bullet points                                 ││
│  │ • Work great                                    ││
│  │                                                  ││
│  │ [Image displayed inline]                        ││
│  │                                                  ││
│  │                                                  ││
│  └─────────────────────────────────────────────────┘│
│                                                       │
│  Images:                                              │
│  ┌──────┐ ┌──────┐                                   │
│  │[img1]│ │[img2]│ [+ Upload]                        │
│  └──────┘ └──────┘                                   │
│                                                       │
│  Style:                                               │
│  Background: [⬜ White] [🟡 Yellow] [🔵 Blue] [More]  │
│                                                       │
│                      [Cancel]  [Save]                │
└──────────────────────────────────────────────────────┘
```

**Components:**
1. **Title Input:** Single-line text field
2. **Rich Text Editor:** TipTap editor with formatting toolbar
3. **Image Gallery:** Thumbnails of uploaded images
4. **Upload Button:** Drag-drop or click to upload
5. **Style Selector:** Choose background color
6. **Action Buttons:** Cancel (discard changes) or Save

### 8.4 Context Menu (Right-click Node)

```
┌────────────────────┐
│ Edit               │
│ Delete             │
│ Duplicate          │
├────────────────────┤
│ Create Child Node  │
│ Connect to...      │
├────────────────────┤
│ Change Color       │
│ Add Tag            │
├────────────────────┤
│ Summarize (AI)     │ ← Only if AI enabled
└────────────────────┘
```

### 8.5 Search Results Panel

```
┌────────────────────────────────────┐
│ Search: "neural network"     [X]  │
├────────────────────────────────────┤
│ Found 5 results:                   │
│                                    │
│ ○ Neural Networks Basics           │
│   ...introduction to neural nets..│
│                                    │
│ ○ CNN Architecture                 │
│   ...convolutional neural network.│
│                                    │
│ ○ Training Process                 │
│   ...backpropagation through...   │
│                                    │
└────────────────────────────────────┘
```

**Interaction:**
- Click result → Canvas centers on that node
- Matching nodes highlighted on canvas
- Search highlights matching text in preview

### 8.6 Sidebar (Mindmap List)

```
┌─────────────────────────┐
│ My Mindmaps       [+]  │
├─────────────────────────┤
│                         │
│ > My World              │ ← Active
│   42 nodes              │
│                         │
│   Learning Projects     │
│   23 nodes              │
│                         │
│   Work Ideas            │
│   18 nodes              │
│                         │
│   Book Notes            │
│   67 nodes              │
│                         │
└─────────────────────────┘
```

### 8.7 Responsive Behavior

**Desktop (1920x1080):**
- Full canvas view
- Sidebar and panels as overlays
- Minimap visible
- Large nodes (300x200px default)

**Tablet (iPad - 1024x768):**
- Full canvas view
- Collapsible sidebar
- Minimap smaller
- Medium nodes (250x180px)

**Mobile (Future):**
- Simplified view
- Single node focus mode
- Swipe navigation
- Small nodes (200x150px)

---

## 9. Non-Functional Requirements

### 9.1 Performance

**PR-1: Load Time**
- Initial app load: < 3 seconds
- Mindmap load (100 nodes): < 2 seconds
- Mindmap load (500 nodes): < 5 seconds
- Search results: < 1 second

**PR-2: Response Time**
- Node creation: < 500ms
- Node update: < 300ms
- Image upload (5MB): < 3 seconds
- Canvas pan/zoom: 60 FPS

**PR-3: Scalability**
- Support mindmaps with 1000+ nodes
- Support 100+ images per mindmap
- Database queries optimized with indexes
- Lazy loading for images (only load visible)

### 9.2 Reliability

**RR-1: Data Integrity**
- Zero data loss
- ACID transactions for database operations
- Auto-save every 2 seconds
- Backup mechanism (future)

**RR-2: Error Handling**
- Graceful degradation if service unavailable
- User-friendly error messages
- Retry logic for failed requests
- Crash recovery (restore last state)

**RR-3: Validation**
- Input validation on client and server
- File type and size validation
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)

### 9.3 Security

**SR-1: Local Security**
- No authentication needed (single-user local app)
- Files stored with proper permissions
- No sensitive data in logs
- API keys (for AI) stored securely in config

**SR-2: Data Privacy**
- All data stored locally
- No telemetry or tracking
- No cloud sync (unless explicitly added by user)
- User owns all data

### 9.4 Usability

**UR-1: Learnability**
- Intuitive interface, minimal learning curve
- Tooltips for all actions
- Keyboard shortcuts discoverable
- Help documentation

**UR-2: Accessibility**
- Keyboard navigation support
- Screen reader compatible (ARIA labels)
- High contrast mode option
- Minimum font size: 14px

**UR-3: User Feedback**
- Loading indicators for async operations
- Success/error notifications
- Undo/redo capability
- Autosave indicator

### 9.5 Maintainability

**MR-1: Code Quality**
- TypeScript for type safety
- ESLint and Prettier for code style
- Unit tests for critical functions
- Integration tests for API endpoints

**MR-2: Documentation**
- API documentation (OpenAPI/Swagger)
- README for each service
- Architecture diagrams
- Setup instructions

**MR-3: Deployment**
- Docker containers for each service
- Docker Compose for orchestration
- One-command setup
- Easy updates

---

## 10. Development Phases

### Phase 0: Project Setup (Week 1 - Days 1-2)

**Tasks:**
1. Initialize project structure (5 directories)
2. Setup TypeScript configs for each service
3. Setup PostgreSQL (3 databases)
4. Create base Express servers (Gateway, Node, Edge, Media services)
5. Setup client app (React + Vite + TypeScript)
6. Install dependencies
7. Setup Docker Compose
8. Create shared types package

**Deliverables:**
- All services start successfully
- Databases created and accessible
- Client renders "Hello World"
- Docker Compose runs all services

**Success Criteria:**
- `npm run dev:all` starts all services
- `docker-compose up` works
- Can curl each service health endpoint

---

### Phase 1: Core Mindmap & Nodes (Week 1 - Days 3-7)

**Tasks:**
1. **Node Service:**
   - Create Prisma schemas (Mindmap, Node)
   - Implement CRUD endpoints
   - Add database migrations
   - Add search functionality

2. **API Gateway:**
   - Create routes for mindmap and nodes
   - Implement proxy to Node Service
   - Add error handling

3. **Client:**
   - Setup React Flow canvas
   - Create basic node component
   - Implement create node UI
   - Connect to API Gateway
   - Implement pan/zoom

**Deliverables:**
- Can create mindmaps
- Can create/read/update/delete nodes
- Nodes display on canvas
- Nodes persist in database

**Success Criteria:**
- Create 10 nodes and see them on canvas
- Close app, reopen, nodes still there
- Can drag nodes around
- Can pan and zoom canvas

---

### Phase 2: Node Content Editor (Week 2)

**Tasks:**
1. **Client:**
   - Integrate TipTap editor
   - Create node editor modal
   - Implement rich text formatting
   - Add toolbar with formatting buttons
   - Style editor UI

2. **Node Service:**
   - Extend content schema for rich text JSON
   - Add content validation

3. **API Gateway:**
   - Update node endpoints for rich content

**Deliverables:**
- Node editor opens on double-click
- Can add formatted text to nodes
- Can save rich text content
- Text displays properly in node cards

**Success Criteria:**
- Can bold, italic, underline text
- Can create lists (bullets, numbers)
- Content persists after save
- Long text shows preview in card

---

### Phase 3: Connections & Edges (Week 3)

**Tasks:**
1. **Edge Service:**
   - Create Prisma schema (Edge)
   - Implement CRUD endpoints
   - Add graph query endpoints
   - Add validation (prevent duplicates)

2. **API Gateway:**
   - Create edge routes
   - Aggregate edges with nodes in mindmap endpoint

3. **Client:**
   - Implement edge creation UI
   - Connect nodes with React Flow
   - Style edges (arrows, colors)
   - Add "Create Child" context menu option

**Deliverables:**
- Can connect nodes with edges
- Edges display as arrows
- Can delete edges
- Can create child nodes (auto-connected)

**Success Criteria:**
- Create 5 nodes, connect them
- Edges display correctly
- Graph persists after refresh
- Can query node children

---

### Phase 4: Media/Images (Week 4)

**Tasks:**
1. **Media Service:**
   - Create Prisma schema (Media)
   - Implement upload endpoint (Multer)
   - Implement file storage (./uploads/)
   - Implement serve file endpoint
   - Add thumbnail generation (Sharp)
   - Add validation (file type, size)

2. **API Gateway:**
   - Create media routes
   - Coordinate node + media updates
   - Aggregate images with nodes

3. **Client:**
   - Create image upload UI
   - Implement drag-drop upload
   - Display images in node editor
   - Display image thumbnails in node cards
   - Add image lightbox (click to enlarge)

**Deliverables:**
- Can upload images to nodes
- Images store locally in ./uploads/
- Images display in nodes
- Thumbnails generated automatically

**Success Criteria:**
- Upload 5MB image in < 3 seconds
- Images display correctly
- Can add multiple images per node
- Images persist after refresh

---

### Phase 5: Polish & UX (Week 5)

**Tasks:**
1. **Client:**
   - Add minimap
   - Implement search UI
   - Add keyboard shortcuts
   - Add context menus
   - Add loading indicators
   - Add error notifications
   - Implement auto-save
   - Style improvements

2. **All Services:**
   - Add error handling
   - Add logging
   - Add validation
   - Performance optimization

3. **Testing:**
   - Write unit tests
   - Write integration tests
   - Manual QA testing

**Deliverables:**
- Polished, intuitive UI
- Smooth interactions
- Helpful error messages
- All features working reliably

**Success Criteria:**
- App feels fast and responsive
- No crashes during normal use
- Clear feedback for all actions
- Search works well

---

### Phase 6: Advanced Features (Week 6+)

**Tasks:**
1. **Client:**
   - Undo/redo system
   - Node templates
   - Tags system
   - Color themes
   - Export (JSON, PNG)

2. **AI Service (Optional):**
   - Create AI Service wrapper
   - Implement summarization
   - Implement connection suggestions
   - Add AI UI in client

3. **Optimization:**
   - Lazy loading for large mindmaps
   - Virtual scrolling for node list
   - Image optimization
   - Database indexing

**Deliverables:**
- Advanced productivity features
- AI capabilities (optional)
- Export functionality
- Performance improvements

**Success Criteria:**
- Can handle 1000+ node mindmaps
- AI features work (if API key provided)
- Can export mindmap data
- App remains fast with large datasets

---

## 11. Success Metrics

### 11.1 Technical Metrics

**TM-1: Performance**
- [ ] Page load time < 3s
- [ ] Node creation time < 500ms
- [ ] Search response time < 1s
- [ ] 60 FPS canvas interaction

**TM-2: Reliability**
- [ ] Zero data loss in testing
- [ ] 99.9% uptime (no crashes)
- [ ] All API requests succeed or fail gracefully

**TM-3: Code Quality**
- [ ] 80%+ test coverage
- [ ] Zero critical bugs
- [ ] All services pass linting
- [ ] TypeScript strict mode enabled

### 11.2 User Experience Metrics

**UXM-1: Usability**
- [ ] New user can create mindmap in < 2 minutes
- [ ] Can perform all core tasks without documentation
- [ ] Clear feedback for all actions

**UXM-2: Functionality**
- [ ] Can create mindmaps with 500+ nodes without issues
- [ ] Can upload and display 100+ images
- [ ] Search finds relevant nodes in < 1s

### 11.3 Development Metrics

**DM-1: Timeline**
- [ ] MVP completed in 5 weeks
- [ ] All Phase 1-5 features delivered

**DM-2: Quality**
- [ ] Services run independently
- [ ] Services communicate reliably
- [ ] Easy to add new services

---

## 12. Risks and Mitigation

### 12.1 Technical Risks

**Risk 1: Performance with Large Mindmaps**
- **Impact:** High
- **Probability:** Medium
- **Mitigation:**
  - Implement virtualization (only render visible nodes)
  - Use React Flow's built-in performance optimizations
  - Lazy load images
  - Database query optimization with indexes

**Risk 2: Complex State Management**
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:**
  - Use Zustand for simpler state management
  - Keep state structure flat
  - Leverage React Flow's internal state
  - Regular state audits

**Risk 3: Service Communication Failures**
- **Impact:** High
- **Probability:** Low
- **Mitigation:**
  - Implement retry logic with exponential backoff
  - Add circuit breakers
  - Graceful degradation (show cached data)
  - Comprehensive error handling

**Risk 4: Data Consistency Across Services**
- **Impact:** High
- **Probability:** Medium
- **Mitigation:**
  - Use database transactions where possible
  - Implement idempotent operations
  - Add data validation at service boundaries
  - Regular database backups

### 12.2 User Experience Risks

**Risk 5: Steep Learning Curve**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:**
  - Intuitive UI design with clear affordances
  - Tooltips and help text
  - Keyboard shortcuts discoverable in UI
  - Video tutorial (future)

**Risk 6: Data Loss**
- **Impact:** Critical
- **Probability:** Low
- **Mitigation:**
  - Auto-save every 2 seconds
  - Database transactions
  - Soft deletes with recovery period
  - Regular backups
  - Export functionality

### 12.3 Development Risks

**Risk 7: Scope Creep**
- **Impact:** Medium
- **Probability:** High
- **Mitigation:**
  - Clear MVP definition
  - Phase-based development
  - Feature freeze after Phase 5
  - Regular scope reviews

**Risk 8: Microservices Complexity**
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:**
  - Keep services simple initially
  - Clear service boundaries
  - Good documentation
  - Docker Compose for easy orchestration

---

## 13. Future Enhancements (Post-MVP)

### 13.1 Collaboration Features
- Real-time multi-user editing (WebSockets)
- Comments on nodes
- Sharing mindmaps
- Permissions system
- Version history

### 13.2 Advanced Content
- Video embedding
- Audio notes
- PDF attachments
- Code snippets with syntax highlighting
- LaTeX math equations

### 13.3 Mobile Applications
- iOS app (React Native)
- Android app (React Native)
- Mobile-optimized UI
- Offline sync

### 13.4 Cloud Features
- Cloud backup
- Cross-device sync
- Cloud storage for images (S3)
- API for third-party integrations

### 13.5 AI Enhancements
- Auto-organize nodes (AI layout)
- Semantic search
- Auto-tagging
- Relationship suggestions
- Knowledge graph insights

### 13.6 Import/Export
- Import from Markdown
- Import from Obsidian
- Import from Notion
- Export to Miro/FigJam
- Export to presentation format

### 13.7 Productivity
- Spaced repetition flashcards
- Daily review mode
- Task tracking in nodes
- Reminders and notifications
- Time tracking per node

---

## 14. Deployment Strategy

### 14.1 Local Development (Current)

**Setup:**
```bash
# Clone repo
git clone https://github.com/user/principle.git
cd principle

# Install all dependencies
npm run install:all

# Start PostgreSQL
docker-compose up postgres-nodes postgres-edges postgres-media -d

# Run migrations
npm run prisma:migrate

# Start all services
npm run dev:all

# Access app
# Client: http://localhost:5173
# API Gateway: http://localhost:3000
```

**Requirements:**
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- 2GB RAM minimum
- 10GB storage for images

### 14.2 Docker Deployment

**Setup:**
```bash
# Start everything with Docker
docker-compose up

# Access app
# Client: http://localhost:5173
```

**Benefits:**
- One-command setup
- Isolated environments
- Easy updates
- Consistent across machines

### 14.3 Production Deployment (Future)

**Cloud Architecture:**
- Kubernetes cluster
- Load balancers for each service
- Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Object storage for images (S3, CloudFlare R2)
- CDN for static assets
- Service mesh (Istio) for advanced routing

**CI/CD:**
- GitHub Actions for automated testing
- Docker image builds on push
- Automated deployment to staging
- Manual approval for production

---

## 15. Technical Constraints and Decisions

### 15.1 Technology Choices

| Component | Technology | Rationale | Alternatives Considered |
|-----------|------------|-----------|------------------------|
| Frontend Framework | React | Large ecosystem, React Flow library | Vue, Svelte |
| Frontend Build | Vite | Fast development, modern | Create React App, Next.js |
| Canvas Library | React Flow | Purpose-built for node-based UIs | D3.js, Konva.js, custom canvas |
| Rich Text Editor | TipTap | Modern, extensible, good DX | Quill, Draft.js, Slate |
| Backend Framework | Express | Simple, widely used | Fastify, Koa, Nest.js |
| Language | TypeScript | Type safety, better DX | JavaScript |
| Database | PostgreSQL | Reliable, ACID, JSONB support | MongoDB, SQLite |
| ORM | Prisma | Type-safe, great migrations | TypeORM, Sequelize |
| State Management | Zustand | Simple, lightweight | Redux, MobX, Context API |
| Styling | Tailwind CSS | Utility-first, fast development | CSS Modules, styled-components |
| Image Processing | Sharp | Fast, local, no external API | Jimp, ImageMagick |

### 15.2 Architectural Decisions

**AD-1: Microservices vs Monolith**
- **Decision:** Microservices
- **Rationale:**
  - Independent scaling of services
  - Technology flexibility per service
  - Easier to add external API wrappers
  - Aligns with future cloud deployment
- **Trade-offs:**
  - More complex initial setup
  - Inter-service communication overhead
  - More moving parts to debug

**AD-2: Local-First Architecture**
- **Decision:** All data stored locally
- **Rationale:**
  - User privacy
  - No cloud costs
  - Offline capability
  - User owns data
- **Trade-offs:**
  - No cross-device sync (initially)
  - User responsible for backups
  - Limited collaboration features

**AD-3: API Gateway Pattern**
- **Decision:** Use API Gateway as single entry point
- **Rationale:**
  - Simplifies client code (one endpoint)
  - Can aggregate data from multiple services
  - Easier to add auth/rate limiting later
  - Clear separation of concerns
- **Trade-offs:**
  - Single point of failure
  - Added latency (one extra hop)
  - Gateway can become complex

**AD-4: Separate Databases per Service**
- **Decision:** Each service owns its database
- **Rationale:**
  - True microservices pattern
  - Independent scaling
  - Service isolation
- **Trade-offs:**
  - Can't use SQL joins across services
  - Data duplication possible
  - More complex queries

**AD-5: REST over GraphQL**
- **Decision:** Use REST APIs
- **Rationale:**
  - Simpler to implement
  - Familiar to most developers
  - Sufficient for use case
  - API Gateway can aggregate
- **Trade-offs:**
  - Over-fetching/under-fetching possible
  - More endpoints to maintain
  - No schema introspection

**AD-6: Local Images vs CDN**
- **Decision:** Store images locally in filesystem
- **Rationale:**
  - No cloud costs
  - Simple implementation
  - Fast local access
  - Privacy
- **Trade-offs:**
  - Limited by local storage
  - No CDN benefits
  - Manual backup needed

---

## 16. Open Questions and Decisions Needed

### 16.1 Technical Questions

**Q1: Should we implement undo/redo at the client or service level?**
- **Option A:** Client-side only (easier)
- **Option B:** Service-side with event sourcing (more robust)
- **Recommendation:** Client-side for MVP, service-side later

**Q2: How to handle concurrent edits to the same node?**
- **Option A:** Last write wins (simple)
- **Option B:** Optimistic locking (version numbers)
- **Option C:** Operational transforms (complex)
- **Recommendation:** Last write wins for single-user MVP

**Q3: Should edges support labels and styling?**
- **Option A:** Yes, rich edges with labels and colors
- **Option B:** Simple arrows only
- **Recommendation:** Support in data model, basic UI in MVP

**Q4: Soft delete vs hard delete for nodes?**
- **Option A:** Soft delete with 30-day recovery
- **Option B:** Immediate hard delete
- **Recommendation:** Soft delete for better UX

### 16.2 User Experience Questions

**Q5: Should node editor be modal or side panel?**
- **Option A:** Modal (focused editing)
- **Option B:** Side panel (see canvas while editing)
- **Recommendation:** Modal for MVP, make configurable later

**Q6: Auto-layout vs manual positioning?**
- **Option A:** AI auto-layout algorithm
- **Option B:** User positions manually
- **Option C:** Hybrid (suggest positions, user adjusts)
- **Recommendation:** Manual for MVP, auto-layout as future feature

**Q7: Should we support multiple mindmaps open in tabs?**
- **Option A:** One mindmap at a time
- **Option B:** Multiple tabs
- **Recommendation:** One at a time for MVP

---

## 17. Documentation Requirements

### 17.1 User Documentation
- [ ] Getting Started Guide
- [ ] Feature tutorials
- [ ] Keyboard shortcuts reference
- [ ] FAQ
- [ ] Troubleshooting guide

### 17.2 Developer Documentation
- [ ] Architecture overview
- [ ] Service API documentation (Swagger)
- [ ] Database schema documentation
- [ ] Setup instructions
- [ ] Contributing guidelines
- [ ] Code style guide

### 17.3 Operational Documentation
- [ ] Deployment guide
- [ ] Docker setup guide
- [ ] Database backup/restore procedures
- [ ] Monitoring and logging setup
- [ ] Performance tuning guide

---

## 18. Acceptance Criteria

### 18.1 MVP Complete When:

1. ✅ **Mindmap Management:**
   - Can create, view, and delete mindmaps
   - Mindmaps persist across sessions
   - Can switch between mindmaps

2. ✅ **Node Operations:**
   - Can create nodes on canvas
   - Can edit node title and content
   - Can move and resize nodes
   - Can delete nodes
   - Changes auto-save

3. ✅ **Rich Content:**
   - Can add formatted text (bold, italic, lists)
   - Can upload images to nodes
   - Images display in nodes
   - Images persist locally

4. ✅ **Connections:**
   - Can connect nodes with edges
   - Can delete edges
   - Can create child nodes from parent

5. ✅ **Navigation:**
   - Can pan canvas
   - Can zoom in/out
   - Minimap shows node overview
   - Can search nodes

6. ✅ **Technical:**
   - All services run locally
   - Docker Compose setup works
   - No data loss during testing
   - Performance meets requirements

7. ✅ **User Experience:**
   - Intuitive to use without instructions
   - Fast and responsive
   - Clear error messages
   - Professional appearance

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **Mindmap** | A collection of nodes and edges representing a knowledge graph |
| **Node** | A single content unit containing text and images |
| **Edge** | A connection/relationship between two nodes |
| **Canvas** | The infinite scrollable area where nodes are displayed |
| **Viewport** | The visible portion of the canvas |
| **Rich Text** | Formatted text with bold, italic, lists, etc. |
| **Microservice** | An independent, deployable service with specific responsibility |
| **API Gateway** | Single entry point that routes requests to appropriate services |
| **Service** | A backend component that handles specific functionality |
| **Local-First** | Architecture where all data is stored on user's machine |
| **Wrapper Service** | Service that wraps external API calls |

---

## 20. Appendices

### Appendix A: Example API Response

**GET /api/mindmap/:id**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Learning World",
  "description": "Everything I'm learning about AI and ML",
  "viewport": {
    "x": 150,
    "y": 200,
    "zoom": 1.2
  },
  "nodes": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Neural Networks Basics",
      "content": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Neural networks are computational models inspired by biological neural networks."
              }
            ]
          }
        ]
      },
      "position": { "x": 100, "y": 100 },
      "style": {
        "backgroundColor": "#fef3c7",
        "borderColor": "#fbbf24",
        "width": 300,
        "height": 250
      },
      "images": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "url": "/uploads/neural-net-diagram.png",
          "thumbnailUrl": "/uploads/thumb_neural-net-diagram.png",
          "width": 800,
          "height": 600,
          "size": 245678
        }
      ],
      "tags": ["AI", "fundamentals"],
      "createdAt": "2025-11-01T10:00:00Z",
      "updatedAt": "2025-11-01T14:30:00Z"
    }
  ],
  "edges": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "source": "660e8400-e29b-41d4-a716-446655440001",
      "target": "660e8400-e29b-41d4-a716-446655440004",
      "label": "builds on",
      "style": {
        "color": "#6b7280",
        "strokeWidth": 2,
        "animated": false
      }
    }
  ],
  "createdAt": "2025-11-01T09:00:00Z",
  "updatedAt": "2025-11-01T14:30:00Z"
}
```

### Appendix B: Environment Variables Template

**.env.example**
```bash
# API Gateway
API_GATEWAY_PORT=3000
NODE_SERVICE_URL=http://localhost:3001
EDGE_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004

# Node Service
NODE_SERVICE_PORT=3001
NODE_DATABASE_URL=postgresql://user:pass@localhost:5432/principle_nodes_db

# Edge Service
EDGE_SERVICE_PORT=3002
EDGE_DATABASE_URL=postgresql://user:pass@localhost:5433/principle_edges_db

# Media Service
MEDIA_SERVICE_PORT=3003
MEDIA_DATABASE_URL=postgresql://user:pass@localhost:5434/principle_media_db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/gif,image/webp

# AI Service (Optional)
AI_SERVICE_PORT=3004
DEFAULT_AI_PROVIDER=openai
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
OLLAMA_URL=http://localhost:11434

# Client
VITE_API_URL=http://localhost:3000

# General
NODE_ENV=development
LOG_LEVEL=info
```

### Appendix C: Project File Structure

```
principle/
├── api-gateway/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── mindmap.routes.ts
│   │   │   ├── nodes.routes.ts
│   │   │   ├── edges.routes.ts
│   │   │   ├── media.routes.ts
│   │   │   └── ai.routes.ts
│   │   ├── services/
│   │   │   └── aggregator.service.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── cors.ts
│   │   └── config/
│   │       └── services.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── node-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── nodes.routes.ts
│   │   │   └── mindmaps.routes.ts
│   │   ├── controllers/
│   │   │   ├── node.controller.ts
│   │   │   └── mindmap.controller.ts
│   │   ├── services/
│   │   │   ├── node.service.ts
│   │   │   └── mindmap.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── middleware/
│   │       └── validation.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── edge-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── edges.routes.ts
│   │   ├── controllers/
│   │   │   └── edge.controller.ts
│   │   ├── services/
│   │   │   ├── edge.service.ts
│   │   │   └── graph.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── middleware/
│   │       └── validation.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── media-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── media.routes.ts
│   │   ├── controllers/
│   │   │   └── media.controller.ts
│   │   ├── services/
│   │   │   ├── upload.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── thumbnail.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── middleware/
│   │       ├── multer.config.ts
│   │       └── validation.ts
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── ai-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── ai.routes.ts
│   │   ├── controllers/
│   │   │   └── ai.controller.ts
│   │   ├── services/
│   │   │   ├── openai.service.ts
│   │   │   ├── anthropic.service.ts
│   │   │   └── ollama.service.ts
│   │   └── middleware/
│   │       └── apiKey.validation.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── MindMapCanvas.tsx
│   │   │   │   ├── MiniMap.tsx
│   │   │   │   └── Controls.tsx
│   │   │   ├── Node/
│   │   │   │   ├── CustomNode.tsx
│   │   │   │   ├── NodeEditor.tsx
│   │   │   │   └── NodeContextMenu.tsx
│   │   │   ├── Editor/
│   │   │   │   ├── RichTextEditor.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   └── ImageUploader.tsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MindmapList.tsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   └── UI/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Notification.tsx
│   │   ├── hooks/
│   │   │   ├── useNodes.ts
│   │   │   ├── useEdges.ts
│   │   │   ├── useMindmap.ts
│   │   │   └── useAutoSave.ts
│   │   ├── store/
│   │   │   └── mindmapStore.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── nodes.api.ts
│   │   │   ├── edges.api.ts
│   │   │   ├── media.api.ts
│   │   │   └── ai.api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── shared/
│   └── types/
│       ├── node.types.ts
│       ├── edge.types.ts
│       ├── media.types.ts
│       └── mindmap.types.ts
│
├── docker-compose.yml
├── package.json
├── README.md
└── .gitignore
```

### Appendix D: Docker Compose Configuration

**docker-compose.yml**
```yaml
version: '3.8'

services:
  # Databases
  postgres-nodes:
    image: postgres:15
    environment:
      POSTGRES_DB: principle_nodes_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres-nodes-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-edges:
    image: postgres:15
    environment:
      POSTGRES_DB: principle_edges_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5433:5432"
    volumes:
      - postgres-edges-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-media:
    image: postgres:15
    environment:
      POSTGRES_DB: principle_media_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5434:5432"
    volumes:
      - postgres-media-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Services
  node-service:
    build:
      context: ./node-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://principle_user:principle_pass@postgres-nodes:5432/principle_nodes_db
      PORT: 3001
    depends_on:
      postgres-nodes:
        condition: service_healthy
    volumes:
      - ./node-service/src:/app/src
    restart: unless-stopped

  edge-service:
    build:
      context: ./edge-service
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://principle_user:principle_pass@postgres-edges:5432/principle_edges_db
      PORT: 3002
    depends_on:
      postgres-edges:
        condition: service_healthy
    volumes:
      - ./edge-service/src:/app/src
    restart: unless-stopped

  media-service:
    build:
      context: ./media-service
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      DATABASE_URL: postgresql://principle_user:principle_pass@postgres-media:5432/principle_media_db
      PORT: 3003
      UPLOAD_DIR: /app/uploads
    depends_on:
      postgres-media:
        condition: service_healthy
    volumes:
      - ./media-service/src:/app/src
      - media-uploads:/app/uploads
    restart: unless-stopped

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      NODE_SERVICE_URL: http://node-service:3001
      EDGE_SERVICE_URL: http://edge-service:3002
      MEDIA_SERVICE_URL: http://media-service:3003
      AI_SERVICE_URL: http://ai-service:3004
    depends_on:
      - node-service
      - edge-service
      - media-service
    volumes:
      - ./api-gateway/src:/app/src
    restart: unless-stopped

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "3004:3004"
    environment:
      PORT: 3004
    volumes:
      - ./ai-service/src:/app/src
    restart: unless-stopped

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./client/src:/app/src
    restart: unless-stopped

volumes:
  postgres-nodes-data:
  postgres-edges-data:
  postgres-media-data:
  media-uploads:
```

---

## 21. Summary

This PRD outlines a comprehensive plan for **Principle**, an interactive mindmap application built with a microservices architecture that runs entirely locally (except for optional AI features).

**Key Highlights:**
- ✅ **100% Local:** All services and data on user's machine
- ✅ **Microservices:** Scalable, maintainable architecture
- ✅ **Rich Content:** Text + images in each node
- ✅ **Graph Structure:** True graph, not just tree
- ✅ **Extensible:** Easy to add AI and other wrappers
- ✅ **Privacy-First:** User owns all data
- ✅ **5-Week MVP:** Achievable timeline with clear phases

**Architecture Summary:**
- **5 Microservices:** API Gateway, Node Service, Edge Service, Media Service, AI Service (optional)
- **3 PostgreSQL Databases:** One per core service
- **1 React Client:** Modern, fast UI with React Flow
- **Local Storage:** Images stored in filesystem
- **External APIs:** Optional, only for AI features

**Next Steps:**
1. Review and approve PRD
2. Begin Phase 0: Project Setup
3. Implement Phase 1-5 sequentially
4. Test thoroughly
5. Deploy locally
6. Plan future enhancements

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Status:** Ready for Review

---

**End of PRD**
