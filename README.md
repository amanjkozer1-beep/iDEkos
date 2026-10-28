# K.O.S (Kozer Operating System) — Desktop Application Shell

A pixel-faithful desktop workspace shell modeled after modern dark macOS AI agent workspaces, re-engineered and re-branded as **"K.O.S" (Kozer Operating System)** with integrated Kurdish visual identity.

---

## 🎨 Design Tokens

| Token | Value | Description |
|---|---|---|
| `--bg-app-outer` | `#000000` | Canvas behind the desktop window |
| `--bg-main` | `#0B0E0C` | Main workspace background |
| `--bg-sidebar` | `#141A16` | Deep green-charcoal translucent sidebar |
| `--bg-pill-active` | `#060807` | Near-black active navigation capsule |
| `--bg-pill-hover` | `rgba(255,255,255,0.07)` | Hover background on navigation items |
| `--bg-popover` | `rgba(48,55,50,0.78)` + blur | Glassmorphic cards with `backdrop-filter: blur(24px)` |
| `--bg-composer` | `#000000` | Deep black composer card |
| `--bg-segmented` | `#050605` | Segmented control capsule base |
| `--bg-segmented-active` | `#222A25` | Active chip background for `[ Task ]` |
| `--text-primary` | `#F5F4EF` | Warm white typography |
| `--text-muted` | `#8F968F` | Secondary/muted text |
| `--flag-red` | `#ED2024` | Kurdish tri-color top red band |
| `--flag-white` | `#FFFFFF` | Kurdish tri-color center white band |
| `--flag-green` | `#278E43` | Kurdish tri-color bottom green band |
| `--sun-gold` | `#FED100` | 21-ray golden sun & focus ring accent |
| `--border-window` | `1px solid rgba(255,255,255,0.08)` | Translucent glass border |

### Radii & Shadows
- **Window**: `22px`
- **Composer**: `40px`
- **Nav pill**: `999px`
- **Popover**: `28px`
- **Top buttons**: `999px`
- **Window shadow**: `0 30px 80px rgba(0,0,0,0.7)`
- **Popover shadow**: `0 12px 40px rgba(0,0,0,0.65)`

---

## ☀️ Kurdish Visual Identity System

1. **21-Ray Golden Sun Symbol (`SunMark`)**:
   - Exactly 21 triangular rays evenly spaced at `360 / 21 ≈ 17.142857°` intervals with a central disc and concentric thin ring.
   - Variants: `wordmark` (where "O" is the sun emblem), `icon` (32px standalone), `monochrome`, `watermark` (outline), `small` (subtle 12% opacity mark).
2. **Flag Stripe (`FlagStripe`)**:
   - Thin 4px horizontal tri-color band (red `#ED2024`, white `#FFFFFF`, green `#278E43`) pinned at the top edge of the sidebar and a matching hairline under the title bar.
3. **Rotating Sun Watermark (`Watermark`)**:
   - 900px wide, 1.5px stroke outline, 4.5% opacity, rotating on a 120s linear loop behind the composer (respects `prefers-reduced-motion`).
4. **Main Area Radial Glow**:
   - `radial-gradient(ellipse at 60% 85%, rgba(39,142,67,0.28) 0%, rgba(237,32,36,0.10) 42%, transparent 75%)` plus subtle noise overlay to prevent banding.

---

## 🧩 Component Directory & Props

### 1. `Sidebar`
- **Props**: `width: number`, `onResizeStart?: (e: React.MouseEvent) => void`
- **Description**: Houses macOS traffic lights, search and sidebar collapse triggers, K.O.S brand row, primary nav pills, More popover anchor, collapsible "Projects >" section with filter search, and pinned account footer.

### 2. `NavItem`
- **Props**: `id: string`, `label: string`, `icon: React.ReactNode`, `isActive?: boolean`, `isCollapsed?: boolean`, `onClick: () => void`, `badge?: string`
- **Description**: Nav pill with hover states, active near-black pill background, and red-to-gold gradient accent border.

### 3. `MorePopover`
- **Props**: `isOpen: boolean`, `onClose: () => void`, `anchorRef: React.RefObject<HTMLButtonElement | null>`
- **Description**: Floating glassmorphic card (radius 28px) with left-pointing tail pointing directly to the "More" item, featuring "Customize" (gear/hexagon) and "Videos" (screen/film) routes.

### 4. `Composer`
- **Props**: `onOpenFolderPicker: () => void`, `onOpenAttachMenu: () => void`
- **Description**: Centered 40px rounded black card with auto-grow textarea, placeholder "Describe a task" (or Chat prompt), and bottom toolbar (`+` attach menu, "Files & folders" picker, "Share screen" toggle, and voice input microphone).

### 5. `ModeSwitch`
- **Props**: None (connects to Zustand store)
- **Description**: Segmented capsule `[ Chat | Task ]` toggling between Q&A chat and autonomous agent task execution.

### 6. `TopBar`
- **Props**: None
- **Description**: Top-right floating controls featuring the circular compress button and the translucent "K.O.S Studio" launch pill.

### 7. `AccountFooter`
- **Props**: `isCollapsed?: boolean`
- **Description**: Pinned bottom profile trigger showing "Ab N. Li", "Pro" plan label with subtle sun watermark, and popover for preferences.

### 8. `TaskExecutionView`
- **Props**: `task: TaskItem`, `onBack: () => void`
- **Description**: Autonomous agent task runner showing step stream, terminal commands, git diffs, artifact previews, and human-in-the-loop Approve/Deny buttons.

### 9. `KosStudioModal`
- **Props**: None
- **Description**: Integrated agent-first coding studio environment featuring file tree explorer, Monaco-style editor buffer with syntax highlighting, and interactive terminal drawer.

---

## ⌨️ Keyboard Shortcuts
- `Cmd + B` / `Ctrl + B`: Toggle Sidebar (collapsed / expanded)
- `Cmd + K` / `Ctrl + K`: Open Command Palette / Quick Search
- `Cmd + N` / `Ctrl + N`: New Chat / Reset to Composer
- `Esc`: Close any active popover, modal, or drawer

---

## 🏛️ Hexagonal Architecture: Ports & Adapters

K.O.S is structured strictly around clean hexagonal architecture (Ports and Adapters). Core domain logic depends only on abstract interfaces in `src/server/ports/`, with swappable adapters in `src/server/adapters/`.

| Port (Interface) | Adapter (Implementation) | Description |
|---|---|---|
| `WorkspaceProvider` | `LocalWorkspaceAdapter` | Real file tree traversal, normalized path resolution, range clipping, safe search, and traversal attack rejection. |
| `ShellProvider` | `HardenedShellAdapter` | Safe child process execution without shell, argv parsing, token allowlist, metacharacter rejection, 60s timeout, and 1MB output cap. |
| `StorageProvider` | `SqliteStorageAdapter` | Zero-dependency persistent SQLite storage (`node:sqlite`) for tasks, steps, library templates, cron schedules, and daily briefs. |
| `ModelProvider` | `SdkModelAdapter` | Autonomous ReAct function-calling agent loop, surgical search-and-replace diffs, and self-repair rounds. |

---

## 🔒 Security & Sandbox Isolation Boundaries

1. **Child Process Environment Scrubbing**:
   - `MODEL_API_KEY`, tokens, and parent secrets are scrubbed before child process spawning.
   - Child processes run with minimal isolated environment (`USER=kos`, `LANG=en_US.UTF-8`).
2. **Path Traversal Shield**:
   - Every file read, write, and command argument is validated against the workspace root.
   - Attempts to access `/etc`, `/var`, `/usr`, or traverse via `../../` are immediately rejected with exit code 126.
3. **Execution Autonomy Tiers**:
   - **Advisory (Read Only)**: Commands and patches are blocked.
   - **Human-in-the-Loop**: Dangerous commands and interpreters require explicit developer approval in the UI.
   - **Autonomous**: Safe operations run automatically with audit logs persisted to SQLite.

---

## ⚠️ Sandbox Environment Notes & Limitations

- **Native PTY Driver**: In this minimal container runtime without native C++ compilation toolchains (`node-gyp`), interactive terminal emulation is provided via hardened `child_process.spawn` with buffered output and timeout caps. In native desktop mode (Electron/Tauri), native `node-pty` can be compiled for full VT100/xterm pseudo-terminal escape sequence support.
- **Filesystem Scope**: When running in this web preview container, the workspace root is the applet project root. When bundled as a native Electron or Tauri desktop application, the Native Workspace Adapter allows users to open and edit any local folder on their disk.

---

## 🚀 Run locally (Desktop Shell: Electron or Tauri)

To run K.O.S as a native desktop application with full access to any folder on your machine:

### Option A: Standard Full-Stack Node.js Mode
1. Clone or copy this repository to your machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your model API key in your `.env` file (server-side only, never client-exposed):
   ```bash
   MODEL_API_KEY="your-api-key-here"
   ```
4. Start the development server (runs Express + Vite on port 3000):
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

### Option B: Native Desktop Shell via Electron
1. Install Electron as a dev dependency:
   ```bash
   npm install -D electron
   ```
2. Add `electron.js`:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   app.whenReady().then(() => {
     const win = new BrowserWindow({
       width: 1440,
       height: 900,
       titleBarStyle: 'hiddenInset',
       backgroundColor: '#000000',
       webPreferences: { nodeIntegration: false, contextIsolation: true }
     });
     win.loadURL('http://localhost:3000');
   });
   ```
3. Launch with `npx electron .`

### Option C: High-Performance Lightweight Shell via Tauri
1. Install Tauri CLI: `npm install -D @tauri-apps/cli`
2. Initialize: `npx tauri init`
3. Point `tauri.conf.json` devUrl to `http://localhost:3000`
4. Run: `npx tauri dev`

