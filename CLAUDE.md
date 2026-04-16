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
    └── animations.scss         # @keyframes (spin, pulse-dot, fadeIn), utility classes

src/features/pipeline-editor/
└── pipeline-editor.scss        # Feature-specific styles (converted to SCSS with nesting)
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
