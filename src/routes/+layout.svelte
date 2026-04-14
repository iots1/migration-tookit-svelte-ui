<script lang="ts">
  import type { Snippet } from 'svelte';

  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';

  import '../app.scss';

  const { children }: { children: Snippet } = $props();

  let collapsed = $state(false);
  let mobileOpen = $state(false);

  function toggleMobile() {
    if (window.innerWidth < 768) {
      mobileOpen = !mobileOpen;
    } else {
      collapsed = !collapsed;
    }
  }
</script>

<ConfirmDialog />

<div class="app-shell">
  <Sidebar bind:collapsed bind:mobileOpen />
  <div class="app-main">
    <Navbar onMenuToggle={toggleMobile} />
    <main class="app-content">
      {@render children()}
    </main>
    <Footer />
  </div>
</div>
