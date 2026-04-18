<script lang="ts">
  import { page } from '$app/state';

  import type { ThemeState } from '$core/state/theme.svelte';

  let {
    onMenuToggle,
    themeState,
  }: {
    onMenuToggle: () => void;
    themeState: ThemeState;
  } = $props();

  const routeName: Record<string, string> = {
    '/': 'Home',
    '/configs': 'Schema Mapper',
    '/pipeline-editor': 'Pipeline Editor',
    '/db-explorer': 'DB Explorer',
    '/migration-runner': 'Migration Runner',
    '/settings': 'Settings',
  };

  function getBreadcrumb(): string {
    const pathname = page.url.pathname;
    if (routeName[pathname]) return routeName[pathname];
    if (pathname.startsWith('/configs/')) return 'Schema Mapper';
    if (pathname.startsWith('/pipeline-editor/')) return 'Pipeline Editor';
    return 'Migration Toolkit';
  }
</script>

<header class="navbar">
  <div class="navbar-left">
    <button class="menu-toggle" onclick={onMenuToggle} aria-label="Toggle menu">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="10" width="16" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="15" width="16" height="2" rx="1" fill="currentColor" />
      </svg>
    </button>
    <h1 class="navbar-title">{getBreadcrumb()}</h1>
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
