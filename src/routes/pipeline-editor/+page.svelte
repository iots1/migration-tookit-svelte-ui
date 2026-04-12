<svelte:head>
	<title>New Pipeline - Migration Toolkit</title>
</svelte:head>

<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(`${base}/pipeline-editor/new`);
	});
</script>

<div class="pipeline-page">
	<div class="pipeline-loading">
		<div class="pipeline-loading-spinner"></div>
		<span>Redirecting...</span>
	</div>
</div>
