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
✅  pipelines-list-state.svelte.ts  → fetchPipelines, deleteById, search
✅  pipelines/+page.svelte          → calls state, calls goto(), renders template
❌  pipelines/+page.svelte          → contains fetchPipelines() inline
```

### O — Open/Closed Principle
Code should be open for extension and closed for modification.

- Prefer adding new state functions over modifying existing ones.
- Use composition: pass callbacks/handlers as props rather than hard-coding behavior in child components.
- Never extend a component by editing its internal logic — add a new variant or prop instead.

### L — Liskov Substitution Principle
Concrete implementations must be substitutable for their interface contracts.

- If a function returns `Promise<string | null>`, callers must handle both cases — never assume non-null.
- State factory functions (e.g., `createEditorState()`) must fulfil the full declared interface.

### I — Interface Segregation Principle
Prefer small, focused interfaces over large catch-all ones.

- Split large interfaces by concern. A `PipelineListState` interface should not include editor-specific fields.
- Shared API types (`ApiPagination`, `ApiStatus`, `ApiLinks`, `ApiMeta`) live in `src/core/types/common.ts`.
- Feature-specific types live in the feature's own files, not in `core/`.

```
✅  import type { BaseNode } from '$core/types/common'
✅  import type { PipelineListItem } from '$core/types/pipeline'
❌  import type { BaseNode, PipelineListItem, ... } from '$core/types/pipeline'  // mixed concern
```

### D — Dependency Inversion Principle
High-level modules must not depend on low-level modules. Both should depend on abstractions.

- Route pages depend on **state interfaces**, not concrete implementations.
- State modules depend on **API function signatures**, not on internal API implementation details.
- Pass dependencies via props/arguments rather than importing them directly inside components.

---

## 2. TypeScript Rules

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

### Strict TypeScript
The project runs with `strict: true`. All compiler errors must be resolved — never use `// @ts-ignore` or `// @ts-expect-error` to silence errors.

---

## 3. File & Module Organization

| Layer | Location | Allowed Imports |
|---|---|---|
| Types | `src/core/types/` | None |
| API client | `src/core/api/` | Types only |
| Feature API | `src/features/*/api/` | Core API, Types |
| Feature state | `src/features/*/state/` | Feature API, Types |
| Components | `src/features/*/components/` | Types only (no API, no state) |
| Route pages | `src/routes/` | Feature state, Components, `$app/*` |

### Shared vs Feature types
- Types used across **two or more features** → `src/core/types/common.ts`
- Types used within **one feature only** → inside the feature directory
- Never put feature-specific types in `src/core/types/`

---

## 4. Svelte-Specific Rules

- Always provide a **key** in `{#each}` blocks: `{#each items as item (item.id)}`
- Never use `<!-- svelte-ignore -->` unless the ignored warning is a known false-positive — document why.
- State reactive variables that are **never reassigned** must use `const`:

```typescript
const pageSize = 10;           // ✅ plain const — not reactive, never changes
let loading = $state(false);   // ✅ let — will be reassigned
const isReadOnly = $state(true); // ✅ const $state — reactive but never reassigned
```

---

## 5. ESLint & Formatting

- All code must pass `pnpm lint` with **zero errors** before merging.
- Run `pnpm format` before committing to apply Prettier formatting.
- Do not disable ESLint rules inline (`// eslint-disable`) without a comment explaining why and a linked issue.

---

## 6. Commit Standards

- One logical change per commit.
- Commit messages must describe *why*, not just *what*:
  ```
  ✅  feat: extract pipelines list logic into state module (SOLID-S)
  ❌  feat: update pipelines page
  ```
