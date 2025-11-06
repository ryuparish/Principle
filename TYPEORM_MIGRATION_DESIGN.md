# TypeORM Migration Design Document

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Proposed Architecture](#proposed-architecture)
4. [Entity Design](#entity-design)
5. [Data Flow](#data-flow)
6. [Migration Strategy](#migration-strategy)
7. [API Contract Preservation](#api-contract-preservation)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)
10. [Risk Analysis](#risk-analysis)
11. [Implementation Timeline](#implementation-timeline)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

**Objective:** Replace Prisma ORM with TypeORM across 3 microservices while maintaining 100% backward compatibility with existing SQLite databases and API contracts.

**Scope:**
- **node-service:** 3 entities (ConceptMap, Node, Edge)
- **edge-service:** 1 entity (Edge)
- **media-service:** 1 entity (Media)

**Key Constraint:** Zero data migration required - TypeORM must work with existing Prisma-created .db files.

**Success Criteria:**
- All existing API endpoints work identically
- All existing .db files readable without modification
- All tests pass
- No breaking changes for client application

**Rationale:** TypeORM is approved for use at restricted corporate environments where Prisma may be blocked by security policies.

---

## Current Architecture

### Prisma Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 API Gateway (Port 3000)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Node Service │ │ Edge Service │ │Media Service │
│  Port 3001   │ │  Port 3002   │ │  Port 3003   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Prisma Client│ │ Prisma Client│ │ Prisma Client│
│   Generated  │ │   Generated  │ │   Generated  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   dev.db     │ │   dev.db     │ │   dev.db     │
│   SQLite     │ │   SQLite     │ │   SQLite     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Current Data Layer

**File Structure:**
```
node-service/
├── prisma/
│   ├── schema.prisma          # Schema definition
│   └── migrations/            # Migration history
├── node_modules/
│   └── .prisma/
│       └── client-node/       # Generated Prisma Client
└── src/
    ├── index.ts               # Server setup
    └── routes/
        ├── concept-maps.ts    # Uses prisma.conceptMap.*
        ├── nodes.ts           # Uses prisma.node.*
        └── edges.ts           # Uses prisma.edge.*
```

**Current Query Pattern:**
```typescript
// Import generated client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Prisma handles:
// - Connection management
// - Query building
// - Type generation
// - Migrations

// Example usage
const nodes = await prisma.node.findMany({
  where: { conceptMapId: id },
  include: { conceptMap: true }
});
```

---

## Proposed Architecture

### TypeORM Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│                   (NO CHANGES)                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 API Gateway (Port 3000)                  │
│                   (NO CHANGES)                           │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Node Service │ │ Edge Service │ │Media Service │
│  Port 3001   │ │  Port 3002   │ │  Port 3003   │
│   MODIFIED   │ │   MODIFIED   │ │   MODIFIED   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  TypeORM     │ │  TypeORM     │ │  TypeORM     │
│ Repositories │ │ Repositories │ │ Repositories │
│   + Entities │ │   + Entities │ │   + Entities │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│better-sqlite3│ │better-sqlite3│ │better-sqlite3│
│   Driver     │ │   Driver     │ │   Driver     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   dev.db     │ │   dev.db     │ │   dev.db     │
│   SQLite     │ │   SQLite     │ │   SQLite     │
│ (UNCHANGED)  │ │ (UNCHANGED)  │ │ (UNCHANGED)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### New Data Layer

**File Structure:**
```
node-service/
├── src/
│   ├── data-source.ts         # TypeORM DataSource config
│   ├── entities/              # Entity definitions
│   │   ├── ConceptMap.ts      # Replaces Prisma model
│   │   ├── Node.ts
│   │   └── Edge.ts
│   ├── index.ts               # Server setup (MODIFIED)
│   └── routes/
│       ├── concept-maps.ts    # Uses Repository pattern
│       ├── nodes.ts
│       └── edges.ts
├── dev.db                     # Existing database (UNCHANGED)
└── package.json               # Updated dependencies
```

**New Query Pattern:**
```typescript
// Import DataSource and entities
import { AppDataSource } from './data-source';
import { Node } from './entities/Node';

// Initialize connection
await AppDataSource.initialize();

// Get repository
const nodeRepository = AppDataSource.getRepository(Node);

// TypeORM handles:
// - Connection management
// - Query building
// - Type safety via decorators
// - Manual migrations (if needed)

// Example usage
const nodes = await nodeRepository.find({
  where: { conceptMapId: id },
  relations: ['conceptMap']
});
```

---

## Entity Design

### Schema Mapping Strategy

**Key Principle:** TypeORM entities must produce identical SQL queries to Prisma for existing database compatibility.

### node-service Entity Design

#### ConceptMap Entity

**Prisma Schema:**
```prisma
model ConceptMap {
  id          String   @id @default(uuid())
  name        String
  description String?
  viewport    String   @default("{\"x\": 0, \"y\": 0, \"zoom\": 1}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  nodes       Node[]
  @@map("mindmaps")
}
```

**Database Schema (SQLite):**
```sql
CREATE TABLE "mindmaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "viewport" TEXT NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

**TypeORM Entity:**
```typescript
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert
} from 'typeorm';
import { Node } from './Node';

@Entity('mindmaps')  // Maps to existing table name
export class ConceptMap {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  // CRITICAL: JSON transformer for Prisma compatibility
  @Column('text', {
    default: '{"x":0,"y":0,"zoom":1}',
    transformer: {
      to: (value: any) => JSON.stringify(value),     // TypeScript → DB
      from: (value: string) => JSON.parse(value),    // DB → TypeScript
    }
  })
  viewport!: { x: number; y: number; zoom: number };

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Node, node => node.conceptMap)
  nodes!: Node[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
```

**Design Notes:**
- `@Entity('mindmaps')` - Matches existing table name
- `@PrimaryColumn('text')` - SQLite uses TEXT for UUIDs
- JSON transformer - Handles Prisma's JSON-as-string storage
- `@BeforeInsert()` - Replicates Prisma's `@default(uuid())`
- `@UpdateDateColumn` - Auto-updates on save (like Prisma's `@updatedAt`)

#### Node Entity

**Prisma Schema:**
```prisma
model Node {
  id            String     @id @default(uuid())
  conceptMapId  String     @map("mindmapId")
  title         String
  content       String     @default("{}")
  position      String
  style         String     @default("{}")
  imageIds      String     @default("[]")
  tags          String     @default("[]")
  isDeleted     Boolean    @default(false)
  deletedAt     DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  conceptMap    ConceptMap @relation(fields: [conceptMapId], references: [id], onDelete: Cascade)
  @@index([conceptMapId], map: "Node_mindmapId_idx")
  @@index([title])
  @@index([isDeleted])
  @@map("nodes")
}
```

**TypeORM Entity:**
```typescript
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { ConceptMap } from './ConceptMap';

@Entity('nodes')
@Index(['conceptMapId'])  // Match Prisma indexes
@Index(['title'])
@Index(['isDeleted'])
export class Node {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'mindmapId' })  // Column name differs from property
  conceptMapId!: string;

  @Column('text')
  title!: string;

  // Multiple JSON transformers for different fields
  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  content!: any;

  @Column('text', {
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  position!: { x: number; y: number };

  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  style!: any;

  // Array transformers (Prisma stores as JSON strings)
  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  imageIds!: string[];

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  tags!: string[];

  @Column('boolean', { default: false })
  isDeleted!: boolean;

  @Column('datetime', { nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // Relationship with CASCADE delete
  @ManyToOne(() => ConceptMap, conceptMap => conceptMap.nodes, {
    onDelete: 'CASCADE'  // Match Prisma's cascade behavior
  })
  @JoinColumn({ name: 'mindmapId' })  // Foreign key column name
  conceptMap!: ConceptMap;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
```

**Design Notes:**
- Multiple JSON transformers for different field types
- `name: 'mindmapId'` maps TS property `conceptMapId` to DB column `mindmapId`
- Array fields use JSON.stringify/parse
- `onDelete: 'CASCADE'` matches Prisma behavior
- Indexes match Prisma's `@@index` directives

#### Edge Entity

**TypeORM Entity:**
```typescript
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
  BeforeInsert
} from 'typeorm';

@Entity('edges')
@Unique(['sourceNodeId', 'targetNodeId'])  // Composite unique constraint
@Index(['conceptMapId'])
@Index(['sourceNodeId'])
@Index(['targetNodeId'])
export class Edge {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'mindmapId' })
  conceptMapId!: string;

  @Column('text')
  sourceNodeId!: string;

  @Column('text')
  targetNodeId!: string;

  @Column('text', { nullable: true })
  label?: string;

  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    }
  })
  style!: any;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
```

### media-service Entity Design

**TypeORM Entity:**
```typescript
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert
} from 'typeorm';

@Entity('media')
@Index(['nodeId'])
@Index(['filename'])
export class Media {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { nullable: true })
  nodeId?: string;

  @Column('text', { unique: true })
  filename!: string;

  @Column('text')
  originalName!: string;

  @Column('text')
  mimeType!: string;

  @Column('integer')
  sizeBytes!: number;

  @Column('integer', { nullable: true })
  width?: number;

  @Column('integer', { nullable: true })
  height?: number;

  @Column('text')
  url!: string;

  @Column('text', { nullable: true })
  thumbnailUrl?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
```

### DataSource Configuration

**node-service/src/data-source.ts**
```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConceptMap } from './entities/ConceptMap';
import { Node } from './entities/Node';
import { Edge } from './entities/Edge';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './dev.db',
  entities: [ConceptMap, Node, Edge],
  synchronize: false,  // CRITICAL: Don't auto-sync (we have existing data)
  logging: process.env.NODE_ENV === 'development',
});
```

---

## Data Flow

### Initialization Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Application Startup (src/index.ts)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Import 'reflect-metadata' (MUST BE FIRST)            │
│    - Required for TypeORM decorators                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Import AppDataSource (data-source.ts)                │
│    - Contains database configuration                    │
│    - Lists all entities                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. await AppDataSource.initialize()                     │
│    - Opens SQLite connection via better-sqlite3         │
│    - Reads entity metadata from decorators              │
│    - Validates schema matches database                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Create Express routes                                │
│    - Each route gets Repository instances               │
│    - Repositories handle CRUD operations                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Start HTTP server                                    │
│    - Ready to handle requests                           │
└─────────────────────────────────────────────────────────┘
```

### Request Flow (Example: GET /nodes)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Client Request: GET /nodes?conceptMapId=abc          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Express Route Handler                                │
│    const nodeRepository = AppDataSource.getRepository    │
│                          (Node)                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. TypeORM Repository Query                             │
│    const nodes = await nodeRepository.find({            │
│      where: { conceptMapId: 'abc' },                    │
│      relations: ['conceptMap']                          │
│    })                                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. TypeORM Query Builder                                │
│    - Translates to SQL:                                 │
│      SELECT * FROM nodes                                │
│      WHERE conceptMapId = 'abc'                         │
│      LEFT JOIN mindmaps ON ...                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. better-sqlite3 Driver                                │
│    - Executes raw SQL on dev.db                         │
│    - Returns rows                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 6. TypeORM Entity Hydration                             │
│    - Maps rows to Node entity instances                 │
│    - Applies transformers:                              │
│      * JSON.parse(content)                              │
│      * JSON.parse(position)                             │
│      * JSON.parse(imageIds)                             │
│    - Converts dates                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Route Handler Response                               │
│    res.json(nodes)                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Client Receives JSON Response                        │
│    [{ id: '...', title: '...', content: {...}, ... }]   │
└─────────────────────────────────────────────────────────┘
```

### Create Flow (Example: POST /nodes)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Client Request: POST /nodes                          │
│    Body: { title, content, position, conceptMapId }     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Route Handler Validation                             │
│    - Verify conceptMap exists                           │
│    - Validate required fields                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Create Entity Instance                               │
│    const node = nodeRepository.create({                 │
│      title, content, position, conceptMapId             │
│    })                                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. @BeforeInsert Hook Fires                             │
│    - Generates UUID: node.id = crypto.randomUUID()      │
│    - Sets timestamps: createdAt, updatedAt              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Apply Transformers (to direction)                    │
│    - content: {...} → JSON.stringify → "{...}"          │
│    - position: {x,y} → JSON.stringify → "{x,y}"         │
│    - imageIds: [] → JSON.stringify → "[]"               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Save to Database                                     │
│    await nodeRepository.save(node)                      │
│    - Generates INSERT SQL                               │
│    - Executes via better-sqlite3                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Return Created Entity                                │
│    res.status(201).json(node)                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Client Receives New Node                             │
│    { id: 'uuid', title: '...', content: {...}, ... }    │
└─────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase-by-Phase Execution

#### Phase 1: Preparation (Per Service)

**Objective:** Set up TypeORM infrastructure without breaking existing code.

**Steps:**
1. **Install dependencies**
   ```bash
   cd node-service
   npm install typeorm better-sqlite3 reflect-metadata
   npm install -D @types/better-sqlite3
   ```

2. **Update tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true,
       "strictPropertyInitialization": false
     }
   }
   ```

3. **Create data-source.ts**
   - Define database connection
   - List all entities
   - Set `synchronize: false` (critical!)

**Verification:**
- `npm run build` succeeds
- No runtime errors on import

#### Phase 2: Entity Creation (Per Service)

**Objective:** Create TypeORM entities that mirror Prisma schemas exactly.

**Steps:**
1. **Create entities/ directory**
   ```bash
   mkdir -p src/entities
   ```

2. **Convert each Prisma model → TypeORM entity**
   - Copy field names exactly
   - Match data types (text, integer, datetime)
   - Add transformers for JSON fields
   - Replicate indexes
   - Implement @BeforeInsert for UUIDs

3. **Create barrel export**
   ```typescript
   // src/entities/index.ts
   export { ConceptMap } from './ConceptMap';
   export { Node } from './Node';
   export { Edge } from './Edge';
   ```

**Verification:**
- TypeScript compilation succeeds
- No decorator errors
- Entities properly exported

#### Phase 3: Connection Initialization

**Objective:** Initialize TypeORM alongside Prisma (dual mode).

**Steps:**
1. **Update src/index.ts**
   ```typescript
   import 'reflect-metadata';  // FIRST import
   import express from 'express';
   import { AppDataSource } from './data-source';

   const app = express();

   // Initialize TypeORM
   AppDataSource.initialize()
     .then(() => {
       console.log('✅ TypeORM connected');
       // Start server
       app.listen(PORT, () => {
         console.log(`✅ Service running on :${PORT}`);
       });
     })
     .catch((error) => {
       console.error('❌ TypeORM connection failed:', error);
       process.exit(1);
     });
   ```

**Verification:**
- Service starts without errors
- TypeORM connection log appears
- Database file is read successfully

#### Phase 4: Route Migration (Per Route File)

**Objective:** Replace Prisma queries with TypeORM queries one route at a time.

**Strategy:** Migrate one HTTP endpoint at a time, test, then continue.

**Example: Migrate GET /nodes**

**Before (Prisma):**
```typescript
router.get('/nodes', async (req, res) => {
  const { conceptMapId } = req.query;

  const nodes = await prisma.node.findMany({
    where: conceptMapId ? { conceptMapId: conceptMapId as string } : {},
    include: { conceptMap: true }
  });

  res.json(nodes);
});
```

**After (TypeORM):**
```typescript
import { AppDataSource } from '../data-source';
import { Node } from '../entities/Node';

const nodeRepository = AppDataSource.getRepository(Node);

router.get('/nodes', async (req, res) => {
  const { conceptMapId } = req.query;

  const nodes = await nodeRepository.find({
    where: conceptMapId ? { conceptMapId: conceptMapId as string } : {},
    relations: ['conceptMap']
  });

  res.json(nodes);
});
```

**Testing After Each Migration:**
```bash
# Test the specific endpoint
curl http://localhost:3001/nodes
curl http://localhost:3001/nodes?conceptMapId=abc

# Verify response matches old behavior
```

**Migration Order (Recommended):**
1. GET endpoints (read-only, safest)
2. POST endpoints (creates)
3. PATCH/PUT endpoints (updates)
4. DELETE endpoints (most risky)

#### Phase 5: Cleanup (Per Service)

**Objective:** Remove Prisma completely once all routes migrated.

**Steps:**
1. **Search for remaining Prisma usage**
   ```bash
   grep -r "prisma" src/
   grep -r "@prisma/client" src/
   ```

2. **Remove Prisma imports**
   - Delete `import { PrismaClient }`
   - Delete `const prisma = new PrismaClient()`

3. **Uninstall Prisma**
   ```bash
   npm uninstall prisma @prisma/client
   ```

4. **Delete Prisma files**
   ```bash
   rm -rf prisma/
   rm -rf node_modules/.prisma/
   ```

5. **Update package.json scripts**
   - Remove `prisma:generate`
   - Remove `prisma:migrate`

**Verification:**
- No Prisma references in code
- All tests pass
- Service runs without Prisma

#### Phase 6: Testing & Documentation

**Objective:** Comprehensive testing and documentation updates.

**Steps:**
1. **Integration testing**
   - Test all CRUD operations
   - Test relationships (joins)
   - Test edge cases (null values, empty arrays)
   - Test cascade deletes

2. **Update documentation**
   - README.md - Remove Prisma instructions
   - GETTING_STARTED.md - Update setup steps
   - Add TypeORM documentation

3. **Update root package.json**
   - Remove Prisma scripts from root

**Verification:**
- Full application flow works
- Client app functions normally
- No console errors

---

## API Contract Preservation

### Critical: Zero Breaking Changes

**Guarantee:** All existing API endpoints must return identical JSON responses.

### Response Format Comparison

**Prisma Response (Current):**
```json
{
  "id": "abc-123",
  "title": "Test Node",
  "content": {"ops": [{"insert": "Hello"}]},
  "position": {"x": 100, "y": 200},
  "style": {"backgroundColor": "#fff"},
  "imageIds": ["img1", "img2"],
  "tags": ["tag1"],
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2025-01-15T12:00:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z",
  "conceptMapId": "map-1"
}
```

**TypeORM Response (Must Match):**
```json
{
  "id": "abc-123",
  "title": "Test Node",
  "content": {"ops": [{"insert": "Hello"}]},
  "position": {"x": 100, "y": 200},
  "style": {"backgroundColor": "#fff"},
  "imageIds": ["img1", "img2"],
  "tags": ["tag1"],
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2025-01-15T12:00:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z",
  "conceptMapId": "map-1"
}
```

### Query Translation Reference

| Prisma Method | TypeORM Equivalent | Notes |
|---------------|-------------------|-------|
| `findMany()` | `find()` | Exact match |
| `findUnique({ where })` | `findOne({ where })` | Single result |
| `findFirst()` | `findOne()` | First match |
| `create({ data })` | `create() + save()` | Two steps |
| `update({ where, data })` | `update()` or `save()` | Both work |
| `delete({ where })` | `delete()` | Exact match |
| `include: { relation }` | `relations: ['relation']` | Eager loading |
| `where: { field }` | `where: { field }` | Same syntax |
| `orderBy: { field: 'asc' }` | `order: { field: 'ASC' }` | Uppercase |

---

## Testing Strategy

### Unit Testing

**Test 1: Entity Creation**
```typescript
import { Node } from '../entities/Node';

describe('Node Entity', () => {
  it('should generate UUID on creation', () => {
    const node = new Node();
    node.generateId();
    expect(node.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should have default values', () => {
    const node = new Node();
    expect(node.isDeleted).toBe(false);
  });
});
```

**Test 2: Transformers**
```typescript
import { AppDataSource } from '../data-source';
import { Node } from '../entities/Node';

describe('Node Transformers', () => {
  let nodeRepository;

  beforeAll(async () => {
    await AppDataSource.initialize();
    nodeRepository = AppDataSource.getRepository(Node);
  });

  it('should transform position JSON correctly', async () => {
    const node = nodeRepository.create({
      title: 'Test',
      position: { x: 100, y: 200 },
      conceptMapId: 'test-map'
    });

    await nodeRepository.save(node);

    const saved = await nodeRepository.findOne({ where: { id: node.id } });
    expect(saved.position).toEqual({ x: 100, y: 200 });
    expect(typeof saved.position).toBe('object');
  });

  it('should transform array fields correctly', async () => {
    const node = nodeRepository.create({
      title: 'Test',
      imageIds: ['img1', 'img2'],
      tags: ['tag1'],
      position: { x: 0, y: 0 },
      conceptMapId: 'test-map'
    });

    await nodeRepository.save(node);

    const saved = await nodeRepository.findOne({ where: { id: node.id } });
    expect(saved.imageIds).toEqual(['img1', 'img2']);
    expect(Array.isArray(saved.imageIds)).toBe(true);
  });
});
```

### Integration Testing

**Test Suite Structure:**
```
tests/
├── setup.ts                    # Initialize test database
├── teardown.ts                 # Cleanup
└── integration/
    ├── concept-maps.test.ts
    ├── nodes.test.ts
    ├── edges.test.ts
    └── relationships.test.ts
```

**Example Integration Test:**
```typescript
import request from 'supertest';
import { app } from '../src/index';
import { AppDataSource } from '../src/data-source';

describe('Node API', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('GET /nodes', () => {
    it('should return all nodes for a concept map', async () => {
      const response = await request(app)
        .get('/nodes?conceptMapId=test-map')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('position');
      expect(typeof response.body[0].position).toBe('object');
    });
  });

  describe('POST /nodes', () => {
    it('should create a new node', async () => {
      const newNode = {
        title: 'Test Node',
        content: { ops: [{ insert: 'Test' }] },
        position: { x: 0, y: 0 },
        conceptMapId: 'test-map'
      };

      const response = await request(app)
        .post('/nodes')
        .send(newNode)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Node');
      expect(response.body.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('PATCH /nodes/:id', () => {
    it('should update node position', async () => {
      const response = await request(app)
        .patch('/nodes/existing-node-id')
        .send({ position: { x: 100, y: 200 } })
        .expect(200);

      expect(response.body.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('DELETE /nodes/:id', () => {
    it('should delete a node', async () => {
      await request(app)
        .delete('/nodes/existing-node-id')
        .expect(204);
    });
  });
});
```

### Manual Testing Checklist

**Per Service:**
- [ ] Service starts without errors
- [ ] Database connection succeeds
- [ ] All GET endpoints return data
- [ ] All POST endpoints create records
- [ ] All PATCH endpoints update records
- [ ] All DELETE endpoints remove records
- [ ] Relationships load correctly (joins)
- [ ] JSON fields parse correctly
- [ ] Array fields parse correctly
- [ ] Dates format correctly
- [ ] Error handling works

**Full Application:**
- [ ] Client can load concept maps
- [ ] Client can create nodes
- [ ] Client can move nodes (position updates)
- [ ] Client can edit node content (TipTap)
- [ ] Client can create edges
- [ ] Client can delete edges
- [ ] Client can upload media
- [ ] Client can delete concept maps (cascade works)

---

## Rollback Plan

### Scenario: Migration Fails

**If issues occur during migration, we can roll back to Prisma.**

### Rollback Steps

1. **Stop all services**
   ```bash
   npm run kill
   ```

2. **Revert code changes**
   ```bash
   git checkout docker-free  # Go back to Prisma version
   # Or if committed:
   git revert <commit-hash>
   ```

3. **Reinstall Prisma**
   ```bash
   cd node-service && npm install prisma @prisma/client
   cd edge-service && npm install prisma @prisma/client
   cd media-service && npm install prisma @prisma/client
   ```

4. **Regenerate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Restart services**
   ```bash
   npm run dev:all
   ```

### Database Safety

**Critical:** TypeORM's `synchronize: false` means:
- No automatic schema changes
- Existing .db files remain untouched
- Rollback is always possible

**Database Backup (Recommended Before Migration):**
```bash
cp node-service/dev.db node-service/dev.db.backup
cp edge-service/dev.db edge-service/dev.db.backup
cp media-service/dev.db media-service/dev.db.backup
```

**Restore if needed:**
```bash
mv node-service/dev.db.backup node-service/dev.db
mv edge-service/dev.db.backup edge-service/dev.db
mv media-service/dev.db.backup media-service/dev.db
```

---

## Risk Analysis

### High-Risk Areas

#### 1. JSON Transformers
**Risk:** Transformer errors could cause data corruption or parsing failures.

**Mitigation:**
- Extensive unit tests for each transformer
- Test with existing database data
- Verify round-trip (save → read → save)

**Testing:**
```typescript
// Test case
const original = { x: 100, y: 200 };
node.position = original;
await repo.save(node);
const loaded = await repo.findOne({ where: { id: node.id } });
expect(loaded.position).toEqual(original);  // Must pass
```

#### 2. Relationship Cascades
**Risk:** CASCADE DELETE might not work, causing orphaned records.

**Mitigation:**
- Test cascade deletes explicitly
- Verify `onDelete: 'CASCADE'` in entity decorators
- Check SQLite foreign key constraints enabled

**Testing:**
```typescript
// Test case
const map = await mapRepo.save({ name: 'Test' });
const node = await nodeRepo.save({ title: 'Test', conceptMapId: map.id });
await mapRepo.delete({ id: map.id });
const orphan = await nodeRepo.findOne({ where: { id: node.id } });
expect(orphan).toBeNull();  // Must pass - node should be deleted
```

#### 3. Date Handling
**Risk:** Date formats might differ between Prisma and TypeORM.

**Mitigation:**
- Use `@CreateDateColumn` and `@UpdateDateColumn`
- Test date serialization to JSON
- Verify ISO 8601 format in responses

**Testing:**
```typescript
// Test case
const node = await nodeRepo.save({ title: 'Test' });
expect(node.createdAt).toBeInstanceOf(Date);
const json = JSON.parse(JSON.stringify(node));
expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
```

#### 4. UUID Generation
**Risk:** UUIDs might not generate correctly with `@BeforeInsert`.

**Mitigation:**
- Test UUID generation in unit tests
- Verify `crypto.randomUUID()` works in Node.js
- Check for duplicate IDs

**Testing:**
```typescript
// Test case
const node1 = await nodeRepo.save({ title: 'Test 1' });
const node2 = await nodeRepo.save({ title: 'Test 2' });
expect(node1.id).not.toBe(node2.id);
expect(node1.id).toMatch(/^[0-9a-f-]{36}$/i);
```

### Medium-Risk Areas

#### 5. Unique Constraints
**Risk:** Composite unique constraints might not enforce properly.

**Mitigation:**
- Test duplicate edge creation (sourceNodeId + targetNodeId)
- Verify `@Unique` decorator syntax

#### 6. Index Performance
**Risk:** Missing indexes could slow queries.

**Mitigation:**
- Verify all `@Index` decorators applied
- Compare query performance Prisma vs TypeORM
- Use `EXPLAIN QUERY PLAN` if needed

### Low-Risk Areas

#### 7. TypeScript Compilation
**Risk:** Decorator errors could prevent compilation.

**Mitigation:**
- Enable decorators in tsconfig.json
- Import `reflect-metadata` first
- Test compilation frequently

#### 8. Better-sqlite3 Driver
**Risk:** Driver incompatibility with TypeORM.

**Mitigation:**
- Use exact versions: `better-sqlite3@^9.0.0`
- Test connection initialization
- Verify synchronous API works

---

## Implementation Timeline

### Service-by-Service Approach

**Total Time Estimate: 14 hours**

| Service | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Total |
|---------|---------|---------|---------|---------|---------|---------|-------|
| **node-service** | 30m | 1h | 15m | 3h | 30m | 1h | **6h 15m** |
| **edge-service** | 30m | 30m | 15m | 1h | 30m | 30m | **3h 15m** |
| **media-service** | 30m | 30m | 15m | 1h | 30m | 30m | **3h 15m** |
| **Documentation** | - | - | - | - | - | 1h | **1h** |
| **Integration Testing** | - | - | - | - | - | 30m | **30m** |

### Recommended Order

1. **Start with media-service** (simplest, 1 entity)
   - Learn TypeORM patterns
   - Test transformer approach
   - Build confidence

2. **Then edge-service** (simple, 1 entity)
   - Test unique constraints
   - Test indexes
   - Verify no issues

3. **Finally node-service** (complex, 3 entities)
   - Test relationships
   - Test cascades
   - Most critical service

---

## Success Metrics

### Completion Criteria

- [ ] All 3 services running on TypeORM
- [ ] Zero Prisma dependencies remaining
- [ ] All API endpoints functional
- [ ] All integration tests passing
- [ ] Client application works normally
- [ ] No console errors
- [ ] Database files unchanged (same .db files)
- [ ] Documentation updated
- [ ] Code committed to docker-free branch

### Performance Benchmarks

**Target:** TypeORM performance should match or exceed Prisma.

| Operation | Prisma Baseline | TypeORM Target |
|-----------|----------------|----------------|
| GET /nodes | 50ms | ≤ 50ms |
| POST /nodes | 100ms | ≤ 100ms |
| PATCH /nodes/:id | 75ms | ≤ 75ms |
| DELETE /nodes/:id | 80ms | ≤ 80ms |
| GET /nodes (with relations) | 120ms | ≤ 120ms |

---

## Conclusion

This design provides a comprehensive, low-risk migration path from Prisma to TypeORM that:

1. **Preserves all existing data** - No database migrations required
2. **Maintains API contracts** - Client application unaffected
3. **Enables rollback** - Can revert to Prisma if issues occur
4. **Supports incremental migration** - One service/route at a time
5. **Provides testing strategy** - Unit + integration tests
6. **Minimizes risk** - Careful transformer design, cascade testing

**Next Steps:** Upon approval, implementation will begin with media-service (simplest) to validate the approach before proceeding to more complex services.
