# Phase 2: Node Content Editor with Rich Text

## Overview

Phase 2 builds upon Phase 1's core mindmap functionality by adding a rich text editor to node content. This enables users to create detailed, formatted notes within each mindmap node using a professional-grade TipTap editor.

**Goal**: Transform basic text nodes into rich content containers with full formatting capabilities.

**Key Features**:
- Click nodes to open a content editor modal
- Rich text formatting (bold, italic, underline, headings, lists, links)
- Professional toolbar with formatting buttons
- Auto-save functionality
- Content validation and error handling
- Smooth UX with loading states

**Tech Stack**:
- **TipTap**: Headless rich text editor framework
- **React**: Component architecture
- **TypeScript**: Type safety for content schema
- **Zustand**: State management for editor state
- **Node Service**: Backend content storage

## Prerequisites

Before starting Phase 2, ensure:
1. ✅ Phase 1 is complete and working
2. ✅ You can create, move, and delete nodes on the canvas
3. ✅ All services are running (`./start-services.sh`)
4. ✅ Database is populated with at least one mindmap
5. ✅ Client is accessible at http://localhost:5174

## Architecture Changes

### Database Schema Update
The `content` field in the `MindmapNode` table will store rich text as JSON:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello ",
          "marks": []
        },
        {
          "type": "text",
          "text": "world",
          "marks": [{"type": "bold"}]
        }
      ]
    }
  ]
}
```

### Component Architecture
```
MindMapCanvas
├── CustomNode (existing)
│   └── NodeEditorModal (new)
│       └── TipTapEditor (new)
│           ├── MenuBar (formatting toolbar)
│           └── EditorContent (TipTap component)
```

## Implementation Steps

### Step 1: Install TipTap Dependencies

Navigate to the client directory and install TipTap packages:

```bash
cd client
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-placeholder
```

**Packages explanation**:
- `@tiptap/react`: React wrapper for TipTap
- `@tiptap/starter-kit`: Essential extensions (bold, italic, headings, etc.)
- `@tiptap/extension-link`: Link support
- `@tiptap/extension-underline`: Underline formatting
- `@tiptap/extension-placeholder`: Placeholder text in empty editor

### Step 2: Update TypeScript Types

Update the types file to support rich text content:

**File**: `client/src/types/index.ts`

```typescript
export interface Position {
  x: number;
  y: number;
}

export interface MindmapNode {
  id: string;
  mindmapId: string;
  title: string;
  content: any; // TipTap JSON content (previously string)
  position: Position;
  createdAt: string;
  updatedAt: string;
}

export interface Mindmap {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes?: MindmapNode[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMindmapDto {
  name: string;
  description?: string;
}

export interface UpdateMindmapDto {
  name?: string;
  description?: string;
}

export interface CreateNodeDto {
  mindmapId: string;
  title: string;
  content?: any; // TipTap JSON content
  position: Position;
}

export interface UpdateNodeDto {
  title?: string;
  content?: any; // TipTap JSON content
  position?: Position;
}
```

### Step 3: Create TipTap Editor Component

Create a reusable TipTap editor component with toolbar:

**File**: `client/src/components/Editor/TipTapEditor.tsx`

```typescript
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import './TipTapEditor.css';

interface TipTapEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const MenuBar = () => {
    return (
      <div className="menu-bar">
        <div className="menu-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold (Cmd+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic (Cmd+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            title="Underline (Cmd+U)"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="menu-divider" />

        <div className="menu-group">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            title="Heading 3"
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive('paragraph') ? 'is-active' : ''}
            title="Paragraph"
          >
            P
          </button>
        </div>

        <div className="menu-divider" />

        <div className="menu-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            title="Numbered List"
          >
            1. List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Blockquote"
          >
            " Quote
          </button>
        </div>

        <div className="menu-divider" />

        <div className="menu-group">
          <button
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor.isActive('link') ? 'is-active' : ''}
            title="Add Link"
          >
            Link
          </button>
          {editor.isActive('link') && (
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
            >
              Unlink
            </button>
          )}
        </div>

        <div className="menu-divider" />

        <div className="menu-group">
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            —
          </button>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Cmd+Z)"
          >
            Undo
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Cmd+Shift+Z)"
          >
            Redo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="tiptap-editor-wrapper">
      <MenuBar />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor;
```

### Step 4: Create TipTap Editor Styles

**File**: `client/src/components/Editor/TipTapEditor.css`

```css
.tiptap-editor-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  height: 100%;
}

.menu-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.menu-group {
  display: flex;
  gap: 2px;
}

.menu-divider {
  width: 1px;
  height: 24px;
  background: #d0d0d0;
  margin: 0 4px;
}

.menu-bar button {
  padding: 6px 10px;
  border: 1px solid transparent;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.15s ease;
  color: #333;
  min-width: 32px;
}

.menu-bar button:hover:not(:disabled) {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.menu-bar button.is-active {
  background: #0066cc;
  color: white;
  border-color: #0052a3;
}

.menu-bar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tiptap-editor {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 300px;
  max-height: 500px;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* TipTap content styles */
.tiptap-editor h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
  line-height: 1.2;
}

.tiptap-editor h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
  line-height: 1.3;
}

.tiptap-editor h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
  line-height: 1.4;
}

.tiptap-editor p {
  margin: 0.5em 0;
}

.tiptap-editor ul,
.tiptap-editor ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.tiptap-editor li {
  margin: 0.25em 0;
}

.tiptap-editor blockquote {
  border-left: 3px solid #0066cc;
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  color: #666;
  font-style: italic;
}

.tiptap-editor code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.tiptap-editor pre {
  background: #f4f4f4;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.tiptap-editor pre code {
  background: none;
  padding: 0;
}

.tiptap-editor .editor-link {
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
}

.tiptap-editor .editor-link:hover {
  color: #0052a3;
}

.tiptap-editor hr {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 1.5em 0;
}

/* Placeholder */
.tiptap-editor p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
```

### Step 5: Create Node Editor Modal Component

Create a modal that opens when a node is clicked, displaying the TipTap editor:

**File**: `client/src/components/Node/NodeEditorModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { MindmapNode } from '../../types';
import { useMindmapStore } from '../../store/mindmapStore';
import TipTapEditor from '../Editor/TipTapEditor';
import './NodeEditorModal.css';

interface NodeEditorModalProps {
  node: MindmapNode;
  isOpen: boolean;
  onClose: () => void;
}

const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  node,
  isOpen,
  onClose
}) => {
  const { updateNode } = useMindmapStore();
  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content || {
    type: 'doc',
    content: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Update local state when node prop changes
  useEffect(() => {
    setTitle(node.title);
    setContent(node.content || { type: 'doc', content: [] });
  }, [node]);

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateNode(node.id, { title, content });
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save node:', error);
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    handleSave();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <input
            type="text"
            className="node-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node Title"
            autoFocus
          />
          <div className="modal-actions">
            {saveMessage && (
              <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                {saveMessage}
              </span>
            )}
            {isSaving && <span className="saving-indicator">Saving...</span>}
            <button className="close-button" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your notes here..."
          />
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            <span className="node-id">ID: {node.id}</span>
            <span className="last-updated">
              Updated: {new Date(node.updatedAt).toLocaleString()}
            </span>
          </div>
          <button className="save-close-button" onClick={handleClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditorModal;
```

### Step 6: Create Node Editor Modal Styles

**File**: `client/src/components/Node/NodeEditorModal.css`

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  gap: 16px;
}

.node-title-input {
  flex: 1;
  font-size: 24px;
  font-weight: 600;
  border: none;
  outline: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.node-title-input:hover {
  background: #f5f5f5;
}

.node-title-input:focus {
  background: #f0f0f0;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-message {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
  animation: fadeIn 0.2s ease;
}

.save-message.success {
  color: #059669;
  background: #d1fae5;
}

.save-message.error {
  color: #dc2626;
  background: #fee2e2;
}

.saving-indicator {
  font-size: 14px;
  color: #666;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s ease;
}

.close-button:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 16px 24px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
}

.footer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.node-id {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.last-updated {
  font-size: 11px;
}

.save-close-button {
  padding: 10px 20px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.save-close-button:hover {
  background: #0052a3;
}

.save-close-button:active {
  transform: scale(0.98);
}
```

### Step 7: Update CustomNode to Open Editor Modal

Update the CustomNode component to handle clicks and open the editor modal:

**File**: `client/src/components/Node/CustomNode.tsx`

```typescript
import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MindmapNode } from '../../types';
import NodeEditorModal from './NodeEditorModal';
import './CustomNode.css';

interface CustomNodeData {
  label: string;
  node: MindmapNode;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleNodeClick = (e: React.MouseEvent) => {
    // Prevent opening editor when dragging
    if (e.detail === 1) {
      // Single click - open editor
      setTimeout(() => {
        if (!isDragging) {
          setIsEditorOpen(true);
        }
      }, 200);
    }
  };

  // Track dragging state
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(false);
    // Set dragging to true after a small delay
    setTimeout(() => setIsDragging(true), 100);
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  return (
    <>
      <div
        className="custom-node"
        onClick={handleNodeClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="node-handle"
        />
        <div className="node-content">
          <div className="node-title">{data.label}</div>
          {data.node.content && data.node.content.content?.length > 0 && (
            <div className="node-has-content-indicator">📝</div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="node-handle"
        />
      </div>

      <NodeEditorModal
        node={data.node}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

export default memo(CustomNode);
```

### Step 8: Update CustomNode Styles

**File**: `client/src/components/Node/CustomNode.css`

```css
.custom-node {
  padding: 12px 20px;
  border-radius: 8px;
  background: white;
  border: 2px solid #0066cc;
  min-width: 150px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.custom-node:hover {
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
  border-color: #0052a3;
  transform: translateY(-1px);
}

.custom-node.selected {
  border-color: #ff6b6b;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.node-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-has-content-indicator {
  font-size: 16px;
  opacity: 0.7;
}

.node-handle {
  width: 8px;
  height: 8px;
  background: #0066cc;
  border: 2px solid white;
  transition: all 0.15s ease;
}

.node-handle:hover {
  width: 12px;
  height: 12px;
  background: #0052a3;
}
```

### Step 9: Update Node Service Schema (Backend)

Update the Prisma schema to support JSON content type:

**File**: `node-service/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MindmapNode {
  id         String   @id @default(uuid())
  mindmapId  String
  title      String
  content    Json?    // Changed from String? to Json?
  position   Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("mindmap_nodes")
}
```

### Step 10: Apply Database Migration

Run the Prisma migration to update the database schema:

```bash
cd node-service
npx prisma migrate dev --name update-content-to-json
```

This will:
1. Generate a new migration file
2. Apply the migration to your database
3. Convert the `content` column from `TEXT` to `JSONB`
4. Regenerate Prisma Client

### Step 11: Update Node Service DTOs

Update the DTOs to support JSON content:

**File**: `node-service/src/dto/node.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateNodeDto {
  @IsUUID()
  @IsNotEmpty()
  mindmapId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsObject()
  @IsOptional()
  content?: any; // TipTap JSON content

  @IsObject()
  @IsNotEmpty()
  position: {
    x: number;
    y: number;
  };
}

export class UpdateNodeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  content?: any; // TipTap JSON content

  @IsObject()
  @IsOptional()
  position?: {
    x: number;
    y: number;
  };
}
```

### Step 12: Test the Implementation

#### Manual Testing Steps:

1. **Start all services**:
```bash
./restart-services.sh
```

2. **Open the client**:
```
http://localhost:5174
```

3. **Test node creation**:
   - Click on the canvas to create a new node
   - Verify the node appears at the correct position

4. **Test editor opening**:
   - Click on a node
   - Verify the editor modal opens
   - Verify the title is editable

5. **Test rich text formatting**:
   - Click the **B** button and type bold text
   - Click the **I** button and type italic text
   - Try creating headings (H1, H2, H3)
   - Try creating bullet lists and numbered lists
   - Add a link using the Link button
   - Test undo/redo functionality

6. **Test auto-save**:
   - Type some content
   - Wait 1 second
   - Check the browser console for save confirmation
   - Refresh the page
   - Click the node again - verify content persisted

7. **Test content indicator**:
   - Add content to a node and close the editor
   - Verify the 📝 emoji appears on nodes with content
   - Verify nodes without content don't show the emoji

8. **Test multi-select compatibility**:
   - Shift+Drag to select multiple nodes
   - Verify editor doesn't open during selection
   - Delete selected nodes
   - Verify remaining nodes still open editor on click

#### Database Verification:

Check that content is stored as JSON:

```bash
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "SELECT id, title, content FROM mindmap_nodes LIMIT 1;"
```

Expected output:
```
                  id                  |   title   |                content
--------------------------------------+-----------+----------------------------------------
 abc-123-def-456                      | Test Node | {"type":"doc","content":[{"type":"paragraph",...}]}
```

### Step 13: Troubleshooting

#### Issue: Editor not opening on click

**Symptom**: Clicking a node doesn't open the modal

**Solution**:
1. Check browser console for errors
2. Verify `NodeEditorModal` is imported correctly in `CustomNode.tsx`
3. Add debug logging:
```typescript
const handleNodeClick = (e: React.MouseEvent) => {
  console.log('Node clicked!');
  setIsEditorOpen(true);
};
```

#### Issue: Content not saving

**Symptom**: Content disappears after refresh

**Solution**:
1. Check browser console for network errors
2. Verify Node Service is running: `curl http://localhost:3001/health`
3. Check Node Service logs: `tail -f logs/node-service.log`
4. Verify database connection:
```bash
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "SELECT COUNT(*) FROM mindmap_nodes;"
```

#### Issue: Prisma migration fails

**Symptom**: Error running migration for JSON column

**Solution**:
1. Check if database is running:
```bash
docker-compose ps
```

2. Manually convert column type:
```bash
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "ALTER TABLE mindmap_nodes ALTER COLUMN content TYPE JSONB USING content::jsonb;"
```

3. Regenerate Prisma client:
```bash
cd node-service
npx prisma generate
```

#### Issue: TipTap toolbar not styling correctly

**Symptom**: Buttons appear unstyled or overlapping

**Solution**:
1. Verify `TipTapEditor.css` is imported in `TipTapEditor.tsx`
2. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
3. Check for CSS conflicts in browser DevTools

#### Issue: Modal doesn't close on Escape

**Symptom**: Pressing Escape key doesn't close the editor

**Solution**:
1. Verify `onKeyDown` handler is attached to modal content
2. Add focus to modal when opening:
```typescript
useEffect(() => {
  if (isOpen) {
    // Focus the modal content
    document.querySelector('.modal-content')?.focus();
  }
}, [isOpen]);
```

#### Issue: Content appears as plain text

**Symptom**: Rich formatting doesn't display, only raw JSON

**Solution**:
1. Verify TipTap extensions are loaded correctly
2. Check that `content` prop is parsed JSON, not a string:
```typescript
const [content, setContent] = useState(
  typeof node.content === 'string'
    ? JSON.parse(node.content)
    : node.content || { type: 'doc', content: [] }
);
```

## Success Criteria

Phase 2 is complete when:

- [x] TipTap editor dependencies installed
- [x] TipTapEditor component created with full toolbar
- [x] NodeEditorModal component created and styled
- [x] CustomNode opens editor on click
- [x] Rich text formatting works (bold, italic, underline, headings, lists, links)
- [x] Content auto-saves after 1 second
- [x] Content persists across page refreshes
- [x] Database schema updated to JSON type
- [x] Nodes with content show 📝 indicator
- [x] Editor closes on Escape or Save & Close button
- [x] No conflicts with multi-select functionality
- [x] All services restart cleanly

## Architecture Summary

### Frontend Components

```
client/src/
├── components/
│   ├── Canvas/
│   │   └── MindMapCanvas.tsx (unchanged from Phase 1)
│   ├── Node/
│   │   ├── CustomNode.tsx (updated - opens modal on click)
│   │   ├── CustomNode.css (updated - content indicator)
│   │   ├── NodeEditorModal.tsx (new - editor modal)
│   │   └── NodeEditorModal.css (new - modal styles)
│   └── Editor/
│       ├── TipTapEditor.tsx (new - rich text editor)
│       └── TipTapEditor.css (new - editor styles)
├── store/
│   └── mindmapStore.ts (unchanged - updateNode already exists)
└── types/
    └── index.ts (updated - content type changed to any/Json)
```

### Backend Services

```
node-service/
├── prisma/
│   └── schema.prisma (updated - content: Json?)
├── src/
│   └── dto/
│       └── node.dto.ts (updated - content type validation)
└── migrations/
    └── update-content-to-json/ (new migration)
```

## Next Steps: Phase 3

Phase 2 provides the foundation for rich node content. Phase 3 will add:

1. **Node Connections**: Visual edges between related nodes
2. **Connection Types**: Different edge styles (parent-child, reference, etc.)
3. **Auto-layout**: Organize connected nodes automatically
4. **Connection Management**: Create/delete connections via UI

To begin Phase 3, ensure Phase 2 success criteria are met, then refer to `Phase_3_Node_Connections.md` (to be created).

## API Reference

### Node Endpoints (unchanged from Phase 1)

All endpoints remain the same, but now accept/return JSON content:

**GET** `/api/nodes/:mindmapId` - Get all nodes for a mindmap
**POST** `/api/nodes` - Create a new node
```json
{
  "mindmapId": "uuid",
  "title": "My Node",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "position": { "x": 100, "y": 200 }
}
```

**PATCH** `/api/nodes/:id` - Update a node
```json
{
  "title": "Updated Title",
  "content": {
    "type": "doc",
    "content": [...]
  }
}
```

**DELETE** `/api/nodes/:id` - Delete a node

## Performance Considerations

1. **Auto-save throttling**: Saves occur 1 second after last edit to reduce API calls
2. **Modal rendering**: Only renders when `isOpen` is true
3. **Memo on CustomNode**: Prevents unnecessary re-renders of unchanged nodes
4. **JSON storage**: Efficient JSONB column type in PostgreSQL for querying

## Security Considerations

1. **Content validation**: Class-validator ensures content is valid JSON object
2. **XSS protection**: TipTap sanitizes HTML content automatically
3. **User isolation**: Mindmap ownership validated at API Gateway level
4. **Input sanitization**: Title and content validated before save

---

**Phase 2 Complete!** You now have a fully functional rich text editor for mindmap nodes. Users can create detailed, formatted notes with professional editing capabilities.
