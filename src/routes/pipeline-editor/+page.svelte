<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  onMount(() => {
    goto(`${base}/pipeline-editor/new`);
  });
</script>

<svelte:head>
  <title>New Pipeline - Migration Toolkit</title>
</svelte:head>

<div class="pipeline-page">
  <div class="pipeline-loading">
    <div class="pipeline-loading-spinner"></div>
    <span>Redirecting...</span>
  </div>
</div>
