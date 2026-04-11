<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	const { children } = $props();

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
