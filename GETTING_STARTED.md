# Getting Started with Principle

A complete guide to cloning, running, and using Principle - your local-first concept mapping tool with Vim-style keyboard navigation.

---

## Part 1: Installation

### Step 1: Prerequisites

Make sure you have **Node.js v18+** installed:

```bash
# Check your Node.js version
node --version

# Should show v18.0.0 or higher
```

**Don't have Node.js?**
- Download from: https://nodejs.org/
- Or install via Homebrew: `brew install node`

### Step 2: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url> Principle

# Navigate into the directory
cd Principle

# Switch to the docker-free branch
git checkout docker-free
```

**Already have the files?** Just `cd` into the Principle directory.

### Step 3: Install Dependencies

```bash
npm run install:all
```

This will:
- Install root dependencies
- Install all 6 backend service dependencies
- Install client (React) dependencies
- **Create `.env` files** from `.env.example` templates

**Takes:** ~2-3 minutes

**You'll see:** A lot of npm install output, followed by "✅ Created [service]/.env" messages.

### Step 4: Database Setup

No manual setup needed! TypeORM automatically creates the SQLite databases and schema on first startup.

The databases will be created at:
- `node-service/dev.db` - Your concept maps and nodes
- `edge-service/dev.db` - Connections between nodes
- `media-service/dev.db` - Image metadata

**Note:** The databases are created when you first run `npm run dev:all` (next step).

---

## Part 2: Running the Application

### Start Everything

```bash
npm run dev:all
```

**You'll see output like:**

```
✅ API Gateway running on http://localhost:3000
✅ Node Service running on http://localhost:3001
 Edge Service running on http://localhost:3002
 Media Service running on http://localhost:3003
 AI Service running on http://localhost:3004
✅ Queue Service running on http://localhost:3005
📊 Queue: in-memory (no Redis needed)

VITE ready in 892ms
➜ Local: http://localhost:5173/
```

**Wait for:** The Vite message showing `http://localhost:5173/`

**Takes:** ~5-10 seconds for all services to start

### Open the App

Open your browser and go to: **http://localhost:5173**

You should see an empty canvas with a status bar at the bottom.

---

## Part 3: Using Principle

### The Basics

Principle has two modes:
1. **Mouse Mode** (default) - Drag nodes, click to select, use UI buttons
2. **Vim Mode** (keyboard-first) - Navigate and edit with Vim-style keys

Let's start with Mouse Mode, then learn Vim Mode.

---

## Mouse Mode Quick Start

### Creating Your First Node

1. **Double-click** anywhere on the canvas
2. A new node appears with a text editor
3. Type your title (e.g., "My First Idea")
4. Click outside the node to save

**Or use the Create Button:**
- Click "Create Node" button (if available)
- Type your content
- Click "Save" or click outside

### Moving Nodes

- **Click and drag** any node to reposition it
- The position auto-saves after 1 second

### Connecting Nodes (Creating Edges)

1. Click the small circle on the right side of a node (the "handle")
2. Drag to another node's left handle
3. Release to create a connection

**Alternative:** Use the "Add Edge" button and select source/target nodes

### Editing Node Content

1. **Click** on a node to select it
2. The TipTap editor opens on the right side
3. Edit your text with rich formatting:
   - **Bold**: `Ctrl+B` or `Cmd+B`
   - *Italic*: `Ctrl+I` or `Cmd+I`
   - Underline: `Ctrl+U` or `Cmd+U`
   - Links: `Ctrl+K` or `Cmd+K`

### Deleting Nodes

1. Click a node to select it
2. Press `Delete` key or click "Delete" button

---

## Vim Mode - Keyboard-First Workflow

### Enabling Vim Mode

Press: **`Ctrl+;`** (Control + Semicolon)

You'll see: **`-- NORMAL --`** in the bottom status bar

Press **`Ctrl+;`** again to toggle back to mouse mode.

---

## Vim Mode: The Essentials

Vim Mode has 7 modes. Here are the important ones:

### 1. NORMAL MODE (Default)

This is your navigation hub. You can:
- Move focus between nodes
- Enter other modes
- Execute commands

**Key Concept:** In Vim, you navigate FIRST, then take action.

---

### Navigation in NORMAL MODE

**Moving Focus:**
```
h - Focus node to the LEFT
j - Focus node BELOW
k - Focus node ABOVE
l - Focus node to the RIGHT
```

**The focused node has a pulsing BLUE outline.**

**Quick Navigation:**
```
gg - Jump to FIRST node
G  - Jump to LAST node
Tab - Cycle to NEXT node
Shift+Tab - Cycle to PREVIOUS node
```

**Centering:**
```
zz - Center camera on focused node
```

---

### 2. INSERT MODE - Editing Text

**Enter Insert Mode:** Press `i` (while in NORMAL mode)

You'll see: **`-- INSERT --`** in the status bar

**Now you can:**
- Type text into the focused node
- Use arrow keys to move cursor
- Use normal text editing (Backspace, Delete, etc.)

**Rich Text Shortcuts (in Insert Mode):**
```
Ctrl+B - Bold
Ctrl+I - Italic
Ctrl+U - Underline
Ctrl+K - Add link
```

**Exit Insert Mode:** Press `Escape` or `Ctrl+[`

---

### 3. VISUAL MODE - Selecting Multiple Nodes

**Enter Visual Mode:** Press `v` (while in NORMAL mode)

You'll see: **`-- VISUAL --`** in the status bar

**Select nodes:**
```
h, j, k, l - Move and SELECT nodes in that direction
```

**Selected nodes have an ORANGE outline.**

**Exit Visual Mode:** Press `Escape` or `v` again

---

### 4. MOVE MODE - Keyboard Positioning

**Enter Move Mode:** Press `m` (while in NORMAL mode)

You'll see: **`-- MOVE --`** in the status bar

**Move the focused node:**
```
h - Move LEFT (50px)
j - Move DOWN (50px)
k - Move UP (50px)
l - Move RIGHT (50px)
```

**With Visual Selection:**
- Select multiple nodes in VISUAL mode
- Press `m` to enter MOVE mode
- Move ALL selected nodes together!

**Exit Move Mode:** Press `Escape` or `m` again

---

### 5. EDGE MODE - Creating Connections

**Enter Edge Mode:** Press `e` (while in NORMAL mode)

You'll see: **`-- EDGE --`** in the status bar

**Create a connection:**
1. The currently focused node becomes the SOURCE
2. Navigate to another node with `h, j, k, l`
3. Press `Enter` to create an edge
4. You'll see a line connecting the nodes

**The status bar shows:** `Source: <nodeId> → Target: <nodeId>`

**Cancel:** Press `Escape` or `e` again

---

### 6. EDGE EDIT MODE - Managing Connections

**Enter Edge Edit Mode:** Press `Shift+E` (capital E)

You'll see: **`-- EDGE EDIT --`** in the status bar

**This shows all edges connected to the focused node.**

**Navigate edges:**
```
j - Select NEXT edge (cycles through all connected edges)
k - Select PREVIOUS edge
```

**The selected edge pulses in RED. Other edges are ORANGE.**

**Edge actions:**
```
x or dd - DELETE the selected edge
h - Jump to SOURCE node of edge (and exit edge edit)
l or Enter - Jump to TARGET node of edge (and exit edge edit)
```

**Status bar shows:** `Node: <id> | Edges: 3 | [2/3] <source> → <target>`

**Exit:** Press `Escape` or `Shift+E` again

---

### 7. COMMAND MODE - Advanced Operations

**Enter Command Mode:** Press `:` (colon key)

You'll see: **`:`** in the status bar (ready for command input)

**Available commands:**
```
:w - Save all changes (auto-saves anyway)
:q - Quit/exit (goes back to NORMAL mode)
```

**Search:**
```
/ - Enter search mode
```

Type your search query and press `Enter`. The first matching node will be focused.

**Cancel command:** Press `Escape`

---

## Vim Mode: Common Operations

### Delete Operations

**Delete focused node:**
```
1. Focus the node (h, j, k, l)
2. Press: dd
```

**Delete selected nodes (bulk delete):**
```
1. Enter VISUAL mode: v
2. Select nodes: h, j, k, l
3. Press: d
```

### Yank (Copy) and Paste

**Copy a node:**
```
1. Focus the node
2. Press: yy (yank)
```

**Copy multiple nodes:**
```
1. VISUAL mode: v
2. Select nodes
3. Press: y
```

**Paste:**
```
1. Focus where you want to paste
2. Press: p
```

**Paste with connections:**
```
Press: Shift+P (capital P)
```

This pastes and creates edges connecting to the focused node.

### Undo/Redo

```
u - Undo last change
Ctrl+r - Redo
```

---

## Complete Keyboard Reference

### NORMAL MODE
```
Navigation:
  h, j, k, l - Focus left/down/up/right
  gg - First node
  G - Last node
  Tab - Next node
  Shift+Tab - Previous node
  zz - Center camera

Mode Changes:
  i - INSERT mode (edit text)
  v - VISUAL mode (select multiple)
  m - MOVE mode (reposition)
  e - EDGE mode (create connection)
  E - EDGE EDIT mode (manage edges)
  : - COMMAND mode
  / - Search mode

Operations:
  dd - Delete focused node
  yy - Yank (copy) focused node
  p - Paste
  P - Paste with edges
  u - Undo
  Ctrl+r - Redo
  x - Quick delete
```

### INSERT MODE
```
Editing:
  Type normally
  Ctrl+B - Bold
  Ctrl+I - Italic
  Ctrl+U - Underline
  Ctrl+K - Link
  Arrow keys - Move cursor

Exit:
  Escape - Back to NORMAL
  Ctrl+[ - Back to NORMAL
```

### VISUAL MODE
```
Selection:
  h, j, k, l - Expand selection
  v - Toggle node selection
  d - Delete all selected
  y - Yank all selected
  m - Enter MOVE mode with selection

Exit:
  Escape - Back to NORMAL
  v - Back to NORMAL
```

### MOVE MODE
```
Movement:
  h - Move left 50px
  j - Move down 50px
  k - Move up 50px
  l - Move right 50px

Exit:
  Escape - Back to NORMAL
  m - Back to NORMAL
```

### EDGE MODE
```
Creating:
  h, j, k, l - Navigate to target node
  Enter - Create edge
  Escape or e - Cancel
```

### EDGE EDIT MODE
```
Navigation:
  j - Next edge
  k - Previous edge

Actions:
  x or dd - Delete selected edge
  h - Jump to source node
  l or Enter - Jump to target node

Exit:
  Escape or E - Back to NORMAL
```

---

## Example Workflows

### Workflow 1: Create a Simple Mind Map

**Mouse Mode:**
1. Double-click canvas → Create "Main Idea"
2. Double-click again → Create "Sub-idea 1"
3. Double-click again → Create "Sub-idea 2"
4. Drag edges from Main → Sub-idea 1 and Sub-idea 2
5. Drag nodes to arrange them

**Vim Mode:**
1. `Ctrl+;` to enable Vim
2. `i` → Type "Main Idea" → `Escape`
3. `o` (or create another node) → Type "Sub-idea 1" → `Escape`
4. `gg` to go to first node
5. `e` (edge mode) → `j` to navigate → `Enter` to connect
6. `m` (move mode) → `h`, `j`, `k`, `l` to position

### Workflow 2: Bulk Operations

**Delete multiple nodes:**
```
1. Ctrl+; (enable Vim)
2. v (VISUAL mode)
3. hjkl (select nodes)
4. d (delete all)
```

**Move multiple nodes together:**
```
1. v (VISUAL mode)
2. hjkl (select nodes)
3. m (MOVE mode)
4. hjkl (move all selected nodes)
5. Escape (save positions)
```

**Copy a cluster of nodes:**
```
1. v (VISUAL mode)
2. Select nodes
3. y (yank)
4. Navigate elsewhere
5. p (paste)
```

### Workflow 3: Navigate Large Maps

**Find a specific node:**
```
1. / (search)
2. Type: "project"
3. Enter (jumps to first match)
```

**Jump around quickly:**
```
gg - Go to top
G - Go to bottom
Tab, Tab, Tab - Cycle through
zz - Center camera on current node
```

---

## Tips & Tricks

### General
- **Auto-save:** Everything saves automatically after 1 second of inactivity
- **Backup:** Your data is in 3 `.db` files - just copy them!
- **Performance:** SQLite handles 1000+ nodes easily

### Vim Mode
- **Start in NORMAL:** Always return to NORMAL mode with `Escape`
- **Practice hjkl:** Try navigating without looking at the keys
- **Use Tab:** When `hjkl` navigation is hard, just press `Tab` to cycle
- **Visual + Move:** Select nodes in VISUAL, then press `m` to move them together

### Keyboard Shortcuts
- **Quick delete:** `x` deletes focused node (faster than `dd`)
- **Center view:** Lost your node? Press `zz` to center on focused node
- **Exit any mode:** `Escape` always returns to NORMAL mode

### Editor
- **Rich text:** Combine bold, italic, underline for emphasis
- **Links:** `Ctrl+K` to add clickable links
- **Formatting persists:** Your formatting is saved in the node

---

## Troubleshooting

### Can't type in a node?
**Solution:** Make sure you're in INSERT mode (`i` key). Look for `-- INSERT --` in the status bar.

### Lost focus on a node?
**Solution:** Press `Tab` to cycle through nodes, or click a node with your mouse.

### Vim mode feels confusing?
**Solution:** Press `Ctrl+;` to disable Vim mode and use mouse controls.

### Accidentally deleted something?
**Solution:** Press `u` to undo!

### Services won't start?
**Solution:**
```bash
npm run kill
npm run dev:all
```

### Vim mode not responding?
**Solution:** Make sure the canvas (not the editor) has focus. Click the canvas once.

---

## Next Steps

### Explore
- Create a personal knowledge base
- Map out project ideas
- Take notes in an interconnected way
- Organize research topics

### Customize
- Check `.env` files to customize ports
- Modify `kill-services.sh` for your OS
- Add your own keyboard shortcuts (advanced)

### Share
- Export your `.db` files
- Share the entire Principle folder
- Version control with Git (exclude `node_modules` and `.db` files)

---

## Getting Help

**Check the logs:** Look at the terminal output for error messages

**Common issues:** See the Troubleshooting section in `README.md`

**Reset everything:**
```bash
npm run kill
rm node-service/dev.db edge-service/dev.db media-service/dev.db
npm run dev:all
```

(TypeORM will automatically recreate the databases on startup)

---

**Happy mapping! 🗺️**
