<script lang="ts">
  import { getToasts } from '$lib/toast.svelte';
</script>

<div class="toast-container">
  {#each getToasts() as toast (toast.id)}
    <div class="toast toast--{toast.type}">
      {#if toast.type === 'success'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M5 8l2.5 2.5 4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      {:else if toast.type === 'error'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M8 5v3.5M8 10.5v.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M8 7v4M8 5.5v.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      {/if}
      <span>{toast.message}</span>
    </div>
  {/each}
</div>
