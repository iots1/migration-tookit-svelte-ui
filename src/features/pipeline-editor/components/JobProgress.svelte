<script lang="ts">
  let {
    open,
    active,
    status,
    jobId,
    runId,
    currentStep,
    totalRows,
    batches,
    errorMessage,
    onClose,
  }: {
    open: boolean;
    active: boolean;
    status: string | null;
    jobId: string | null;
    runId: string | null;
    currentStep: string | null;
    totalRows: number;
    batches: Array<{
      step: string;
      batchNum: number;
      rowsProcessed: number;
    }>;
    errorMessage: string | null;
    onClose: () => void;
  } = $props();

  function handleOverlayClick() {
    onClose();
  }

  function handleDrawerClick(e: MouseEvent) {
    e.stopPropagation();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  let batchLogRef: HTMLDivElement | undefined = $state<
    HTMLDivElement | undefined
  >(undefined);

  $effect(() => {
    if (batchLogRef) {
      batchLogRef.scrollTop = batchLogRef.scrollHeight;
    }
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drawer-overlay drawer-overlay-open"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
  ></div>
  <div
    class="drawer drawer-open"
    role="dialog"
    aria-label="Job Progress"
    tabindex="-1"
    onclick={handleDrawerClick}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="drawer-header">
      <h3 class="drawer-title">Job Progress</h3>
      <button class="drawer-close" onclick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 4l12 12M16 4L4 16"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="drawer-body">
      <div
        class="job-status-card"
        class:job-status-running={active}
        class:job-status-completed={status === 'completed'}
        class:job-status-error={status === 'error'}
      >
        <div class="job-status-indicator">
          {#if active}
            <span class="job-pulse"></span>
          {:else if status === 'completed'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="var(--green-text)"
                stroke-width="2"
              />
              <path
                d="M6 10l3 3 5-6"
                stroke="var(--green-text)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else if status === 'error'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="var(--error-text)"
                stroke-width="2"
              />
              <path
                d="M10 6v4M10 13v.5"
                stroke="var(--error-text)"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          {/if}
        </div>
        <div class="job-status-text">
          <span class="job-status-label">
            {#if active}
              Running...
            {:else if status === 'completed'}
              Completed
            {:else if status === 'error'}
              Failed
            {:else}
              Waiting...
            {/if}
          </span>
          {#if currentStep}
            <span class="job-status-step">Step: {currentStep}</span>
          {/if}
        </div>
      </div>

      <div class="job-stats">
        <div class="job-stat-item">
          <span class="job-stat-label">Total Rows</span>
          <span class="job-stat-value">{totalRows.toLocaleString()}</span>
        </div>
        <div class="job-stat-item">
          <span class="job-stat-label">Batches</span>
          <span class="job-stat-value">{batches.length}</span>
        </div>
      </div>

      {#if jobId}
        <div class="job-meta">
          <div class="job-meta-row">
            <span class="job-meta-label">Job ID</span>
            <span class="job-meta-value">{jobId.slice(0, 8)}...</span>
          </div>
          {#if runId}
            <div class="job-meta-row">
              <span class="job-meta-label">Run ID</span>
              <span class="job-meta-value">{runId.slice(0, 8)}...</span>
            </div>
          {/if}
        </div>
      {/if}

      {#if errorMessage}
        <div class="job-error-card">
          <div class="job-error-header">Error</div>
          <div class="job-error-message">{errorMessage}</div>
        </div>
      {/if}

      {#if batches.length > 0}
        <div class="job-batches">
          <span class="job-batches-title">Batch Log</span>
          <div class="job-batches-list" bind:this={batchLogRef}>
            {#each batches as batch, index (`${batch.step}-${batch.batchNum}-${index}`)}
              <div
                class="job-batch-item"
                class:job-batch-item-error={batch.rowsProcessed === 0 &&
                  status === 'error'}
              >
                <span class="job-batch-step">{batch.step}</span>
                <span class="job-batch-num">Batch #{batch.batchNum}</span>
                <span class="job-batch-rows">
                  {#if batch.rowsProcessed === 0 && status === 'error'}
                    Failed
                  {:else}
                    {batch.rowsProcessed.toLocaleString()} rows
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="drawer-footer">
      <button class="btn btn-secondary" onclick={onClose}>Close</button>
    </div>
  </div>
{/if}
