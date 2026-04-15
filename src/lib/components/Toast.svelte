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

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.2s ease-out;
    pointer-events: auto;
  }

  .toast--success {
    background: var(--green-bg);
    color: var(--green-text);
    border: 1px solid var(--green-border, var(--green-text));
  }

  .toast--error {
    background: var(--error-bg);
    color: var(--error-text);
    border: 1px solid var(--error-border);
  }

  .toast--info {
    background: var(--blue-bg);
    color: var(--blue-text);
    border: 1px solid var(--blue-border);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
