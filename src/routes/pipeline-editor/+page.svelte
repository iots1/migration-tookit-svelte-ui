<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  onMount(() => {
    void goto(resolve('/pipeline-editor/[uuid]', { uuid: 'new' }), {
      replaceState: true,
    });
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
