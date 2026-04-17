<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';

  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import Toast from '$lib/components/Toast.svelte';

  import '$src/app.css';

  import '$src/app.scss';

  const { children }: { children: Snippet } = $props();

  let collapsed = $state(false);
  let mobileOpen = $state(false);

  const isFullHeight = $derived(
    page.url.pathname.startsWith('/pipeline-editor')
  );

  function toggleMobile() {
    if (window.innerWidth < 768) {
      mobileOpen = !mobileOpen;
    } else {
      collapsed = !collapsed;
    }
  }
</script>

<ConfirmDialog />
<Toast />

<div class="app-shell">
  <Sidebar bind:collapsed bind:mobileOpen />
  <div class="app-main">
    {#if !isFullHeight}
      <Navbar onMenuToggle={toggleMobile} />
    {/if}
    <main class="app-content" class:app-content--full-height={isFullHeight}>
      {@render children()}
    </main>
    <Footer />
  </div>
</div>
