<script lang="ts">
  import { page } from '$app/state';

  let { onMenuToggle }: { onMenuToggle: () => void } = $props();

  const routeName: Record<string, string> = {
    '/': 'Home',
    '/pipeline-editor': 'Pipeline Editor',
    '/db-explorer': 'DB Explorer',
    '/migration-runner': 'Migration Runner',
    '/settings': 'Settings',
  };

  function getBreadcrumb(): string {
    return routeName[page.url.pathname] || 'Migration Toolkit';
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
</header>
