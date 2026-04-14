<script lang="ts">
  import { dialog, resolveDialog } from '$lib/confirm-dialog.svelte';

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') resolveDialog(false);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if dialog.open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="dialog-overlay" onclick={() => resolveDialog(false)}>
    <div
      class="dialog"
      class:dialog--danger={dialog.type === 'danger'}
      class:dialog--success={dialog.type === 'success'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="dialog-icon-wrap dialog-icon-wrap--{dialog.type}">
        {#if dialog.type === 'danger'}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            ></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        {:else}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        {/if}
      </div>

      <h2 id="dialog-title" class="dialog-title">{dialog.title}</h2>
      <p class="dialog-description">{dialog.description}</p>

      <div class="dialog-actions">
        <button class="btn btn-secondary" onclick={() => resolveDialog(false)}>
          {dialog.cancelText}
        </button>
        <button
          class="btn"
          class:btn-danger={dialog.type === 'danger'}
          class:btn-success={dialog.type === 'success'}
          onclick={() => resolveDialog(true)}
        >
          {dialog.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
