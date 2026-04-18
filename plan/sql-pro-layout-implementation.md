# DB Explorer: SQLPro Studio Layout & Multi-Query Implementation Plan

## Overview

**Current State:** Single-column linear layout — dropdown datasource selector, textarea editor, single result table.

**Target State:** Split-pane IDE layout — left sidebar with tree-view schema explorer, top-right SQL editor pane, bottom-right multi-result pane with tabs/stacked results.

## File Map

| File                                          | Purpose                                   |
| --------------------------------------------- | ----------------------------------------- |
| `src/core/types/db-explorer.ts`               | Type definitions (interfaces)             |
| `src/core/api/endpoints.ts`                   | API endpoint constants                    |
| `src/features/db-explorer/api/index.ts`       | API functions (HTTP calls + data mapping) |
| `src/features/db-explorer/db-store.svelte.ts` | State management (Svelte 5 runes)         |
| `src/features/db-explorer/db-explorer.scss`   | All styles for this feature               |
| `src/routes/db-explorer/+page.svelte`         | Route page (view layer)                   |
| `src/features/db-explorer/components/`        | Extracted UI components (currently empty) |

## Existing API Endpoints (Backend Ready)

These endpoints already exist in `src/core/api/endpoints.ts` — the backend supports schema exploration:

```typescript
DATASOURCES: '/datasources'; // GET — list all datasources
DATASOURCE_TABLES: (id: string) => `/datasources/${id}/tables`; // GET — list tables for a datasource
DATASOURCE_TABLE_COLUMNS: (id: string, table: string) =>
  `/datasources/${id}/tables/${table}/columns`; // GET — list columns for a table
DB_EXPLORERS: '/db-explorers'; // POST — execute SQL query
```

## Architecture Rules (from CLAUDE.md — must follow)

1. **No `<style>` blocks in `.svelte` files** — all styles in SCSS files only
2. **Svelte 5 runes mode** — use `$state`, `$state.raw`, `$derived` (use `let` not `const` for runes in `.svelte`)
3. **State pattern** — factory function returning plain object with getters, instantiate once at route page level
4. **Layer separation** — route pages = view only, components = pure UI (props/events), state modules = business logic, api modules = HTTP only
5. **`import type`** mandatory for type-only imports
6. **No `any`** — use `unknown` + type guards
7. **`interface`** over `type` for object shapes
8. **SCSS** — use `@use` not `@import`, nesting with `&`
9. **No external UI libraries** for layout — use SCSS Flexbox/Grid only

---

## Phase 1: Types & API Layer

**Goal:** Add type definitions and API functions for schema exploration (tables + columns).

### 1.1 — Add Types (`src/core/types/db-explorer.ts`)

Add these interfaces to the existing file. Do NOT modify existing interfaces.

```typescript
// === Schema Exploration Types ===

export interface TableItem {
  name: string;
}

export interface ColumnItem {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
}

// API response shapes (JSON:API envelope)

interface TableApiResource {
  type: string;
  id: string;
  attributes: {
    name: string;
  };
}

export interface TableListResponse {
  data: TableApiResource[];
  meta: {
    timestamp?: string;
  };
  status: {
    code: number;
    message: string;
  };
}

interface ColumnApiResource {
  type: string;
  id: string;
  attributes: {
    name: string;
    data_type: string;
    nullable: boolean;
    primary_key: boolean;
  };
}

export interface ColumnListResponse {
  data: ColumnApiResource[];
  meta: {
    timestamp?: string;
  };
  status: {
    code: number;
    message: string;
  };
}
```

> **Note:** The exact API response shapes may differ from above. After implementing, test with a real API call and adjust the interface field names to match the actual response. The above is a best-guess based on existing patterns in `DatasourceListResponse`.

### 1.2 — Add API Functions (`src/features/db-explorer/api/index.ts`)

Add two new functions to the existing file. Do NOT modify existing functions.

```typescript
export async function listTables(datasourceId: string): Promise<TableItem[]> {
  const response: TableListResponse = await api.get(
    API_V1.DATASOURCE_TABLES(datasourceId)
  );
  return response.data.map((item) => ({
    name: item.attributes.name,
  }));
}

export async function listColumns(
  datasourceId: string,
  tableName: string
): Promise<ColumnItem[]> {
  const response: ColumnListResponse = await api.get(
    API_V1.DATASOURCE_TABLE_COLUMNS(datasourceId, tableName)
  );
  return response.data.map((item) => ({
    name: item.attributes.name,
    dataType: item.attributes.data_type,
    nullable: item.attributes.nullable,
    primaryKey: item.attributes.primary_key,
  }));
}
```

Add the necessary type imports at the top of the file.

### Verification

After this phase, run `pnpm check` to verify types compile correctly. The new functions won't be called yet — they're wired up in Phase 2.

---

## Phase 2: State Management Restructuring (`db-store.svelte.ts`)

**Goal:** Support multi-query execution, schema tree state (tables + columns), and query history.

### 2.1 — Update `DbExplorerState` Interface

Replace the existing interface. Key changes marked with `// NEW`:

```typescript
export interface DbExplorerState {
  // Existing
  readonly datasources: DatasourceItem[];
  readonly selectedDatasourceId: string | null;
  readonly sql: string;
  readonly loadingDatasources: boolean;
  readonly running: boolean;
  readonly error: string | null;

  // CHANGED: single result → array of results
  readonly results: QueryResult[];

  // NEW: Schema tree state
  readonly tables: TableItem[];
  readonly loadingTables: boolean;
  readonly expandedTables: Record<string, ColumnItem[]>;
  readonly loadingColumns: Record<string, boolean>;

  // Existing methods
  selectDatasource: (id: string | null) => void;
  setSql: (value: string) => void;
  fetchDatasources: () => Promise<void>;
  runQuery: () => Promise<void>;

  // CHANGED
  clearResults: () => void;

  // NEW methods
  fetchTables: (datasourceId: string) => Promise<void>;
  toggleTableColumns: (tableName: string) => Promise<void>;
  insertTableName: (tableName: string) => void;
  insertColumnName: (columnName: string) => void;
}
```

### 2.2 — State Variables

```typescript
// Replace single result
let results = $state<QueryResult[]>([]);

// Add schema tree state
let tables = $state.raw<TableItem[]>([]);
let loadingTables = $state(false);
let expandedTables = $state<Record<string, ColumnItem[]>>({});
let loadingColumns = $state<Record<string, boolean>>({});
```

### 2.3 — Multi-Query Execution Logic (`runQuery`)

The key change: split SQL by semicolons, execute each query independently, append results progressively.

```typescript
async runQuery() {
  if (!selectedDatasourceId || !sql.trim()) return;

  // Parse multiple queries separated by semicolons
  const queries = sql
    .split(';')
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  if (queries.length === 0) return;

  running = true;
  error = null;
  results = [];

  try {
    for (const query of queries) {
      const res = await executeQuery({
        cmd: query,
        datasource_id: selectedDatasourceId,
      });
      // Append progressively so UI updates after each query completes
      results = [...results, res];
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Query execution failed';
    error = message;
  } finally {
    running = false;
  }
}
```

### 2.4 — Schema Methods

```typescript
selectDatasource(id: string | null) {
  selectedDatasourceId = id;
  results = [];
  error = null;
  tables = [];
  expandedTables = {};
  // Auto-fetch tables when a datasource is selected
  if (id) {
    void this.fetchTables(id);
  }
},

async fetchTables(datasourceId: string) {
  loadingTables = true;
  try {
    tables = await listTables(datasourceId);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load tables';
    error = message;
  } finally {
    loadingTables = false;
  }
},

async toggleTableColumns(tableName: string) {
  if (!selectedDatasourceId) return;

  // Collapse if already expanded
  if (expandedTables[tableName]) {
    const { [tableName]: _, ...rest } = expandedTables;
    expandedTables = rest;
    return;
  }

  // Fetch and expand
  loadingColumns = { ...loadingColumns, [tableName]: true };
  try {
    const cols = await listColumns(selectedDatasourceId, tableName);
    expandedTables = { ...expandedTables, [tableName]: cols };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load columns';
    error = message;
  } finally {
    const { [tableName]: _, ...rest } = loadingColumns;
    loadingColumns = rest;
  }
},

insertTableName(tableName: string) {
  // Insert table name at cursor position (or append)
  sql = sql ? `${sql} ${tableName}` : tableName;
},

insertColumnName(columnName: string) {
  sql = sql ? `${sql} ${columnName}` : columnName;
},
```

### 2.5 — Update Getters

Add getters for all new state variables:

```typescript
get results() { return results; },
get tables() { return tables; },
get loadingTables() { return loadingTables; },
get expandedTables() { return expandedTables; },
get loadingColumns() { return loadingColumns; },
```

Remove the old `get result()` getter and `clearResult()` method. Replace with `clearResults()`:

```typescript
clearResults() {
  results = [];
  error = null;
},
```

### Verification

Run `pnpm check`. The route page will have type errors because it still references `state.result` — that's expected, it gets fixed in Phase 4.

---

## Phase 3: Layout & Styling (`db-explorer.scss`)

**Goal:** Complete overhaul — split-pane IDE layout with sidebar, editor pane, and results pane.

### 3.1 — Root Layout Structure

Replace the existing `.db-explorer` styles. The layout is a horizontal flex container:

```
┌──────────────────────────────────────────────────┐
│ .db-explorer-layout                              │
│ ┌────────────┬───────────────────────────────────┐│
│ │            │ .db-explorer__editor-pane         ││
│ │ .db-explorer│ (SQL editor + toolbar)           ││
│ │ __sidebar  │                                   ││
│ │            ├───────────────────────────────────┤│
│ │ (tree view)│ .db-explorer__results-pane        ││
│ │            │ (multi-result tables)             ││
│ │            │                                   ││
│ └────────────┴───────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### 3.2 — Key CSS Classes

```scss
// Root: fills viewport minus navbar height
.db-explorer-layout {
  display: flex;
  height: calc(100vh - 60px);
  overflow: hidden;
}

// Left sidebar: fixed width, scrollable, tree-view
.db-explorer__sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 260px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  overflow-y: auto;
}

.db-explorer__sidebar-header {
  // Datasource selector area
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

// Tree view items
.db-explorer__tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-sidebar-hover);
    color: var(--text-primary);
  }
}

.db-explorer__tree-children {
  // Indented child items (columns under a table)
  padding-left: 20px;
}

.db-explorer__tree-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

// Main content: vertical split (editor on top, results on bottom)
.db-explorer__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // prevent flex overflow
}

// Editor pane: top portion
.db-explorer__editor-pane {
  display: flex;
  flex-direction: column;
  height: 40%;
  min-height: 200px;
  border-bottom: 3px solid var(--border-color); // visual split-pane divider
}

// Results pane: bottom portion, scrollable
.db-explorer__results-pane {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
```

### 3.3 — Multiple Result Tables

```scss
// Container for each individual result set
.db-explorer__result-grid {
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

// Individual table wrapper within a result set
.db-explorer__result-grid .db-explorer__table-wrapper {
  max-height: 300px;
  overflow: auto;
}
```

### 3.4 — Column Type Badge

```scss
.db-explorer__column-type {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  margin-left: auto;
}

.db-explorer__column-pk {
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
}
```

### 3.5 — Responsive

```scss
@media (max-width: 768px) {
  .db-explorer-layout {
    flex-direction: column;
    height: auto;
  }

  .db-explorer__sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .db-explorer__editor-pane {
    height: auto;
    min-height: 150px;
  }
}
```

### 3.6 — Preserve Existing Classes

Keep all existing element-level styles that are still used (`.db-explorer__table`, `.db-explorer__null`, `.db-explorer__error`, `.db-explorer__loading`, `.db-explorer__empty`, `.db-explorer__truncated`, etc.). Only replace the top-level layout containers (`.db-explorer`, `.db-explorer__toolbar`).

### Verification

Visual check only — styles will be applied in Phase 4.

---

## Phase 4: UI Component Refactoring (`+page.svelte`)

**Goal:** Rebuild the route page HTML to use the new split-pane layout and bind to updated state.

### 4.1 — Update Script Block

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  import { createDbExplorerState } from '$features/db-explorer/db-store.svelte';

  import '$features/db-explorer/db-explorer.scss';

  const state = createDbExplorerState();

  let selectedDatasourceId = $derived(state.selectedDatasourceId);
  let sql = $derived(state.sql);
  let results = $derived(state.results); // CHANGED: array
  let datasources = $derived(state.datasources);
  let running = $derived(state.running);
  let error = $derived(state.error);
  let tables = $derived(state.tables); // NEW
  let loadingTables = $derived(state.loadingTables); // NEW
  let expandedTables = $derived(state.expandedTables); // NEW
  let loadingColumns = $derived(state.loadingColumns); // NEW

  onMount(() => {
    void state.fetchDatasources();
  });

  function handleRun() {
    void state.runQuery();
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }

  function formatCell(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
</script>
```

### 4.2 — HTML Structure

The entire page should follow this structure:

```svelte
<div class="db-explorer-layout">
  <!-- LEFT SIDEBAR -->
  <aside class="db-explorer__sidebar">
    <div class="db-explorer__sidebar-header">
      <!-- Datasource <select> dropdown (reuse existing markup, move here) -->
    </div>

    <!-- Schema Tree View -->
    {#if selectedDatasourceId}
      {#if loadingTables}
        <div class="db-explorer__loading">...</div>
      {:else}
        {#each tables as table (table.name)}
          <button
            class="db-explorer__tree-item"
            onclick={() => state.toggleTableColumns(table.name)}
          >
            <!-- Table icon SVG -->
            <span>{table.name}</span>
            <!-- Chevron icon (rotated if expanded) -->
          </button>

          {#if expandedTables[table.name]}
            <div class="db-explorer__tree-children">
              {#each expandedTables[table.name] as col (col.name)}
                <button
                  class="db-explorer__tree-item"
                  onclick={() => state.insertColumnName(col.name)}
                >
                  <!-- Column icon SVG -->
                  <span>{col.name}</span>
                  {#if col.primaryKey}
                    <span class="db-explorer__column-pk">PK</span>
                  {/if}
                  <span class="db-explorer__column-type">{col.dataType}</span>
                </button>
              {/each}
            </div>
          {:else if loadingColumns[table.name]}
            <div class="db-explorer__tree-children">
              <div class="db-explorer__loading" style="padding: 8px;">
                <span class="spin" style="width: 12px; height: 12px;"></span>
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    {:else}
      <div class="db-explorer__empty" style="padding: 24px;">
        <span style="font-size: 12px;"
          >Select a datasource to browse schema</span
        >
      </div>
    {/if}
  </aside>

  <!-- MAIN CONTENT -->
  <main class="db-explorer__main">
    <!-- EDITOR PANE (top) -->
    <div class="db-explorer__editor-pane">
      <div class="db-explorer__editor">
        <div class="db-explorer__editor-header">
          <!-- Show active DB name + host:port badge -->
          <!-- Clear + Run buttons -->
        </div>
        <div class="db-explorer__sql-wrapper">
          <textarea ...></textarea>
        </div>
      </div>
      {#if error}
        <div class="db-explorer__error">...</div>
      {/if}
    </div>

    <!-- RESULTS PANE (bottom) -->
    <div class="db-explorer__results-pane">
      {#if running}
        <div class="db-explorer__loading">...</div>
      {:else if results.length > 0}
        {#each results as result, index (index)}
          <div class="db-explorer__result-grid">
            <div class="db-explorer__results-header">
              <span class="db-explorer__results-title">
                Result {index + 1}
              </span>
              <div class="db-explorer__results-meta">
                <span class="db-explorer__results-meta-item">
                  {result.rowCount} rows
                </span>
                <span class="db-explorer__results-meta-item">
                  {result.columns.length} columns
                </span>
                <!-- truncated badge if applicable -->
              </div>
            </div>

            {#if result.rows.length === 0}
              <div class="db-explorer__empty">Query returned no results.</div>
            {:else}
              <div class="db-explorer__table-wrapper">
                <table class="db-explorer__table">
                  <!-- Same thead/tbody as current, using result.columns and result.rows -->
                </table>
              </div>
            {/if}

            {#if result.truncated}
              <div class="db-explorer__truncated">...</div>
            {/if}
          </div>
        {/each}
      {:else if !error}
        <div class="db-explorer__empty">
          <!-- "No results yet" empty state -->
        </div>
      {/if}
    </div>
  </main>
</div>
```

### 4.3 — Key Behavioral Changes

1. **Run button label:** Change from `Run (Ctrl+Enter)` to `Run (⌘Enter)` — detect OS if needed, or use `⌘/Ctrl+Enter`
2. **Double-click table name** in sidebar: Insert `SELECT * FROM {tableName} LIMIT 100;` into editor
3. **Click column name** in sidebar: Insert column name at current cursor position
4. **Clear button:** Call `state.clearResults()` instead of just clearing SQL

### Verification

Run `pnpm check` then `pnpm lint`. Start dev server with `pnpm dev` and verify:

- Sidebar shows datasource dropdown and loads tables on selection
- Clicking a table expands to show columns with types
- Multi-query (e.g., `SELECT 1; SELECT 2;`) shows two result tables
- Layout fills viewport correctly
- Responsive behavior on narrow screens

---

## Phase 5: Polish & UX Enhancements

**Goal:** Small quality-of-life improvements after the core layout is working.

### 5.1 — Active Connection Indicator

Show which datasource is currently connected in the sidebar with a highlighted/active style:

```scss
.db-explorer__tree-item--active {
  background: var(--accent-bg);
  color: var(--accent);
  font-weight: 600;
}
```

### 5.2 — Table Count Badge

Show the number of tables next to "Tables" label in the sidebar header.

### 5.3 — Result Tab Bar (Optional Enhancement)

Instead of stacking all results vertically, add a tab bar at the top of the results pane:

- Each tab shows `Result 1`, `Result 2`, etc.
- Clicking a tab scrolls to / shows that result
- This is optional — vertical stacking is acceptable as the initial implementation

### 5.4 — Keyboard Shortcuts

- `⌘+Enter` / `Ctrl+Enter` — Run query (already exists)
- `⌘+E` — Run query (alternative shortcut, as mentioned in plan)
- `Escape` — Clear error message

### 5.5 — Context Menu on Table Name

Right-click (or long-press) on a table name in sidebar shows options:

- `SELECT * FROM {table} LIMIT 100`
- `DESCRIBE {table}` / `SHOW COLUMNS FROM {table}`
- Copy table name

> This phase is lower priority. The core layout from Phases 1–4 should work first.

---

## Implementation Order & Dependencies

```
Phase 1 (Types & API)
  ↓
Phase 2 (State Management)  — depends on Phase 1 types/functions
  ↓
Phase 3 (SCSS Layout)       — independent of Phase 2, but easier to verify together
  ↓
Phase 4 (UI Refactoring)    — depends on Phase 2 state + Phase 3 styles
  ↓
Phase 5 (Polish)            — depends on Phase 4
```

**Recommended approach:** Implement Phases 1→2→3→4 sequentially. Phase 5 is optional.

---

## Prompting Guide for GLM 5 Turbo

When passing this plan to GLM 5 turbo, include the following files as context:

### Required Context Files

1. `CLAUDE.md` — Architecture rules, ESLint rules, SCSS rules (the agent MUST follow these)
2. `src/core/types/db-explorer.ts` — Current type definitions
3. `src/core/api/endpoints.ts` — Available API endpoints
4. `src/features/db-explorer/api/index.ts` — Current API functions
5. `src/features/db-explorer/db-store.svelte.ts` — Current state store
6. `src/features/db-explorer/db-explorer.scss` — Current styles
7. `src/routes/db-explorer/+page.svelte` — Current page component

### Prompt Template

```
Please implement [Phase N] of the SQLPro Layout Implementation Plan.

Context:
- This is a SvelteKit 5 app using Svelte 5 runes mode ($state, $derived)
- Follow ALL rules in CLAUDE.md exactly — especially: no <style> blocks in .svelte files,
  use `interface` not `type`, use `import type` for type-only imports, no `any`
- The backend API returns JSON:API envelopes — see existing patterns in api/index.ts
- All styles go in db-explorer.scss (no inline styles except minor layout adjustments)

Here are the current files:
[paste files]

Here is the plan:
[paste the specific phase section]

Rules:
1. Do NOT use external UI libraries — use SCSS Flexbox/Grid only
2. Preserve all existing functionality — do not break current features
3. Follow Svelte 5 runes patterns exactly as shown in the existing code
4. Run `pnpm check` and `pnpm lint` after changes — fix any errors
5. Provide the complete updated code for each modified file
```

### Per-Phase Prompts

- **Phase 1:** "Implement Phase 1. Add the new interfaces to `db-explorer.ts` and new API functions to `api/index.ts`. Do NOT modify any existing interfaces or functions."
- **Phase 2:** "Implement Phase 2. Restructure `db-store.svelte.ts` to support multi-query results and schema tree state. Import the new API functions from Phase 1."
- **Phase 3:** "Implement Phase 3. Rewrite `db-explorer.scss` for the split-pane layout. Keep all existing element-level styles (table, error, loading, etc.) — only replace the top-level layout structure."
- **Phase 4:** "Implement Phase 4. Rebuild `+page.svelte` to use the new layout and bind to the updated state from Phase 2. Refer to Phase 3 CSS class names for the HTML structure."
