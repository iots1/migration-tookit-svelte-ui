# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build static site → build/
pnpm preview          # Preview production build
pnpm check            # svelte-check type checking (run after editing .svelte files)
pnpm check:watch      # Type checking in watch mode
pnpm lint             # Prettier check + ESLint (must pass before merging)
pnpm format           # Auto-format with Prettier
```

ESLint and Prettier run together under `pnpm lint`. Always run `pnpm lint` after making changes. There is no test suite.

## Architecture

**SvelteKit 5 static SPA** — `adapter-static` with `fallback: index.html` for client-side routing. Svelte 5 **runes mode** is mandatory (`compilerOptions.runes: true`).

### Path aliases (defined in `svelte.config.js`)

| Alias       | Resolves to                                                       |
| ----------- | ----------------------------------------------------------------- |
| `$core`     | `src/core/`                                                       |
| `$features` | `src/features/`                                                   |
| `$lib`      | `src/lib/` (SvelteKit default)                                    |
| `$app/*`    | SvelteKit runtime (`$app/navigation`, `$app/paths`, `$app/state`) |

### Layer separation — strictly enforced

```
src/routes/          ← View only: rendering + navigation (goto, href). No API calls.
src/features/*/
  components/        ← Pure UI components. Receive props, emit events. No state imports.
  state/             ← Business logic, state management, API orchestration (.svelte.ts)
  api/               ← HTTP calls + data mapping to/from API shapes. No state mutations.
src/core/
  api/               ← Generic ApiClient, endpoint constants, auth state
  types/             ← Type definitions only. common.ts for shared types; pipeline.ts for pipeline domain.
  utils/             ← Pure utility functions
src/lib/components/  ← Shared layout components (Sidebar, Navbar, Footer)
```

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

### API data flow

The backend returns JSON:API-style envelopes. Mapping from API shapes to UI types happens exclusively inside `src/features/pipeline-editor/api/index.ts` — route pages and state modules never touch raw API response types (`PipelineApiEntity`, `PipelineApiListResponse`, etc.).

### Pipeline editor specifics

- **`@xyflow/svelte`** renders the node canvas. `SvelteFlow` requires a `SvelteFlowProvider` wrapper when used inside a child component.
- Internal node/edge types (`BaseNode`, `BaseEdge` from `$core/types/common`) do not extend xyflow types — bridge with `as unknown as Node[]` only at the canvas boundary in the route page, not deeper.
- Node `data` field is typed `Record<string, unknown>`. Cast to concrete types only at usage sites in `ConfigNode.svelte` and `api/index.ts`.

### Environment

`PUBLIC_API_URL` is the only environment variable (Vite prefix `PUBLIC_`). It is declared in `src/env.d.ts` so `import.meta.env.PUBLIC_API_URL` is typed as `string`. Add new `PUBLIC_*` variables there.

## Key constraints from CODE_OF_CONDUCT.md + ESLint config

- **No `any`** — `@typescript-eslint/no-explicit-any` and all `no-unsafe-*` rules are errors.
- **`import type`** is mandatory for type-only imports (`consistent-type-imports`).
- **No `!` non-null assertion** — handle nullable explicitly.
- **Floating promises** must be explicitly handled: `await fn()` or `void fn()` for fire-and-forget.
- **`interface`** over `type` for object shapes (`consistent-type-definitions`).
- Svelte files use `let` (not `const`) for `$props()` and `$derived()` — `prefer-const` is disabled in `.svelte` files because runes require `let` for reactivity.
- Navigation uses `base` from `$app/paths` prefixed to all `href` and `goto()` paths. The `svelte/no-navigation-without-resolve` rule is disabled (adapter-static, empty base path).
