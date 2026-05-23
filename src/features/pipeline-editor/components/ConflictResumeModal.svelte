<script lang="ts">
  interface Props {
    open: boolean;
    onResume: () => void;
    onNewRun: () => void;
    onCancel: () => void;
    loading?: boolean;
  }

  let { open, onResume, onNewRun, onCancel, loading = false }: Props = $props();
</script>

{#if open}
  <div class="dialog-overlay" role="dialog" aria-modal="true">
    <div class="dialog">
      <div class="dialog-icon-wrap dialog-icon-wrap--warning">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h3 class="dialog-title">Job Already Running</h3>
      <p class="dialog-description">
        A job is already running for this pipeline. Would you like to resume the
        existing job or start a new run?
      </p>

      <div class="dialog-actions">
        <button class="btn btn-secondary" onclick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button class="btn btn-warning" onclick={onNewRun} disabled={loading}>
          {#if loading}
            <span
              class="spin"
              style="display:inline-block;width:14px;height:14px;border-width:2px;margin-right:6px;vertical-align:middle;"
            ></span>
          {/if}
          New Run
        </button>
        <button class="btn btn-accent" onclick={onResume} disabled={loading}>
          {#if loading}
            <span
              class="spin"
              style="display:inline-block;width:14px;height:14px;border-width:2px;margin-right:6px;vertical-align:middle;"
            ></span>
          {/if}
          Resume
        </button>
      </div>
    </div>
  </div>
{/if}
