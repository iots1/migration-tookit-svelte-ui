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
    { href: '/pipeline-editor', label: 'Pipeline Editor', icon: 'pipeline' },
    { href: '/db-explorer', label: 'DB Explorer', icon: 'database' },
    { href: '/migration-runner', label: 'Migration Runner', icon: 'runner' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];

  let { collapsed = $bindable(false), mobileOpen = $bindable(false) } =
    $props();

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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M2 17l10 5 10-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2 12l10 5 10-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      {#if !collapsed}
        <div class="sidebar-brand-text">
          <span class="brand-name">Migration Toolkit</span>
          <span class="brand-version">v0.1.0</span>
        </div>
      {/if}
    </div>
    <button
      class="collapse-btn"
      onclick={() => (collapsed = !collapsed)}
      aria-label="Toggle sidebar"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d={collapsed ? 'M7 4l5 5-5 5' : 'M11 4l-5 5 5 5'}
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
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
          {#if item.icon === 'home'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 10l7-7 7 7M5 8.5V17h3.5v-4h3v4H15V8.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else if item.icon === 'pipelines'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 4h14v12H3z"
                stroke="currentColor"
                stroke-width="1.5"
                rx="1"
              />
              <path d="M3 8h14" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M7 12h6"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
              <path
                d="M7 15h4"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                opacity="0.5"
              />
            </svg>
          {:else if item.icon === 'schema'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect
                x="1.5"
                y="1.5"
                width="7"
                height="7"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="11.5"
                y="11.5"
                width="7"
                height="7"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M8.5 5h3l4.5 4.5v3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle
                cx="11"
                cy="9"
                r="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M4 13h2l2-2"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          {:else if item.icon === 'pipeline'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect
                x="1.5"
                y="1.5"
                width="6"
                height="6"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="12.5"
                y="12.5"
                width="6"
                height="6"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M7.5 4.5h2l3.5 3.5v2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle
                cx="11"
                cy="8"
                r="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          {:else if item.icon === 'database'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <ellipse
                cx="10"
                cy="5"
                rx="7"
                ry="3"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M3 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M3 10c0 1.657 3.134 3 7 3s7-1.343 7-3"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          {:else if item.icon === 'runner'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 16l3-4 3 2 4-8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13 6l2 0 0 2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else if item.icon === 'settings'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="2.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          {/if}
        </span>
        {#if !collapsed}
          <span class="nav-label">{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="sidebar-divider"></div>

  {#if !collapsed}
    <div class="sidebar-profile">
      <div class="profile-avatar">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="7"
            r="3.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="profile-info">
        <span class="profile-name">Guest User</span>
        <span class="profile-role">Developer</span>
      </div>
      <button class="logout-btn" onclick={handleLogout} aria-label="Logout">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13 14l4-4-4-4M17 10H7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  {:else}
    <button
      class="logout-btn-sm"
      onclick={handleLogout}
      aria-label="Logout"
      title="Logout"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M13 14l4-4-4-4M17 10H7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  {/if}
</aside>
