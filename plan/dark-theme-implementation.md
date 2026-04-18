# Dark Theme Implementation Plan

## Overview

**Current State:** Light-only theme. All colors are already CSS custom properties defined in `src/styles/theme.scss` under `:root` — the token layer is complete.

**Target State:** System-aware dark/light toggle. User preference persisted in `localStorage`. Toggle button in Navbar right slot.

---

## Architecture Decision

Apply `data-theme="dark"` on `document.documentElement` (`<html>`). Override all CSS variables in `[data-theme="dark"]` in `theme.scss`. No JS-in-CSS, no Tailwind dark variant — pure CSS variable swap.

**Why `<html>` not `<body>` or `.app-shell`:** Ensures `<meta theme-color>` and browser chrome pick up the correct scheme. CSS `color-scheme` property also needs to be on `<html>`.

---

## File Map

| File                                      | Change                                                          |
| ----------------------------------------- | --------------------------------------------------------------- |
| `src/styles/theme.scss`                   | Add `[data-theme="dark"]` block with all variable overrides     |
| `src/core/state/theme.svelte.ts`          | New — singleton theme state (read/toggle/persist)               |
| `src/routes/+layout.svelte`               | Import theme state, apply `data-theme` to `<html>` on mount     |
| `src/lib/components/layout/Navbar.svelte` | Add `.navbar-right` with theme toggle button                    |
| `src/styles/layout.scss`                  | Add `.navbar-right` flex styles + `.theme-toggle` button styles |

---

## Step-by-Step Implementation

### Step 1 — Dark Token Values (`src/styles/theme.scss`)

Add below the existing `:root {}` block:

```scss
[data-theme='dark'] {
  color-scheme: dark;

  /* Backgrounds */
  --bg-base: #0f0e1a;
  --bg-primary: #1a1825;
  --bg-sidebar: #1a1825;
  --bg-sidebar-hover: #2d2a45;
  --bg-sidebar-active: #3d3860;
  --bg-card: #1e1c2e;

  /* Text */
  --text-primary: #e8e4ff;
  --text-secondary: #9b97b8;
  --text-sidebar: #8b87a8;
  --text-sidebar-active: #a78bfa;
  --text-muted: #6b6880;

  /* Borders */
  --border-color: #2d2a45;
  --border-light: #252333;

  /* Accent (mostly unchanged, adjust hover) */
  --accent: #8b5cf6;
  --accent-light: #7c3aed;
  --accent-bg: #1a1825;
  --accent-hover: #9f7aea;
  --accent-xlight: #3d3860;

  /* Semantic Colors — darker tints */
  --peach-bg: #2a1a0e;
  --peach-text: #fb923c;

  --blue-bg: #0e1a2a;
  --blue-text: #60a5fa;

  --teal-bg: #0a1f1e;
  --teal-text: #2dd4bf;

  --green-bg: #0a1f14;
  --green-text: #4ade80;
  --green-border: #166534;
  --green-bg-hover: #14532d;

  /* Error / Danger */
  --error-text: #f87171;
  --error-bg: #1f0e0e;
  --error-border: #7f1d1d;

  --danger-bg: #2a0e0e;
  --danger-text: #f87171;

  /* Table */
  --bg-table-header: #1e1c2e;
  --bg-table-hover: #252333;

  /* Shadows (purple-tinted, darker) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
}
```

Also add `color-scheme: light` inside the existing `:root {}` block for symmetry (tells browser scrollbars, inputs, etc. to render in light mode by default).

---

### Step 2 — Theme State (`src/core/state/theme.svelte.ts`)

New singleton module. Instantiate once in layout, never recreate.

```typescript
// src/core/state/theme.svelte.ts

type Theme = 'light' | 'dark';

function createThemeState() {
  const STORAGE_KEY = 'theme';

  function getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  let theme = $state<Theme>('light'); // will be set on mount

  function apply(t: Theme) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  function init() {
    apply(getInitialTheme());
  }

  function toggle() {
    apply(theme === 'light' ? 'dark' : 'light');
  }

  return {
    get theme() {
      return theme;
    },
    get isDark() {
      return theme === 'dark';
    },
    init,
    toggle,
  };
}

export const themeState = createThemeState();
```

**Note:** `localStorage` and `window.matchMedia` are browser-only — call `init()` inside `onMount` in `+layout.svelte`, not at module load time (SSR-safe even though this is a static SPA).

---

### Step 3 — Wire into Layout (`src/routes/+layout.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  import { themeState } from '$core/state/theme.svelte';

  // ... existing imports

  onMount(() => {
    themeState.init();
  });
</script>
```

Pass `themeState` down to `Navbar` as a prop:

```svelte
<Navbar onMenuToggle={toggleMobile} {themeState} />
```

---

### Step 4 — Toggle Button in Navbar (`src/lib/components/layout/Navbar.svelte`)

Add a `navbar-right` div with a theme toggle button. Use two SVG icons inline (sun / moon) and swap based on `isDark`.

```svelte
<script lang="ts">
  import { page } from '$app/state';

  import type { themeState as ThemeState } from '$core/state/theme.svelte';

  let {
    onMenuToggle,
    themeState,
  }: {
    onMenuToggle: () => void;
    themeState: typeof ThemeState;
  } = $props();

  // ... existing getBreadcrumb()
</script>

<header class="navbar">
  <div class="navbar-left">
    <!-- existing content -->
  </div>
  <div class="navbar-right">
    <button
      class="theme-toggle"
      onclick={themeState.toggle}
      aria-label={themeState.isDark
        ? 'Switch to light mode'
        : 'Switch to dark mode'}
    >
      {#if themeState.isDark}
        <!-- Sun icon -->
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      {:else}
        <!-- Moon icon -->
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>
  </div>
</header>
```

---

### Step 5 — Navbar Styles (`src/styles/layout.scss`)

Add `.navbar-right` and `.theme-toggle` inside the existing `.navbar` section:

```scss
.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);

  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--accent-light);
    background: var(--bg-sidebar-hover);
    color: var(--accent);
  }
}
```

---

## Flash-of-Wrong-Theme (FOUT) Prevention

Since this is a static SPA with `adapter-static`, add an inline `<script>` to `src/app.html` **before** any CSS loads:

```html
<script>
  (function () {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : prefersDark
          ? 'dark'
          : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

Place this inside `<head>` in `src/app.html` before `%sveltekit.head%`. This runs synchronously before any render, eliminating the light flash on dark-mode users.

---

## Feature Checklist

- [ ] **Step 1** — Add `[data-theme="dark"]` variables to `theme.scss`
- [ ] **Step 2** — Create `src/core/state/theme.svelte.ts` singleton
- [ ] **Step 3** — Wire `themeState.init()` in `+layout.svelte` `onMount`; pass to Navbar
- [ ] **Step 4** — Add toggle button to `Navbar.svelte` with sun/moon icons
- [ ] **Step 5** — Add `.navbar-right` + `.theme-toggle` styles to `layout.scss`
- [ ] **Step 6** — Add FOUT-prevention inline script to `src/app.html`
- [ ] **Step 7** — Manual QA: toggle persists on refresh, system preference respected on first visit, all pages look correct in dark mode

---

## Notes & Edge Cases

- **DB Explorer SCSS** (`src/features/db-explorer/db-explorer.scss`) uses hardcoded colors in some places — audit after global tokens are applied and replace any stragglers with CSS variables.
- **`color-scheme`** on `:root` also affects browser-native elements (scrollbars, `<input>`, `<select>`) — essential for consistent feel.
- **No Tailwind dark variant needed** — the project uses Tailwind v4 for utilities only; all component colors go through CSS variables. Dark mode just swaps the variables.
- **System preference sync**: If needed in a future iteration, listen to `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)` to auto-switch when the user changes OS theme (only when no stored preference).
