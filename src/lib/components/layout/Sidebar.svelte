<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/pipelines', label: 'Pipelines', icon: 'pipelines' },
    { href: '/configs', label: 'Schema Mapper', icon: 'schema' },
    { href: '/db-explorer', label: 'DB Explorer', icon: 'database' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];

  let { collapsed = $bindable(false), mobileOpen = $bindable(false) } =
    $props();

  function getIconPaths(iconName: string): string {
    const paths: Record<string, string> = {
      logo: `<path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3"/><path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      home: `<path d="M3 10l7-7 7 7M5 8.5V17h3.5v-4h3v4H15V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      pipelines: `<path d="M3 4h14v12H3z" stroke="currentColor" stroke-width="1.5" rx="1"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/><path d="M7 12h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M7 15h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>`,
      schema: `<rect x="1.5" y="1.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="11.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 5h3l4.5 4.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="11" cy="9" r="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M4 13h2l2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
      pipeline: `<rect x="1.5" y="1.5" width="6" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="12.5" y="12.5" width="6" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 4.5h2l3.5 3.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="11" cy="8" r="1.5" stroke="currentColor" stroke-width="1.5"/>`,
      database: `<ellipse cx="10" cy="5" rx="7" ry="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5" stroke="currentColor" stroke-width="1.5"/><path d="M3 10c0 1.657 3.134 3 7 3s7-1.343 7-3" stroke="currentColor" stroke-width="1.5"/>`,
      settings: `<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
      user: `<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
      logout: `<path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 14l4-4-4-4M17 10H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      collapseLeft: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M9 3v18" stroke="currentColor" stroke-width="1.5"/><path d="M16 15l-3-3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      collapseRight: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M9 3v18" stroke="currentColor" stroke-width="1.5"/><path d="M14 9l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    };
    return paths[iconName] || '';
  }

  function getIconSize(iconName: string): string {
    const sizes: Record<string, { width: number; height: number }> = {
      logo: { width: 24, height: 24 },
      collapseLeft: { width: 20, height: 20 },
      collapseRight: { width: 20, height: 20 },
      user: { width: 18, height: 18 },
      logout: { width: 18, height: 18 },
    };
    const size = sizes[iconName] || { width: 20, height: 20 };
    return `width="${size.width}" height="${size.height}"`;
  }

  function isActive(href: string): boolean {
    const resolved = resolve(href as '/');

    if (href === '/') return page.url.pathname === resolved;
    return page.url.pathname.startsWith(resolved);
  }

  function handleNav() {
    if (window.innerWidth < 768) {
      mobileOpen = false;
    }
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  }
</script>

{#if mobileOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="sidebar-overlay"
    onclick={() => (mobileOpen = false)}
    onkeydown={() => {}}
  ></div>
{/if}

<aside
  class="sidebar"
  class:sidebar-collapsed={collapsed}
  class:sidebar-mobile-open={mobileOpen}
>
  <div class="sidebar-header">
    <div class="sidebar-brand-group">
      <div class="sidebar-logo">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html `<svg ${getIconSize('logo')} viewBox="0 0 24 24" fill="none">${getIconPaths('logo')}</svg>`}
      </div>
      <div class="sidebar-brand-text">
        <span class="brand-name">Migration Toolkit</span>
        <span class="brand-version">v0.1.0</span>
      </div>
    </div>
    <button
      class="collapse-btn"
      onclick={() => (collapsed = !collapsed)}
      aria-label="Toggle sidebar"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html `<svg ${getIconSize(collapsed ? 'collapseRight' : 'collapseLeft')} viewBox="0 0 24 24" fill="none">${getIconPaths(collapsed ? 'collapseRight' : 'collapseLeft')}</svg>`}
    </button>
  </div>

  <div class="sidebar-divider"></div>

  <nav class="sidebar-nav">
    {#each navItems as item (item.href)}
      <a
        href={resolve(item.href as '/')}
        class="nav-item"
        class:active={isActive(item.href)}
        title={collapsed ? item.label : undefined}
        onclick={handleNav}
      >
        <span class="nav-icon">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html `<svg ${getIconSize(item.icon)} viewBox="0 0 20 20" fill="none">${getIconPaths(item.icon)}</svg>`}
        </span>
        <span class="nav-label">{item.label}</span>
      </a>
    {/each}
  </nav>

  <div class="sidebar-divider"></div>

  <div class="sidebar-profile">
    <div class="profile-avatar">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html `<svg ${getIconSize('user')} viewBox="0 0 20 20" fill="none">${getIconPaths('user')}</svg>`}
    </div>
    <div class="profile-info">
      <span class="profile-name">Guest User</span>
      <span class="profile-role">Developer</span>
    </div>
    <button class="logout-btn" onclick={handleLogout} aria-label="Logout">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html `<svg ${getIconSize('logout')} viewBox="0 0 20 20" fill="none">${getIconPaths('logout')}</svg>`}
    </button>
  </div>

  <button
    class="logout-btn-sm"
    onclick={handleLogout}
    aria-label="Logout"
    title="Logout"
  >
    <span class="logout-icon-sm">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html `<svg ${getIconSize('logout')} viewBox="0 0 20 20" fill="none">${getIconPaths('logout')}</svg>`}
    </span>
    <span class="logout-label-sm">Logout</span>
  </button>
</aside>
