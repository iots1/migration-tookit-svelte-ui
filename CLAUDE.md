# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build static site → build/
pnpm preview          # Preview production build
pnpm check            # svelte-check type checking (run after editing .svelte files)
pnpm check:watch      # Type checking in watch mode
pnpm lint             # Prettier check + ESLint + Stylelint (must pass before merging)
pnpm format           # Auto-format with Prettier + Stylelint --fix
```

ESLint, Prettier, and Stylelint run together under `pnpm lint`. Always run `pnpm lint` after making changes. There is no test suite.

## Architecture

**SvelteKit 5 SPA** — `adapter-node` for server-side rendering. Svelte 5 **runes mode** is mandatory (`compilerOptions.runes: true`).

### Path aliases (defined in `svelte.config.js`)

| Alias       | Resolves to                                                       |
| ----------- | ----------------------------------------------------------------- |
| `$core`     | `src/core/`                                                       |
| `$features` | `src/features/`                                                   |
| `$lib`      | `src/lib/` (SvelteKit default)                                    |
| `$src`      | `src/`                                                            |
| `$routes`   | `src/routes/`                                                     |
| `$app/*`    | SvelteKit runtime (`$app/navigation`, `$app/paths`, `$app/state`) |

### Layer separation — strictly enforced

```
src/routes/          ← View only: rendering + navigation (goto, href). NO API CALLS, NO business logic.
src/features/*/
  components/        ← Pure UI components. Receive props, emit events. No state imports, no API calls.
  state/             ← Business logic, state management, API orchestration (.svelte.ts)
  api/               ← HTTP calls + data mapping to/from API shapes. No state mutations.
src/core/
  api/               ← Generic ApiClient, endpoint constants, auth state (Svelte 5 runes)
  state/             ← Shared state factories (e.g., createPaginatedListState<T>)
  types/             ← Type definitions only. common.ts for shared types; per-domain files for specifics.
  utils/             ← Pure utility functions
src/lib/
  components/        ← Shared reusable components (Pagination, SearchBar, ErrorBanner, etc.)
  components/layout/ ← Layout components (Sidebar, Navbar, Footer)
  toast.svelte.ts    ← Global toast notification (singleton)
  confirm-dialog.svelte.ts ← Global confirm dialog (singleton)
```

**Critical rule:** Route pages must NEVER import from `src/features/*/api/` directly. All data loading and API orchestration must go through state modules. This is the single most important architectural boundary.

### State pattern (Svelte 5 runes)

State is created via factory functions returning a plain object with getters:

```typescript
// src/features/*/state/*.svelte.ts
export function createEditorState(): EditorState {
  let nodes = $state.raw<BaseNode[]>([]);
  // ...
  return {
    get nodes() {
      return nodes;
    },
    // methods...
  };
}
```

Instantiate once at the route page level and pass state/handlers down as props.

#### Shared state factories

Common state patterns are extracted into reusable generic factories in `src/core/state/`:

- **`createPaginatedListState<T>(fetchFn, deleteFn, label)`** — provides loading, error, pagination, search, delete for any paginated list. Feature-specific wrappers add domain aliases (e.g., `get pipelines()` → `state.items`).

```typescript
// Usage in feature state:
import { createPaginatedListState } from '$core/state/paginated-list-state.svelte';

export function createPipelinesListState() {
  const state = createPaginatedListState<PipelineListItem>(
    listPipelines,
    deletePipeline,
    'Pipelines'
  );
  return {
    ...state,
    get pipelines() { return state.items; },
    fetchPipelines: state.fetchItems,
  };
}
```

**When adding a new paginated list page:** Always use `createPaginatedListState<T>` instead of writing state from scratch.

#### State methods that encapsulate API calls

State modules must include all API orchestration. Route pages should call state methods, not API functions:

```typescript
// ✅ Correct — state module owns the orchestration
// editor-state.svelte.ts
async function initialize(editUuid: string): Promise<string | null> { ... }
async function updateNodeFromConfig(configId: string): Promise<void> { ... }
async function saveAndCreateJob(name: string, description: string): Promise<string | null> { ... }

// ✅ Correct — route page calls state only
// pipeline-editor/[uuid]/+page.svelte
onMount(async () => { await editor.initialize(editUuid ?? 'new'); });
async function handleConfigSaved(configId: string) {
  await editor.updateNodeFromConfig(configId);
  editingConfigId = null;
}
```

### Shared reusable components

The following components in `src/lib/components/` are shared across multiple route pages. **Always reuse them** instead of duplicating markup:

| Component      | Props                                                                           | Used by                     |
| -------------- | ------------------------------------------------------------------------------- | --------------------------- |
| `Pagination`   | `currentPage`, `totalPages`, `totalRecords`, `onPageChange`                    | All list pages              |
| `SearchBar`    | `value`, `placeholder?`, `onInput`, `onSearch`, `onClear`                      | All list pages              |
| `ErrorBanner`  | `message`, `onDismiss`                                                          | All pages with error state  |
| `BadgeList`    | `items`, `limit?`, `color?`                                                    | Config editor, field mapping |
| `Toast`        | (global singleton, use `showToast()` from `$lib/toast.svelte`)                  | Everywhere                  |
| `ConfirmDialog`| (global singleton, use `confirmDialog()` from `$lib/confirm-dialog.svelte`)      | Everywhere                  |

**Never copy-paste pagination, search bar, or error banner markup.** Import and use the shared components.

### API data flow

The backend returns JSON:API-style envelopes. Mapping from API shapes to UI types happens exclusively inside `src/features/*/api/index.ts` — route pages and state modules never touch raw API response types (`PipelineApiEntity`, `PipelineApiListResponse`, etc.).

### Endpoint constants

All API URLs must use constants from `src/core/api/endpoints.ts`. Never construct endpoint URLs with string templates when a constant already exists:

```typescript
// ✅ Correct
await api.get(API_V1.PIPELINE_DETAIL(id));
await api.get(API_V1.CONFIG_DETAIL(id));

// ❌ Wrong — uses string template instead of defined constant
await api.get(`${API_V1.PIPELINES}/${id}`);
await api.get(`${API_V1.CONFIGS}/${id}`);
```

When adding a new endpoint, define it in `API_V1` as a function `(id: string) => string` for parameterized routes.

### Pipeline editor specifics

- **`@xyflow/svelte`** renders the node canvas. `SvelteFlow` requires a `SvelteFlowProvider` wrapper when used inside a child component.
- Internal node/edge types (`BaseNode`, `BaseEdge` from `$core/types/common`) do not extend xyflow types — bridge with `as unknown as Node[]` only at the canvas boundary in the route page, not deeper.
- Node `data` field is typed `Record<string, unknown>`. Cast to concrete types only at usage sites in `ConfigNode.svelte` and `api/index.ts`.

### Cross-feature dependencies

- Components in one feature should NOT import from another feature's `api/` or `state/` modules. If a component is shared (e.g., `SqlEditor`), move it to `$lib/components/`.
- Types that represent the same domain concept must be unified. Do not create duplicate types across features (e.g., `DatasourceItem` vs `DatasourceListItem` — use one type in `$core/types/`).

### Environment

`PUBLIC_API_URL` is the only environment variable (Vite prefix `PUBLIC_`). It is declared in `src/env.d.ts` so `import.meta.env.PUBLIC_API_URL` is typed as `string`. Add new `PUBLIC_*` variables there.

### Toast messages

All user-facing messages (toast notifications, error messages) must be in **English**. Never use Thai or other languages in toast messages:

```typescript
// ✅ Correct
showToast('Saved successfully');
showToast('Pipeline deleted successfully', 'success');

// ❌ Wrong
showToast('บันทึกสำเร็จ');
showToast('ลบสำเร็จ', 'success');
```

### SCSS / Styling

The project uses **SCSS** for styling with a modular architecture:

```
src/
├── app.scss                    # Main entry: loads Tailwind, defines theme, imports modules
├── app.html                    # Includes Google Fonts (Inter) with preconnect
└── styles/                     # Modular SCSS files (use @use, not @import)
    ├── theme.scss              # :root CSS variables (colors, spacing, shadows, radius)
    ├── base.scss               # Reset, global styles, base element styles
    ├── layout.scss             # App shell, sidebar, navbar, footer, responsive
    ├── buttons.scss            # .btn variants, .action-btn (edit, delete)
    ├── forms.scss              # .form-group, .form-label, .form-input, .form-textarea
    ├── tables.scss             # .table-wrapper, .table, .table th, .table td
    ├── drawer.scss             # .drawer, .drawer-overlay, .drawer-header/body/footer
    ├── animations.scss         # @keyframes (spin, pulse-dot, fadeIn), utility classes
    ├── error-banner.scss       # .error-banner, .error-banner-close
    ├── toast.scss              # .toast-container, .toast variants
    ├── dialog.scss             # .dialog, .dialog-overlay, dialog variants
    ├── badge-list.scss         # .badge-list, .badge, .badge-overflow
    ├── item-selector-drawer.scss
    ├── value-map-params-drawer.scss
    ├── sql-guide-modal.scss
    ├── sql-editor.scss
    ├── sql-highlighter.scss
    └── json-viewer.scss

src/features/*/
└── <feature>.scss              # Feature-specific styles with nesting
```

**SCSS rules:**

- **No `<style>` blocks in `.svelte` files** — styles must live in SCSS files only
  - Feature-specific styles → `src/features/<feature_name>/<feature_name>.scss`
  - Shared/global component styles → `src/styles/<component>.scss` (imported in `app.scss`)
- Use `@use` instead of `@import` (deprecated in Dart Sass 3.0.0)
- Use `&` for nesting pseudo-classes and child selectors
- All global component styles (buttons, forms, tables, drawer) go in `src/styles/`
- Feature-specific styles live in the feature's `.scss` file
- Tailwind CSS v4 is loaded via `@use 'tailwindcss'` in `app.scss`
- Theme variables are defined in `:root` for global access

**Available global component classes:**

- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.action-btn`, `.action-btn-edit`, `.action-btn-delete`
- Forms: `.form-group`, `.form-label`, `.form-input`, `.form-textarea`
- Tables: `.table-wrapper`, `.table`
- Drawer: `.drawer`, `.drawer-overlay`, `.drawer-header`, `.drawer-title`, `.drawer-close`, `.drawer-body`, `.drawer-footer`
- Error Banner: `.error-banner`, `.error-banner-close`
- Animations: `.spin` (for loading spinners)

## ESLint Rules (from eslint.config.js)

The project enforces strict code quality rules across all files:

### JavaScript / General Rules

- `eqeqeq: ['error', 'always']` — Always use `===` / `!==`, no loose equality
- `no-console: ['warn', { allow: ['warn', 'error'] }]` — Ban `console.log`; allow `console.warn` / `console.error`
- `no-var: 'error'` — Use `const` / `let` only
- `prefer-const: 'error'` — Use `const` when variable is never reassigned
- `prefer-template: 'error'` — Use template literals instead of string concatenation
- `object-shorthand: ['error', 'always']` — Use `{ foo }` instead of `{ foo: foo }`
- `no-implicit-coercion: 'error'` — Be explicit about type conversions (no `!!x`, `+x`, `""+x`)
- `curly: ['error', 'multi-line']` — Require braces for multi-line blocks

### TypeScript Rules

- `@typescript-eslint/no-explicit-any: 'error'` — Forbid `any` type; use `unknown` + type guards
- `@typescript-eslint/no-unused-vars: ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }]` — Allow leading-underscore convention for intentional ignores
- `@typescript-eslint/consistent-type-imports: ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }]` — Force `import type` for type-only imports
- `@typescript-eslint/no-import-type-side-effects: 'error'` — Prevent side-effect-free `import type` statements
- `@typescript-eslint/no-non-null-assertion: 'error'` — Forbid non-null assertion `!`; handle null/undefined explicitly
- `@typescript-eslint/array-type: ['error', { default: 'array-simple' }]` — Prefer `T[]` over `Array<T>` for simple types
- `@typescript-eslint/ban-ts-comment: ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }]` — Ban `@ts-ignore` and `@ts-expect-error` without description
- `@typescript-eslint/consistent-type-definitions: ['error', 'interface']` — Enforce `interface` over `type` for object shapes

### Type-Aware TypeScript Rules (.ts, .svelte, .svelte.ts)

- `@typescript-eslint/no-unsafe-*: 'error'` — Prevent operating on any-typed values (assignment, call, member access, return, argument)
- `@typescript-eslint/no-floating-promises: ['error', { ignoreVoid: true }]` — Prevent unhandled promise rejections; use `void` to explicitly discard
- `@typescript-eslint/await-thenable: 'error'` — Prevent awaiting non-Promise values
- `@typescript-eslint/no-misused-promises: ['error', { checksVoidReturn: { arguments: false, attributes: false } }]` — Prevent passing async functions where void functions are expected (except in function call arguments and Svelte/HTML event attributes)
- `@typescript-eslint/no-unnecessary-type-assertion: 'error'` — Remove type assertions that are already satisfied by the inferred type
- `@typescript-eslint/prefer-optional-chain: 'error'` — Prefer `?.` over manual null checks
- `@typescript-eslint/prefer-nullish-coalescing: ['error', { ignorePrimitives: { string: true, boolean: true } }]` — Prefer `??` over `||` for nullability checks (ignores primitives which intentionally use `||`)

### Svelte-Specific Rules

- `prefer-const: 'off'` — Disabled in `.svelte` files because Svelte 5 runes semantically require `let` for `$props()` and `$derived()` to create reactive bindings
- `svelte/block-lang: ['error', { script: ['ts'] }]` — Enforce `lang="ts"` on all script blocks

### .svelte.ts Files (State Modules)

All `no-unsafe-*` rules are **disabled** in `.svelte.ts` files because the TypeScript language service cannot resolve types of Svelte 5 runes (`$state`, `$state.raw`, `$derived`). Variables declared with these runes appear as unresolvable (error-typed) to TS, triggering false-positive violations. Svelte's own compiler types these correctly.

## Key Constraints Summary

- **No `any`** — Use `unknown` + type guards instead
- **`import type`** is mandatory for type-only imports
- **No `!` non-null assertion** — Handle nullable explicitly
- **Floating promises** must be explicitly handled: `await fn()` or `void fn()` for fire-and-forget
- **`interface`** over `type` for object shapes
- **SCSS** — Use `@use` (not `@import`), modular file structure, nesting with `&`
- Svelte files use `let` (not `const`) for `$props()` and `$derived()`
- Navigation uses `base` from `$app/paths` prefixed to all `href` and `goto()` paths. The `svelte/no-navigation-without-resolve` rule is disabled (adapter-static, empty base path).
- No `console.log` in production code; use `console.warn` / `console.error` for logging
- **No API calls in route pages** — all data fetching goes through state modules
- **Reuse shared components** (Pagination, SearchBar, ErrorBanner) — never duplicate their markup
- **Use endpoint constants** from `$core/api/endpoints` — never construct URLs with string templates
- **English only** in toast messages and user-facing strings
- **Use `createPaginatedListState<T>`** for new list pages — never write pagination state from scratch
- **Avoid unnecessary `$derived` aliases** — use `state.property` directly in templates instead of creating intermediate variables
