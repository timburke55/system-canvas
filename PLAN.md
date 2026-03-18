# System Canvas — MVP Plan

## Context

Existing systems thinking tools (Insightmaker, Vensim, Stella) frustrate users with cluttered UIs, hidden features, and steep learning curves. Loopy nails simplicity but only supports causal loops. There's a gap for a **modern, web-based tool** that's intuitive for newcomers yet powerful enough for practitioners — starting with Causal Loop Diagrams (CLDs) and basic qualitative simulation.

## MVP Scope

### In scope
- **Causal Loop Diagrams**: variables (nodes), causal links (edges) with +/- polarity, reinforcing/balancing loop labels, delay markers
- **Basic qualitative simulation**: Loopy-style "press play and watch variables grow/shrink" — directional trends, not precise numbers
- **Google sign-in** via Auth.js v5 (no third-party data access)
- **Save/load diagrams** per user
- **Share via read-only link** (no auth required to view)
- **Clean, modern UI** with progressive disclosure — toolbar, contextual menus, helpful tooltips
- **Railway deployment** with PostgreSQL

### Out of scope (v2+)
- Stock-and-flow diagrams (architecture supports adding later)
- Quantitative simulation / equation editor
- Real-time collaboration
- Export to Vensim/XMILE formats
- Templates / archetypes library
- Mobile-optimized layout

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15** (App Router) | SSR, API routes, Railway template support, Auth.js integration |
| Canvas | **React Flow v12** (`@xyflow/react`) | Built-in pan/zoom, custom nodes/edges, handles, dark mode, active community |
| Auth | **Auth.js v5** (Google provider) | First-class Next.js support, simple Google OAuth, session management |
| Database | **PostgreSQL** (Railway-provisioned) | Reliable, Railway has one-click provisioning |
| ORM | **Prisma** | Type-safe queries, migrations, Railway integration docs |
| State | **Zustand** | React Flow recommends it; lightweight, works well with React Flow's store |
| Styling | **Tailwind CSS 4 + shadcn/ui** | Rapid UI development, consistent design system, React Flow components built on shadcn |
| Deployment | **Railway** | Git-push deploy, managed Postgres, env var management |

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  image         String?
  accounts      Account[]
  diagrams      Diagram[]
  createdAt     DateTime  @default(now())
}

model Account {
  // Auth.js managed — Google OAuth tokens
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Diagram {
  id          String   @id @default(cuid())
  title       String   @default("Untitled Diagram")
  data        Json     // { nodes: [...], edges: [...], viewport: {...} }
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  shareId     String?  @unique @default(cuid()) // public share slug
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

The `data` JSON column stores the full React Flow state (nodes, edges, viewport). This avoids complex relational modeling of diagram elements and makes save/load simple — serialize the canvas state as JSON.

## Project Structure

```
system-canvas/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, providers
│   │   ├── page.tsx                # Landing / dashboard
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx            # User's diagrams list
│   │   ├── diagram/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Diagram editor (authed)
│   │   │   └── new/
│   │   │       └── page.tsx        # Create new diagram
│   │   └── share/
│   │       └── [shareId]/
│   │           └── page.tsx        # Read-only shared view
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── DiagramCanvas.tsx   # Main React Flow wrapper
│   │   │   ├── nodes/
│   │   │   │   └── VariableNode.tsx # CLD variable node
│   │   │   ├── edges/
│   │   │   │   └── CausalEdge.tsx  # Edge with +/- label & arrowhead
│   │   │   └── panels/
│   │   │       ├── Toolbar.tsx     # Add variable, simulation controls
│   │   │       └── PropertiesPanel.tsx # Selected element properties
│   │   ├── simulation/
│   │   │   └── SimulationEngine.ts # Qualitative simulation logic
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts                 # Auth.js config
│   │   ├── db.ts                   # Prisma client
│   │   └── store.ts                # Zustand store for diagram state
│   └── types/
│       └── diagram.ts              # TypeScript types for CLD elements
├── public/
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.example
```

## Architecture: How the Canvas Works

### Custom React Flow Nodes — `VariableNode`
- Rounded rectangle with editable text label
- Visual indicator showing current simulation state (growing/shrinking/stable)
- Connection handles on all four sides
- Double-click to rename

### Custom React Flow Edges — `CausalEdge`
- Curved arrow (bezier) with arrowhead
- Polarity label (+/-) rendered as a badge on the edge midpoint
- Optional delay indicator (‖ hash marks)
- Click edge to select → properties panel shows polarity toggle, delay toggle
- Color-coded: blue for positive, red for negative (common convention)

### Simulation Engine (Qualitative)
The simulation is intentionally simple — like Loopy:
- Each variable has a qualitative "level" (a normalized float 0–1, starting at 0.5)
- Each link propagates influence: positive links push the target in the same direction as the source's change; negative links push opposite
- On "Play", run timesteps: compute delta for each variable based on incoming links, apply with damping
- Animate node size/color to show growing (green/larger) vs shrinking (red/smaller)
- No equations, no precise values — just directional behavior
- User can "nudge" a variable up/down during simulation to explore

### State Management (Zustand)
- Diagram state (nodes, edges) lives in Zustand store
- React Flow's `onNodesChange` / `onEdgesChange` update the store
- Auto-save: debounced PUT to `/api/diagrams/[id]` on every change
- Simulation state is transient (not persisted)

## Implementation Phases

### Phase 1: Project Scaffolding
- Initialize Next.js 15 with App Router, TypeScript, Tailwind, ESLint
- Set up Prisma with PostgreSQL schema
- Configure Auth.js v5 with Google provider
- Create basic layout (header with sign-in/out, minimal landing page)
- Set up `.env.example` with required vars
- **Files**: `package.json`, `prisma/schema.prisma`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/auth/[...nextauth]/route.ts`

### Phase 2: Diagram CRUD + Dashboard
- API routes: create, read, update, delete diagrams
- Dashboard page: list user's diagrams, create new, delete
- Auto-save on diagram changes (debounced)
- **Files**: `src/app/dashboard/page.tsx`, `src/app/api/diagrams/` routes, `src/lib/store.ts`

### Phase 3: Canvas Editor — Core CLD
- React Flow canvas with custom `VariableNode` and `CausalEdge`
- Toolbar: add variable, delete selected, undo/redo
- Double-click canvas to add variable, drag to connect
- Edge creation with default positive polarity
- Properties panel: rename variable, toggle edge polarity (+/-), toggle delay
- Diagram title editing
- **Files**: `src/components/canvas/*`, `src/app/diagram/[id]/page.tsx`, `src/types/diagram.ts`

### Phase 4: Qualitative Simulation
- Simulation engine: propagate qualitative changes through causal links
- Play/pause/reset controls in toolbar
- Visual feedback on nodes (color/size animation showing growth/decline)
- Click-to-nudge: click a variable during simulation to increase/decrease it
- Loop detection and R/B labeling (auto-detect reinforcing vs balancing)
- **Files**: `src/components/simulation/SimulationEngine.ts`, toolbar updates

### Phase 5: Sharing + Polish
- Generate shareable read-only link (toggle `isPublic` on diagram)
- Share view page: renders diagram without edit controls
- Landing page with value proposition and "Sign in to start"
- Keyboard shortcuts (Delete, Ctrl+Z, Ctrl+S)
- Responsive layout polish
- **Files**: `src/app/share/[shareId]/page.tsx`, landing page updates

### Phase 6: Deploy to Railway
- Add `Dockerfile` or use Railway's Nixpacks auto-detection
- Provision PostgreSQL on Railway
- Set environment variables (Google OAuth, DATABASE_URL, NEXTAUTH_SECRET)
- Run Prisma migrations on deploy
- Test end-to-end in production

## UX Principles (Key Differentiator)

1. **Double-click to create** — no modal dialogs, no menus to navigate
2. **Drag to connect** — grab a handle, drag to target, done
3. **Contextual properties** — select something to see its options, nothing selected = canvas options
4. **Tooltips on everything** — brief explanation of what each tool/option does
5. **Visual polarity** — blue/red edges with +/- badges, not just tiny text
6. **Immediate simulation feedback** — press play, poke variables, see results instantly
7. **Auto-save** — never lose work
8. **Clean whitespace** — resist the urge to fill the screen with panels

## Verification Plan

1. **Auth flow**: Sign in with Google, verify session persists across page loads
2. **CRUD**: Create diagram, rename it, verify it appears on dashboard, delete it
3. **Canvas editing**: Add 3+ variables, connect them with edges, change polarity, verify undo/redo
4. **Simulation**: Create a reinforcing loop (A→+B→+A), press play, nudge A up, verify both grow. Create balancing loop, verify equilibrium behavior
5. **Sharing**: Toggle diagram to public, copy share link, open in incognito, verify read-only view renders correctly
6. **Auto-save**: Make changes, refresh page, verify changes persisted
7. **Railway deploy**: Push to Railway, verify app loads, auth works, diagrams persist across sessions
