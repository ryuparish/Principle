# MCP Server Integration for Principle Concept Maps

**Design Document v1.0**
**Author**: Claude Sonnet 4.5
**Date**: 2026-01-03

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [MCP Tools Specification](#mcp-tools-specification)
6. [MCP Resources Specification](#mcp-resources-specification)
7. [Implementation Plan](#implementation-plan)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Integration](#deployment--integration)
10. [Future Enhancements](#future-enhancements)
11. [Design Decisions & Rationale](#design-decisions--rationale)

---

## Executive Summary

### Goal
Implement a production-quality Model Context Protocol (MCP) server that enables AI assistants (Claude Desktop, Claude Code) to directly interact with the Principle concept mapping application through a standardized, extensible protocol.

### Key Objectives
1. **Enable AI Operations**: Allow Claude to create, modify, search, and analyze concept maps
2. **Best Foundation**: Design for extensibility, testability, and maintainability
3. **Production Quality**: Implement proper validation, error handling, logging, and testing
4. **Zero Breaking Changes**: Integrate alongside existing REST API without modifications
5. **Future-Proof**: Support advanced features like batch operations, analytics, and AI-powered suggestions

### High-Level Approach
- **Standalone MCP Server**: Separate package that shares database with existing services
- **Service Reuse**: Leverage existing TypeORM entities and service patterns
- **MCP Protocol**: Expose Tools (actions), Resources (data), and Prompts (templates)
- **Production-Ready**: Full validation, logging, error handling, and testing infrastructure

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Claude Desktop / Claude Code               │
└────────────────────────┬────────────────────────────────┘
                         │
                  JSON-RPC 2.0 (stdio)
                         │
┌────────────────────────▼────────────────────────────────┐
│          NEW: concept-map-mcp-server                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MCP Protocol Layer                                │ │
│  │  - Tools (create, update, delete, search)          │ │
│  │  - Resources (maps, nodes, analytics)              │ │
│  │  - Prompts (summarize, generate, suggest)          │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────────┐ │
│  │  Service Layer                                     │ │
│  │  - ConceptMapService (CRUD operations)            │ │
│  │  - NodeService (node management)                  │ │
│  │  - EdgeService (relationship management)          │ │
│  │  - ValidationService (business rules)             │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────────┐ │
│  │  Database Layer (TypeORM + SQLite)                │ │
│  │  - Shared entities (Node, ConceptMap, Edge)       │ │
│  │  - Same database as REST API                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ║
                         ║ (Shared Database)
                         ║
┌────────────────────────▼────────────────────────────────┐
│         EXISTING: REST API Microservices                │
│  - api-gateway (port 3000)                              │
│  - node-service (port 3001)                             │
│  - edge-service (port 3002)                             │
│  - media-service (port 3003)                            │
│  - ai-service (port 3004)                               │
│  - queue-service (port 3005)                            │
└─────────────────────────────────────────────────────────┘
```

### Design Rationale

**Why Standalone Server?**
- **Isolation**: No risk to production REST API
- **Protocol Differences**: MCP uses stdio/JSON-RPC vs HTTP/REST
- **Independent Evolution**: Can iterate on MCP features separately
- **Flexible Authentication**: Different auth strategies without affecting REST API

**Why Share Database?**
- **Single Source of Truth**: No data synchronization issues
- **Immediate Visibility**: MCP operations instantly visible in UI
- **Simplicity**: One database to backup, migrate, and manage

**Why Share Entities?**
- **Code Reuse**: Don't duplicate data models
- **Consistency**: Same validation and transformation logic
- **Maintainability**: Single point of change for schema updates

---

## Project Structure

```
/Users/ryuparish/Code/Principle/
├── mcp-server/                          # NEW: MCP server package
│   ├── package.json                     # Dependencies & scripts
│   ├── tsconfig.json                    # TypeScript config
│   ├── .env.example                     # Environment template
│   ├── README.md                        # Setup & usage docs
│   │
│   ├── src/
│   │   ├── index.ts                     # Server entry point
│   │   │
│   │   ├── config/
│   │   │   ├── database.ts              # TypeORM connection
│   │   │   └── logging.ts               # Structured logging
│   │   │
│   │   ├── tools/                       # MCP Tools (actions)
│   │   │   ├── index.ts                 # Tool registration
│   │   │   ├── conceptMaps/
│   │   │   │   ├── createMap.ts         # Create concept map
│   │   │   │   ├── updateMap.ts         # Update map metadata
│   │   │   │   ├── deleteMap.ts         # Delete map (cascade)
│   │   │   │   └── exportMap.ts         # Export to JSON
│   │   │   ├── nodes/
│   │   │   │   ├── createNode.ts        # Create single node
│   │   │   │   ├── updateNode.ts        # Update node
│   │   │   │   ├── deleteNode.ts        # Soft-delete node
│   │   │   │   ├── batchCreateNodes.ts  # Create multiple nodes
│   │   │   │   └── searchNodes.ts       # Search by title
│   │   │   ├── edges/
│   │   │   │   ├── createEdge.ts        # Create connection
│   │   │   │   ├── deleteEdge.ts        # Remove connection
│   │   │   │   └── batchCreateEdges.ts  # Create multiple edges
│   │   │   ├── portals/
│   │   │   │   ├── createPortal.ts      # Create portal node
│   │   │   │   └── validatePortal.ts    # Check portal validity
│   │   │   └── analysis/                # Advanced operations
│   │   │       ├── findOrphans.ts       # Find disconnected nodes
│   │   │       ├── detectCycles.ts      # Find circular edges
│   │   │       └── suggestConnections.ts # AI suggestions
│   │   │
│   │   ├── resources/                   # MCP Resources (read-only)
│   │   │   ├── index.ts                 # Resource registration
│   │   │   ├── mapList.ts               # conceptmap://maps
│   │   │   ├── mapDetail.ts             # conceptmap://map/{id}
│   │   │   ├── nodeDetail.ts            # conceptmap://node/{id}
│   │   │   ├── templates.ts             # conceptmap://templates
│   │   │   └── analytics.ts             # conceptmap://analytics/{id}
│   │   │
│   │   ├── prompts/                     # MCP Prompts (templates)
│   │   │   ├── index.ts                 # Prompt registration
│   │   │   ├── summarizeMap.ts          # Summarize structure
│   │   │   ├── generateNodes.ts         # Generate from text
│   │   │   ├── suggestStructure.ts      # Suggest improvements
│   │   │   └── explainConcepts.ts       # Explain relationships
│   │   │
│   │   ├── schemas/                     # Zod validation
│   │   │   ├── tools.ts                 # Tool input/output
│   │   │   ├── resources.ts             # Resource schemas
│   │   │   └── domain.ts                # Business rules
│   │   │
│   │   ├── services/                    # Business logic
│   │   │   ├── ConceptMapService.ts     # Map operations
│   │   │   ├── NodeService.ts           # Node operations
│   │   │   ├── EdgeService.ts           # Edge operations
│   │   │   └── ValidationService.ts     # Validation logic
│   │   │
│   │   ├── entities/                    # TypeORM entities (symlinked)
│   │   │   ├── ConceptMap.ts            # → node-service/src/entities/
│   │   │   ├── Node.ts                  # → node-service/src/entities/
│   │   │   └── Edge.ts                  # → edge-service/src/entities/
│   │   │
│   │   ├── utils/
│   │   │   ├── errors.ts                # Custom error classes
│   │   │   └── validation.ts            # Validation helpers
│   │   │
│   │   └── types/
│   │       └── index.ts                 # Type definitions
│   │
│   ├── tests/
│   │   ├── tools/                       # Tool unit tests
│   │   │   ├── createMap.test.ts
│   │   │   └── batchCreateNodes.test.ts
│   │   ├── services/                    # Service tests
│   │   │   └── ConceptMapService.test.ts
│   │   └── integration/                 # Integration tests
│   │       └── mcp-protocol.test.ts
│   │
│   └── examples/
│       ├── usage.md                     # Example interactions
│       └── claude-desktop-config.json   # Config template
│
├── docs/                                # NEW: Documentation
│   └── mcp-server-design.md             # This document
│
├── node-service/                        # EXISTING: REST API
├── edge-service/                        # EXISTING: REST API
├── media-service/                       # EXISTING: REST API
└── ... (other services)
```

---

## Core Components

### 1. Database Configuration

**File**: `mcp-server/src/config/database.ts`

```typescript
import { DataSource } from 'typeorm';
import { Node } from '../entities/Node.js';
import { ConceptMap } from '../entities/ConceptMap.js';
import { Edge } from '../entities/Edge.js';
import { logger } from './logging.js';

export async function createDataSource(): Promise<DataSource> {
  const dbPath = process.env.DATABASE_URL || './dev.db';

  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Node, ConceptMap, Edge],
    synchronize: false, // Never auto-sync, use migrations
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false
  });

  try {
    await dataSource.initialize();
    logger.info('Database connection established', { path: dbPath });
    return dataSource;
  } catch (error) {
    logger.error('Database connection failed', error as Error);
    throw error;
  }
}
```

**Key Features**:
- Shares same database as REST API
- Never auto-synchronizes schema (safety)
- Environment-based configuration
- Comprehensive error handling

### 2. Logging System

**File**: `mcp-server/src/config/logging.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logPath: string;

  constructor() {
    this.logPath = process.env.MCP_LOG_PATH || '/tmp/principle-mcp.log';
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private write(level: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${level}: ${message}`;

    // Write to stderr (visible in MCP logs)
    console.error(entry);

    // Write to log file for persistence
    fs.appendFileSync(this.logPath, entry + '\n');
    if (data) {
      fs.appendFileSync(this.logPath, JSON.stringify(data, null, 2) + '\n');
    }
  }

  info(message: string, data?: unknown) {
    this.write('INFO', message, data);
  }

  error(message: string, error?: Error) {
    this.write('ERROR', message, error ? {
      message: error.message,
      stack: error.stack
    } : undefined);
  }

  debug(message: string, data?: unknown) {
    if (process.env.DEBUG) {
      this.write('DEBUG', message, data);
    }
  }
}

export const logger = new Logger();
```

**Why This Design?**:
- **stderr for MCP**: stdout reserved for JSON-RPC protocol
- **File persistence**: Debugging after the fact
- **Structured data**: JSON logging for complex objects
- **Debug mode**: Conditional verbose logging

### 3. Validation Schemas

**File**: `mcp-server/src/schemas/tools.ts`

```typescript
import { z } from 'zod';

// Reusable schemas
export const positionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(5)
});

// Create concept map
export const createMapSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  initialViewport: viewportSchema.optional()
});

// Update concept map
export const updateMapSchema = z.object({
  mapId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  viewport: viewportSchema.optional()
});

// Create node
export const createNodeSchema = z.object({
  mapId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  position: positionSchema.optional(),
  shape: z.enum([
    'rounded-rectangle', 'rectangle', 'circle', 'diamond',
    'hexagon', 'ellipse', 'triangle', 'portal'
  ]).optional(),
  tags: z.array(z.string()).optional(),
  nodeType: z.enum(['regular', 'portal']).optional()
});

// Batch create nodes
export const batchCreateNodesSchema = z.object({
  mapId: z.string().uuid(),
  nodes: z.array(z.object({
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    position: positionSchema.optional(),
    tags: z.array(z.string()).optional()
  })).min(1).max(50) // Safety: limit batch size
});

// Search nodes
export const searchNodesSchema = z.object({
  mapId: z.string().uuid(),
  query: z.string().min(1).max(200)
});

// Delete operations
export const deleteMapSchema = z.object({
  mapId: z.string().uuid()
});

export const deleteNodeSchema = z.object({
  nodeId: z.string().uuid()
});
```

**Design Principles**:
- **Runtime validation**: Zod provides type safety + runtime checks
- **Clear constraints**: Max lengths, allowed values, batch limits
- **Composability**: Reusable schemas (position, viewport)
- **Self-documenting**: Schema structure mirrors expected data

### 4. Service Layer

**File**: `mcp-server/src/services/ConceptMapService.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { ConceptMap } from '../entities/ConceptMap.js';
import { Node } from '../entities/Node.js';
import { logger } from '../config/logging.js';

export interface CreateMapInput {
  name: string;
  description?: string;
  initialViewport?: { x: number; y: number; zoom: number };
}

export class ConceptMapService {
  private mapRepository: Repository<ConceptMap>;
  private nodeRepository: Repository<Node>;

  constructor(dataSource: DataSource) {
    this.mapRepository = dataSource.getRepository(ConceptMap);
    this.nodeRepository = dataSource.getRepository(Node);
  }

  async getAllMaps(): Promise<ConceptMap[]> {
    logger.debug('Fetching all concept maps');
    return await this.mapRepository
      .createQueryBuilder('conceptMap')
      .leftJoinAndSelect('conceptMap.nodes', 'node', 'node.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('conceptMap.updatedAt', 'DESC')
      .getMany();
  }

  async getMapById(id: string): Promise<ConceptMap | null> {
    logger.debug('Fetching concept map', { id });
    return await this.mapRepository
      .createQueryBuilder('conceptMap')
      .leftJoinAndSelect('conceptMap.nodes', 'node', 'node.isDeleted = :isDeleted', { isDeleted: false })
      .where('conceptMap.id = :id', { id })
      .getOne();
  }

  async createMap(input: CreateMapInput): Promise<ConceptMap> {
    logger.info('Creating concept map', { name: input.name });

    const map = this.mapRepository.create({
      name: input.name,
      description: input.description,
      viewport: input.initialViewport || { x: 0, y: 0, zoom: 1 }
    });

    return await this.mapRepository.save(map);
  }

  async getMapStatistics(id: string) {
    const map = await this.getMapById(id);
    if (!map) throw new Error(`Concept map ${id} not found`);

    const nodeCount = map.nodes?.length || 0;
    const portalCount = map.nodes?.filter(n => n.nodeType === 'portal').length || 0;
    const tagSet = new Set(map.nodes?.flatMap(n => n.tags || []));

    return {
      mapId: id,
      name: map.name,
      nodeCount,
      portalNodeCount: portalCount,
      regularNodeCount: nodeCount - portalCount,
      uniqueTags: Array.from(tagSet),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt
    };
  }
}
```

**Service Patterns**:
- **Repository pattern**: Clean separation from persistence
- **Query builders**: Complex joins with filtering (soft-deleted nodes)
- **Business logic**: Statistics calculation, analytics
- **Error handling**: Meaningful error messages

---

## MCP Tools Specification

### Tool Implementation Pattern

Each tool follows this structure:

```typescript
export async function handleToolName(
  input: unknown,
  service: ServiceType
) {
  try {
    // 1. Validate input with Zod
    const validated = toolSchema.parse(input);

    // 2. Delegate to service layer
    const result = await service.performOperation(validated);

    // 3. Log operation
    logger.info('Operation completed', { ...metadata });

    // 4. Return structured response
    return {
      content: [
        {
          type: 'text',
          text: 'Human-readable success message'
        },
        {
          type: 'resource',
          resource: {
            uri: 'conceptmap://resource-uri',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2)
          }
        }
      ]
    };
  } catch (error) {
    // 5. Handle validation errors gracefully
    if (error instanceof z.ZodError) {
      return {
        content: [{
          type: 'text',
          text: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }],
        isError: true
      };
    }

    // 6. Log and re-throw unexpected errors
    logger.error('Tool failed', error as Error);
    throw error;
  }
}
```

### Core Tools (Phase 1)

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `create_concept_map` | Create new concept map | name, description?, viewport? | Map with ID |
| `update_concept_map` | Update map metadata | mapId, name?, description?, viewport? | Updated map |
| `delete_concept_map` | Delete map (cascade) | mapId | Success confirmation |
| `create_node` | Create single node | mapId, title, description?, position?, shape?, tags? | Node with ID |
| `batch_create_nodes` | Create multiple nodes | mapId, nodes[] (up to 50) | Created nodes array |
| `update_node` | Update node properties | nodeId, title?, description?, position?, shape?, tags? | Updated node |
| `delete_node` | Soft-delete node | nodeId | Success confirmation |
| `search_nodes` | Search by title | mapId, query | Matching nodes (max 20) |

### Advanced Tools (Phase 2 - Future)

| Tool Name | Description | Use Case |
|-----------|-------------|----------|
| `create_edge` | Create connection between nodes | Link related concepts |
| `batch_create_edges` | Create multiple edges | Bulk relationship creation |
| `create_portal` | Create portal to another map | Cross-map navigation |
| `validate_portal_chain` | Check portal validity | Ensure portals aren't broken |
| `find_orphans` | Find disconnected nodes | Identify isolated concepts |
| `detect_cycles` | Find circular relationships | Prevent infinite loops |
| `suggest_connections` | AI-powered link suggestions | Enhance map structure |
| `export_map` | Export to JSON/Markdown | Backup, sharing |
| `reorganize_layout` | Auto-arrange nodes | Clean up visual layout |

---

## MCP Resources Specification

### Resource URI Patterns

Resources provide **read-only** access to concept map data. They use URI templates for dynamic access.

| URI Pattern | Description | Returns |
|-------------|-------------|---------|
| `conceptmap://maps` | List all concept maps | Array of maps with metadata |
| `conceptmap://map/{mapId}` | Full map structure | Map with nodes and edges |
| `conceptmap://node/{nodeId}` | Single node details | Node with all properties |
| `conceptmap://analytics/{mapId}` | Map statistics | Node counts, tags, portals |
| `conceptmap://templates` | Node/map templates | Common patterns |

### Resource Implementation

**File**: `mcp-server/src/resources/index.ts`

```typescript
export function registerResources(
  server: Server,
  mapService: ConceptMapService,
  nodeService: NodeService
) {
  server.setRequestHandler('resources/read', async (request) => {
    const { uri } = request.params;

    // Pattern matching for dynamic URIs
    if (uri === 'conceptmap://maps') {
      const maps = await mapService.getAllMaps();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            maps: maps.map(m => ({
              id: m.id,
              name: m.name,
              description: m.description,
              nodeCount: m.nodes?.length || 0,
              updatedAt: m.updatedAt
            }))
          }, null, 2)
        }]
      };
    }

    const mapMatch = uri.match(/^conceptmap:\/\/map\/(.+)$/);
    if (mapMatch) {
      const mapId = mapMatch[1];
      const map = await mapService.getMapById(mapId);
      if (!map) throw new Error(`Concept map ${mapId} not found`);

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(map, null, 2)
        }]
      };
    }

    // ... more URI patterns

    throw new Error(`Unknown resource URI: ${uri}`);
  });

  // List available resources
  server.setRequestHandler('resources/list', async () => {
    return {
      resources: [
        {
          uri: 'conceptmap://maps',
          name: 'All Concept Maps',
          description: 'List of all concept maps with metadata',
          mimeType: 'application/json'
        },
        // ... more resources
      ]
    };
  });
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal**: Set up MCP server infrastructure

- [ ] Create `mcp-server/` directory structure
- [ ] Initialize package.json with dependencies
- [ ] Set up TypeScript configuration
- [ ] Create database connection module
- [ ] Implement logging system
- [ ] Create symlinks to shared entities
- [ ] Write validation schemas with Zod

**Deliverables**:
- MCP server compiles successfully
- Database connection works
- Logging to file functional

### Phase 2: Core Tools (Week 2)

**Goal**: Implement basic CRUD operations

- [ ] Implement ConceptMapService
- [ ] Implement NodeService
- [ ] Create tool handlers:
  - [ ] `create_concept_map`
  - [ ] `update_concept_map`
  - [ ] `delete_concept_map`
  - [ ] `create_node`
  - [ ] `update_node`
  - [ ] `delete_node`
  - [ ] `batch_create_nodes`
  - [ ] `search_nodes`
- [ ] Register tools with MCP server
- [ ] Write unit tests for each tool

**Deliverables**:
- All 8 core tools functional
- Unit test coverage > 80%
- Tools list endpoint returns correct metadata

### Phase 3: Resources (Week 2-3)

**Goal**: Implement read-only data access

- [ ] Implement resource handlers:
  - [ ] `conceptmap://maps`
  - [ ] `conceptmap://map/{mapId}`
  - [ ] `conceptmap://node/{nodeId}`
  - [ ] `conceptmap://analytics/{mapId}`
- [ ] Register resources with MCP server
- [ ] Test resource URIs

**Deliverables**:
- All resources return correct data
- URI pattern matching works
- Resources list endpoint functional

### Phase 4: Integration & Testing (Week 3)

**Goal**: End-to-end testing and Claude Desktop integration

- [ ] Build server for distribution (`npm run build`)
- [ ] Test with MCP Inspector tool
- [ ] Configure Claude Desktop integration
- [ ] Manual testing of all tools and resources
- [ ] Write integration tests
- [ ] Performance testing

**Deliverables**:
- Server works with Claude Desktop
- All tools callable from Claude
- All resources accessible
- Integration tests passing

### Phase 5: Documentation (Week 3-4)

**Goal**: Complete setup and usage documentation

- [ ] Write README.md for mcp-server
- [ ] Create setup guide
- [ ] Document all tools with examples
- [ ] Document all resources with examples
- [ ] Create troubleshooting guide
- [ ] Write contribution guidelines

**Deliverables**:
- Complete documentation
- Example interactions documented
- Setup guide verified by fresh install

### Phase 6: Advanced Features (Week 4+)

**Goal**: Add sophisticated capabilities

- [ ] Implement analysis tools (orphans, cycles)
- [ ] Add portal management tools
- [ ] Create prompts for map generation
- [ ] Implement export/import tools
- [ ] Add batch edge operations

**Deliverables**:
- Advanced tools functional
- Prompts enhance AI interactions
- Export/import working

---

## Testing Strategy

### Unit Tests

**Tool**: Vitest

**Coverage Goals**:
- Services: >90%
- Tool handlers: >80%
- Validation schemas: 100%

**Example Test**:

```typescript
// tests/tools/createMap.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { handleCreateMap } from '../../src/tools/conceptMaps/createMap.js';
import { ConceptMapService } from '../../src/services/ConceptMapService.js';

describe('createMap tool', () => {
  let mockMapService: ConceptMapService;

  beforeEach(() => {
    mockMapService = {
      createMap: async (input) => ({
        id: 'test-id',
        name: input.name,
        description: input.description,
        viewport: input.initialViewport || { x: 0, y: 0, zoom: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } as any;
  });

  it('should create a map with valid input', async () => {
    const result = await handleCreateMap({
      name: 'Test Map',
      description: 'A test'
    }, mockMapService);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Test Map');
  });

  it('should reject empty name', async () => {
    const result = await handleCreateMap({
      name: ''
    }, mockMapService);

    expect(result.isError).toBe(true);
  });
});
```

### Integration Tests

**Tool**: MCP Inspector + manual testing

```bash
# Test server with MCP Inspector
cd mcp-server
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

**Test Scenarios**:
1. Server startup and connection
2. Tools list returns all tools
3. Resources list returns all resources
4. Create map → verify in database
5. Batch create nodes → verify positions
6. Search nodes → verify results
7. Delete map → verify cascade
8. Error handling → verify error responses

### Performance Tests

**Metrics**:
- Tool response time < 100ms (simple operations)
- Batch operations < 500ms (50 nodes)
- Resource fetch < 50ms (single map)
- Database query optimization

---

## Deployment & Integration

### Local Development Setup

```bash
# 1. Install dependencies
cd /Users/ryuparish/Code/Principle/mcp-server
npm install

# 2. Create symlinks to shared entities
ln -s ../../node-service/src/entities/Node.ts src/entities/Node.ts
ln -s ../../node-service/src/entities/ConceptMap.ts src/entities/ConceptMap.ts
ln -s ../../edge-service/src/entities/Edge.ts src/entities/Edge.ts

# 3. Set environment variables
cp .env.example .env
# Edit .env to set DATABASE_URL=/path/to/dev.db

# 4. Build
npm run build

# 5. Test with MCP Inspector
npm run test:inspector
```

### Claude Desktop Integration

**File**: `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "principle-concept-maps": {
      "command": "node",
      "args": [
        "/Users/ryuparish/Code/Principle/mcp-server/dist/index.js"
      ],
      "env": {
        "DATABASE_URL": "/Users/ryuparish/Code/Principle/node-service/dev.db",
        "NODE_ENV": "production",
        "MCP_LOG_PATH": "/tmp/principle-mcp.log"
      }
    }
  }
}
```

### Production Deployment

**Option 1: Local Process**
```bash
# Run as background process
nohup node dist/index.js > /dev/null 2>&1 &
```

**Option 2: systemd Service**
```ini
# /etc/systemd/system/principle-mcp.service
[Unit]
Description=Principle MCP Server
After=network.target

[Service]
Type=simple
User=principle
WorkingDirectory=/opt/principle/mcp-server
Environment="DATABASE_URL=/opt/principle/data/db.sqlite"
Environment="NODE_ENV=production"
Environment="MCP_LOG_PATH=/var/log/principle-mcp/server.log"
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Future Enhancements

### Advanced Analytics

```typescript
// Tool: analyze_map_structure
{
  mapId: string
}
// Returns:
{
  clusterCount: number,
  avgClusterSize: number,
  mostConnectedNodes: Array<{nodeId, connectionCount}>,
  isolatedNodes: string[],
  hubNodes: string[],
  suggestedConnections: Array<{from, to, confidence}>
}
```

### AI-Powered Generation

```typescript
// Prompt: generate_map_from_text
Input: "Explain the water cycle"
Output: Auto-generated concept map with nodes:
- Evaporation
- Condensation
- Precipitation
- Collection
With appropriate edges between them
```

### Real-Time Subscriptions

```typescript
// Resource with subscription
server.resource(
  'Live Map Updates',
  'conceptmap://map/{mapId}/live',
  'application/json',
  async (uri) => {
    // ... return current state
  },
  {
    subscribe: true,
    // Notify clients when map changes
  }
);
```

### Export/Import Tools

```typescript
// Tool: export_map
{
  mapId: string,
  format: 'json' | 'markdown' | 'svg' | 'png'
}
// Returns: Exported data in requested format

// Tool: import_map
{
  data: string,
  format: 'json' | 'markdown',
  mergeStrategy: 'replace' | 'append'
}
// Returns: Imported map with new ID
```

### Collaborative Features

```typescript
// Tool: share_map
{
  mapId: string,
  visibility: 'public' | 'unlisted' | 'private',
  permissions: {
    canView: boolean,
    canEdit: boolean,
    canDelete: boolean
  }
}
// Returns: Share URL and token
```

---

## Design Decisions & Rationale

### 1. Standalone Server vs API Extension

**Decision**: Standalone MCP server in separate package

**Rationale**:
- **Risk Isolation**: MCP server crashes don't affect REST API
- **Protocol Difference**: stdio/JSON-RPC is fundamentally different from HTTP
- **Independent Deployment**: Can update MCP features without redeploying REST API
- **Authentication Flexibility**: Different auth strategies without breaking existing API
- **Development Speed**: Can iterate rapidly without coordination with REST API team

**Trade-offs**:
- ✅ No risk to production
- ✅ Clear separation of concerns
- ❌ Some code duplication (services)
- ❌ Two codebases to maintain

### 2. Code Sharing Strategy

**Decision**: Symlink entities, copy/adapt services

**Rationale**:
- **Entities are stable**: Data models rarely change, safe to share
- **Services need adaptation**: MCP-specific error handling, logging, response format
- **Avoid tight coupling**: Services can evolve independently
- **Easy to diverge**: If MCP needs different logic, just modify the copy

**Implementation**:
```bash
# Symlink entities (read-only sharing)
ln -s ../../node-service/src/entities/Node.ts src/entities/Node.ts

# Copy services (can modify)
cp ../node-service/src/services/NodeService.ts src/services/NodeService.ts
# Then adapt for MCP (add logging, error handling, etc.)
```

### 3. Database Access

**Decision**: Share same SQLite database with REST API

**Rationale**:
- **Single source of truth**: No data synchronization issues
- **Immediate visibility**: MCP changes instantly visible in UI
- **Simpler architecture**: One database to backup, migrate, monitor
- **Data consistency**: No eventual consistency problems

**Considerations**:
- ✅ Simpler deployment
- ✅ No data sync issues
- ⚠️ Must coordinate migrations with REST API
- ⚠️ Write lock contention (SQLite limitation, but unlikely with current usage)

### 4. Validation Strategy

**Decision**: Zod schemas for all tool inputs

**Rationale**:
- **Runtime validation**: TypeScript only validates at compile-time
- **Type safety**: Zod provides both runtime and compile-time types
- **Great error messages**: Clear validation errors for debugging
- **Self-documenting**: Schema structure shows exactly what's expected
- **Composability**: Build complex schemas from simple ones

**Example**:
```typescript
// Type safety + runtime validation in one
const schema = z.object({
  name: z.string().min(1),
  tags: z.array(z.string()).optional()
});

type Input = z.infer<typeof schema>; // TypeScript type
const validated = schema.parse(input); // Runtime validation
```

### 5. Tool vs Resource Design

**Decision**: Tools for mutations, Resources for queries

**Rationale**:
- **Follows MCP philosophy**: Tools are actions, Resources are data
- **Caching**: Resources can be cached by clients
- **Subscriptions**: Resources can support real-time updates
- **Security**: Different permission models (execute vs read)
- **Performance**: Resources optimized for fast reads

**Guidelines**:
- **Use Tool** when: Creating, updating, deleting, triggering actions
- **Use Resource** when: Fetching data, browsing, searching (read-only)

### 6. Error Handling Pattern

**Decision**: Structured error responses with isError flag

**Rationale**:
- **User-friendly**: Validation errors return helpful messages
- **Debug-friendly**: Logs include full error details
- **MCP protocol**: Follows MCP best practices for error reporting
- **Graceful degradation**: Errors don't crash server

**Pattern**:
```typescript
try {
  // Validate and execute
} catch (error) {
  if (error instanceof z.ZodError) {
    // User-friendly validation error
    return {
      content: [{ type: 'text', text: 'Validation error: ...' }],
      isError: true
    };
  }
  // Log and re-throw unexpected errors
  logger.error('Unexpected error', error);
  throw error;
}
```

### 7. Logging Strategy

**Decision**: File-based logging with stderr output

**Rationale**:
- **Protocol safety**: stdout reserved for JSON-RPC messages
- **Persistence**: File logs available after server restart
- **Debugging**: Can tail log file during development
- **Production**: Can aggregate logs with standard tools

**Implementation**:
```typescript
// stderr: visible in real-time
console.error(`[INFO] ${message}`);

// file: persistent storage
fs.appendFileSync(logPath, `[INFO] ${message}\n`);
```

---

## Appendix A: Complete File Listing

### Files to Create (30 files)

**Infrastructure (5)**
1. `mcp-server/package.json`
2. `mcp-server/tsconfig.json`
3. `mcp-server/README.md`
4. `mcp-server/.env.example`
5. `mcp-server/src/index.ts`

**Configuration (2)**
6. `mcp-server/src/config/database.ts`
7. `mcp-server/src/config/logging.ts`

**Schemas (3)**
8. `mcp-server/src/schemas/tools.ts`
9. `mcp-server/src/schemas/resources.ts`
10. `mcp-server/src/schemas/domain.ts`

**Services (4)**
11. `mcp-server/src/services/ConceptMapService.ts`
12. `mcp-server/src/services/NodeService.ts`
13. `mcp-server/src/services/EdgeService.ts`
14. `mcp-server/src/services/ValidationService.ts`

**Tools (10)**
15. `mcp-server/src/tools/index.ts`
16. `mcp-server/src/tools/conceptMaps/createMap.ts`
17. `mcp-server/src/tools/conceptMaps/updateMap.ts`
18. `mcp-server/src/tools/conceptMaps/deleteMap.ts`
19. `mcp-server/src/tools/nodes/createNode.ts`
20. `mcp-server/src/tools/nodes/updateNode.ts`
21. `mcp-server/src/tools/nodes/deleteNode.ts`
22. `mcp-server/src/tools/nodes/batchCreateNodes.ts`
23. `mcp-server/src/tools/nodes/searchNodes.ts`
24. `mcp-server/src/tools/edges/createEdge.ts`

**Resources (1)**
25. `mcp-server/src/resources/index.ts`

**Tests (3)**
26. `mcp-server/tests/tools/createMap.test.ts`
27. `mcp-server/tests/tools/batchCreateNodes.test.ts`
28. `mcp-server/tests/services/ConceptMapService.test.ts`

**Documentation (2)**
29. `mcp-server/examples/usage.md`
30. `docs/mcp-server-design.md` (this document)

### Files to Symlink (3)

31. `mcp-server/src/entities/Node.ts` → `../../node-service/src/entities/Node.ts`
32. `mcp-server/src/entities/ConceptMap.ts` → `../../node-service/src/entities/ConceptMap.ts`
33. `mcp-server/src/entities/Edge.ts` → `../../edge-service/src/entities/Edge.ts`

---

## Appendix B: Example Interactions

### Example 1: Creating a Concept Map

**User**: "Create a concept map called 'Software Architecture Patterns' to organize design patterns"

**Claude uses tool**: `create_concept_map`
```json
{
  "name": "Software Architecture Patterns",
  "description": "Common design patterns and architectural styles"
}
```

**Response**:
```
✓ Created concept map "Software Architecture Patterns" (ID: a1b2c3d4-...)

Resource URI: conceptmap://map/a1b2c3d4-...
```

### Example 2: Batch Creating Nodes

**User**: "Add these design patterns to the map: MVC, MVVM, Repository, Factory, Observer"

**Claude uses tool**: `batch_create_nodes`
```json
{
  "mapId": "a1b2c3d4-...",
  "nodes": [
    { "title": "MVC Pattern", "tags": ["architecture", "ui"] },
    { "title": "MVVM Pattern", "tags": ["architecture", "ui"] },
    { "title": "Repository Pattern", "tags": ["data-access"] },
    { "title": "Factory Pattern", "tags": ["creational"] },
    { "title": "Observer Pattern", "tags": ["behavioral"] }
  ]
}
```

**Response**:
```
✓ Created 5 nodes in concept map

Nodes created:
- MVC Pattern (position: 100, 100)
- MVVM Pattern (position: 350, 100)
- Repository Pattern (position: 600, 100)
- Factory Pattern (position: 100, 250)
- Observer Pattern (position: 350, 250)
```

### Example 3: Searching Nodes

**User**: "Find all nodes related to 'pattern'"

**Claude uses tool**: `search_nodes`
```json
{
  "mapId": "a1b2c3d4-...",
  "query": "pattern"
}
```

**Response**:
```
Found 5 matching nodes:
- MVC Pattern
- MVVM Pattern
- Repository Pattern
- Factory Pattern
- Observer Pattern
```

### Example 4: Getting Map Analytics

**Claude uses resource**: `conceptmap://analytics/a1b2c3d4-...`

**Response**:
```json
{
  "mapId": "a1b2c3d4-...",
  "name": "Software Architecture Patterns",
  "nodeCount": 5,
  "portalNodeCount": 0,
  "regularNodeCount": 5,
  "uniqueTags": ["architecture", "ui", "data-access", "creational", "behavioral"],
  "createdAt": "2026-01-03T21:00:00Z",
  "updatedAt": "2026-01-03T21:05:00Z"
}
```

---

## Appendix C: Success Metrics

### Phase 1 Success Criteria

- [ ] MCP server compiles without errors
- [ ] Database connection established
- [ ] Logging to file works
- [ ] All TypeScript types resolve correctly

### Phase 2 Success Criteria

- [ ] All 8 core tools functional
- [ ] Unit test coverage > 80%
- [ ] Tools callable via MCP Inspector
- [ ] Error handling returns meaningful messages

### Phase 3 Success Criteria

- [ ] All 4 resources return correct data
- [ ] URI pattern matching works
- [ ] Resources list endpoint functional
- [ ] Resource data matches database

### Phase 4 Success Criteria

- [ ] Claude Desktop connects successfully
- [ ] Can create maps via natural language
- [ ] Can batch create nodes
- [ ] Can search nodes
- [ ] Resources accessible from Claude
- [ ] Logs show all operations

### Production Readiness Criteria

- [ ] All tests passing (unit + integration)
- [ ] Documentation complete
- [ ] Performance meets targets
- [ ] Error handling comprehensive
- [ ] Logging provides adequate debugging info
- [ ] No security vulnerabilities
- [ ] Database backups configured
- [ ] Monitoring/alerting set up

---

**End of Design Document**

*This document is a living specification and will be updated as the MCP server evolves.*
