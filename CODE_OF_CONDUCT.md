# Code of Conduct — Migration Toolkit Svelte UI

This document defines the mandatory coding standards for all contributors. Every change must comply with these rules before being merged.

---

## 1. SOLID Principles

### S — Single Responsibility Principle

Each file, module, or function must have **one reason to change**.

- `.svelte` route files handle **rendering and navigation only** — no API calls, no business logic.
- State modules (`.svelte.ts`) handle **state management and business operations** — no DOM manipulation, no `goto()`.
- API modules (`api/index.ts`) handle **HTTP calls and data mapping** — no state mutations, no UI concerns.
- Type files (`types/`) contain **only interfaces and type aliases** — no logic.

```
✅  pipelines-list-state.svelte.ts  → uses createPaginatedListState, adds domain aliases
✅  pipelines/+page.svelte          → calls state methods, uses shared components, calls goto()
❌  pipelines/+page.svelte          → calls listPipelines() or deletePipeline() directly
❌  pipelines/+page.svelte          → contains inline pagination markup instead of <Pagination>
```

### O — Open/Closed Principle

Code should be open for extension and closed for modification.

- Use generic factories (e.g., `createPaginatedListState<T>`) to add new list pages without modifying shared code.
- Pass callbacks/handlers as props rather than hard-coding behavior in child components.
- When a new pattern emerges in 2+ places, extract it into a shared abstraction before the 3rd occurrence.

```
✅  New list page → createPaginatedListState<NewItem>(fetchFn, deleteFn, 'Items')
✅  New drawer → reuse <EditConfigDrawer> pattern with props
❌  New list page → copy-paste state from another feature and rename variables
```

### L — Liskov Substitution Principle

Concrete implementations must be substitutable for their interface contracts.

- If a function returns `Promise<string | null>`, callers must handle both cases — never assume non-null.
- State factory functions (e.g., `createEditorState()`) must fulfil the full declared interface.
- Generic factory wrappers must preserve the base contract: domain aliases are additions, not replacements.

### I — Interface Segregation Principle

Prefer small, focused interfaces over large catch-all ones.

- Split large interfaces by concern. A `PipelinesListState` interface should not include editor-specific fields.
- Shared API types (`ApiPagination`, `ApiStatus`, `ApiLinks`, `ApiMeta`) live in `src/core/types/common.ts`.
- Feature-specific types live in the feature's own files, not in `core/`.
- Import from the canonical source, not from re-exporting files:

```
✅  import type { BaseNode } from '$core/types/common'
✅  import type { PipelineListItem } from '$core/types/pipeline'
❌  import type { BaseNode, PipelineListItem, ... } from '$core/types/pipeline'  // mixed concern — import BaseNode from common.ts
```

### D — Dependency Inversion Principle

High-level modules must not depend on low-level modules. Both should depend on abstractions.

- Route pages depend on **state interfaces**, not concrete implementations.
- State modules depend on **API function signatures**, not on internal API implementation details.
- Pass dependencies via props/arguments rather than importing them directly inside components.
- Generic factories accept function parameters (`fetchFn`, `deleteFn`) rather than importing concrete API functions.

```typescript
// ✅ Correct — factory receives dependencies as parameters
const state = createPaginatedListState<PipelineListItem>(
  listPipelines, // injected fetch function
  deletePipeline, // injected delete function
  'Pipelines' // injected label
);

// ❌ Wrong — factory hardcodes its own API dependency
function createPipelinesListState() {
  // internally calls listPipelines() directly without abstraction
}
```

---

## 2. DRY Principle (Don't Repeat Yourself)

### Never duplicate shared UI patterns

If markup appears in 2+ pages, extract it into a shared component in `$lib/components/`:

| Pattern                       | Shared Component | Used By                      |
| ----------------------------- | ---------------- | ---------------------------- |
| Pagination controls           | `<Pagination>`   | All list pages               |
| Search input + clear + button | `<SearchBar>`    | All list pages               |
| Error message + dismiss       | `<ErrorBanner>`  | All pages with errors        |
| Badge pills with overflow     | `<BadgeList>`    | Config editor, field mapping |

**Rule of three:** If you find yourself writing the same markup a third time, stop and extract a component.

### Never duplicate state logic

If state logic appears in 2+ features, extract it into a generic factory in `$core/state/`:

```typescript
// ✅ Correct — shared factory
import { createPaginatedListState } from '$core/state/paginated-list-state.svelte';

const state = createPaginatedListState<MyItem>(fetchFn, deleteFn, 'Label');

// ❌ Wrong — copy-paste state with different variable names
function createFooListState() {
  let foos = $state<FooItem[]>([]);
  let loading = $state(false);
  // ... 30 lines of identical pagination/search/error logic
}
```

### Never duplicate API client logic

Error handling, response parsing, and status code handling belong in the `ApiClient` class (`src/core/api/client.ts`) once — not repeated in every API method.

---

## 3. TypeScript Rules

### No `any`

Using `any` is **strictly forbidden** in all TypeScript and Svelte files.

```typescript
// ❌ Forbidden
let data: any = fetch('/api');
function process(input: any) { ... }

// ✅ Correct
let data: unknown = fetch('/api');
function process(input: ConfigItem) { ... }
```

Use `unknown` when the type is truly unknown, then narrow with type guards.

### No unsafe type assertions

Double-casting (`as unknown as T`) is a code smell. Use it only when bridging third-party library types (e.g., `@xyflow/svelte`) and document why.

```typescript
// ❌ Forbidden without justification
const result = value as unknown as MyType;

// ✅ Acceptable only when bridging external library types — add a comment
nodes={state.nodes as unknown as Node[]}  // @xyflow/svelte Node extends BaseNode
```

### No unnecessary type assertions

When generics already narrow the type, do not re-assert:

```typescript
// ❌ Wrong — T is already PipelineListItem
get pipelines() { return state.items as PipelineListItem[]; }

// ✅ Correct — generics handle it
get pipelines() { return state.items; }
```

### Strict TypeScript

The project runs with `strict: true`. All compiler errors must be resolved — never use `// @ts-ignore` or `// @ts-expect-error` to silence errors.

---

## 4. File & Module Organization

| Layer         | Location                     | Allowed Imports                     |
| ------------- | ---------------------------- | ----------------------------------- |
| Types         | `src/core/types/`            | None                                |
| Shared state  | `src/core/state/`            | Types only                          |
| API client    | `src/core/api/`              | Types only                          |
| Feature API   | `src/features/*/api/`        | Core API, Types                     |
| Feature state | `src/features/*/state/`      | Feature API, Core state, Types      |
| Components    | `src/features/*/components/` | Types only (no API, no state)       |
| Shared UI     | `src/lib/components/`        | Types only                          |
| Route pages   | `src/routes/`                | Feature state, Components, `$app/*` |

### Import direction — never go upward

Route pages may import from feature state. Feature state may import from feature API. Feature API may import from core. **Never reverse this direction.**

```
routes → features/state → features/api → core
```

```
✅  route page imports createEditorState() from features/state
✅  state module imports listPipelines() from features/api
✅  api module imports api from core/api/client
❌  route page imports loadPipeline() from features/api directly
❌  route page imports createJob() from features/api directly
❌  api module imports state from features/state
```

### Shared vs Feature types

- Types used across **two or more features** → `src/core/types/common.ts`
- Types used within **one feature only** → inside the feature directory
- Never put feature-specific types in `src/core/types/`

---

## 5. Svelte-Specific Rules

- Always provide a **key** in `{#each}` blocks: `{#each items as item (item.id)}`
- Never use `<!-- svelte-ignore -->` unless the ignored warning is a known false-positive — document why.
- State reactive variables that are **never reassigned** must use `const`:

```typescript
const pageSize = 10; // ✅ plain const — not reactive, never changes
let loading = $state(false); // ✅ let — will be reassigned
const isReadOnly = $state(true); // ✅ const $state — reactive but never reassigned
```

### Avoid unnecessary `$derived` aliases

Do not create `$derived` variables that merely proxy another state's property:

```typescript
// ❌ Wrong — adds indirection without value
let loading = $derived(explorer.loading);
let error = $derived(explorer.error);
// then use {loading} and {error} in template

// ✅ Correct — use directly
// Use {explorer.loading} and {explorer.error} in template
```

Exception: `$derived` is appropriate when computing a new value (e.g., filtering, transforming, or combining state).

---

## 6. Endpoint Constants

All API URLs must use constants from `src/core/api/endpoints.ts`:

```typescript
// ✅ Correct
await api.get(API_V1.PIPELINE_DETAIL(id));
await api.get(API_V1.CONFIG_DETAIL(id));

// ❌ Wrong — string template instead of defined constant
await api.get(`${API_V1.PIPELINES}/${id}`);
await api.get(`${API_V1.CONFIGS}/${id}`);
```

When adding a new endpoint, define it in `API_V1` as a function `(id: string) => string` for parameterized routes.

---

## 7. User-Facing Messages

All toast notifications and user-facing strings must be in **English**:

```typescript
// ✅ Correct
showToast('Saved successfully');
showToast('Pipeline deleted successfully', 'success');

// ❌ Wrong
showToast('บันทึกสำเร็จ');
showToast('ลบสำเร็จ', 'success');
```

---

## 8. ESLint & Formatting

- All code must pass `pnpm lint` with **zero errors** before merging.
- Run `pnpm format` before committing to apply Prettier + Stylelint formatting.
- Do not disable ESLint rules inline (`// eslint-disable`) without a comment explaining why and a linked issue.

---

## 9. Commit Standards

- One logical change per commit.
- Commit messages must describe _why_, not just _what_:
  ```
  ✅  feat: extract shared Pagination component to reduce duplication (DRY)
  ✅  refactor: move pipeline API calls from route to editor-state (SOLID-S)
  ❌  feat: update pipelines page
  ```
