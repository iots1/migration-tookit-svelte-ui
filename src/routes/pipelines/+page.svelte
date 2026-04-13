<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import '$features/pipeline-editor/pipeline-editor.scss';

  import { createPipelinesListState } from '$features/pipeline-editor/state/pipelines-list-state.svelte';

  const state = createPipelinesListState();

  onMount(() => {
    void state.fetchPipelines();
  });

  async function handleNewPipeline() {
    await goto(resolve('/pipeline-editor'));
  }

  async function handleEdit(id: string) {
    await goto(resolve('/pipeline-editor/[uuid]', { uuid: id }));
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this pipeline?')) return;
    await state.deleteById(id);
  }
</script>

<svelte:head>
  <title>Pipelines - Migration Toolkit</title>
</svelte:head>

<div class="pipeline-list-page">
  <div class="pipeline-list-header">
    <div>
      <h2 class="pipeline-list-title">Pipelines</h2>
      <p class="pipeline-list-subtitle">Manage your data migration pipelines</p>
    </div>
    <button class="btn btn-primary" onclick={handleNewPipeline}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v10M3 8h10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span>New Pipeline</span>
    </button>
  </div>

  <div class="pipeline-list-search">
    <div class="search-input-wrapper">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        class="search-icon"
      >
        <circle
          cx="7"
          cy="7"
          r="4.5"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M10.5 10.5L14 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Search pipelines..."
        value={state.searchInput}
        oninput={(e) =>
          state.setSearchInput((e.target as HTMLInputElement).value)}
        onkeydown={(e) => e.key === 'Enter' && state.search()}
      />
      {#if state.searchInput}
        <button
          class="search-clear"
          onclick={state.clearSearch}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      {/if}
    </div>
    <button class="btn btn-secondary" onclick={state.search}>Search</button>
  </div>

  {#if state.error}
    <div class="pipeline-error">
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
      <span>{state.error}</span>
      <button
        class="pipeline-error-close"
        onclick={state.dismissError}
        aria-label="Dismiss error"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  {/if}

  <div class="pipeline-table-wrapper">
    {#if state.loading}
      <div class="pipeline-list-loading">
        <div class="pipeline-loading-spinner"></div>
        <span>Loading...</span>
      </div>
    {:else if state.pipelines.length === 0}
      <div class="pipeline-list-empty">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          class="empty-icon"
        >
          <rect
            x="6"
            y="6"
            width="16"
            height="16"
            rx="4"
            stroke="currentColor"
            stroke-width="2"
          />
          <rect
            x="26"
            y="26"
            width="16"
            height="16"
            rx="4"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M22 14h4l6 6v4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle
            cx="26"
            cy="20"
            r="3"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <h3>No pipelines yet</h3>
        <p>Create your first pipeline to get started</p>
      </div>
    {:else}
      <table class="pipeline-table">
        <thead>
          <tr>
            <th class="th-name">Name</th>
            <th class="th-desc">Description</th>
            <th class="th-meta">Nodes</th>
            <th class="th-meta">Edges</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each state.pipelines as pipeline (pipeline.id)}
            <tr>
              <td class="td-name">
                <span class="pipeline-name-cell">{pipeline.name}</span>
              </td>
              <td class="td-desc">
                <span class="pipeline-desc-cell"
                  >{pipeline.description || '-'}</span
                >
              </td>
              <td class="td-meta">{pipeline.nodes_count}</td>
              <td class="td-meta">{pipeline.edges_count}</td>
              <td class="td-actions">
                <div class="action-group">
                  <button
                    class="action-btn action-btn-edit"
                    onclick={() => handleEdit(pipeline.id)}
                    title="Edit"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      ></path>
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="action-btn action-btn-delete"
                    onclick={() => handleDelete(pipeline.id)}
                    title="Delete"
                  >
                    <svg
                      width="18"
                      height="18"
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
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  {#if state.totalPages > 1}
    <div class="pagination">
      <button
        class="pagination-btn"
        disabled={state.currentPage <= 1}
        onclick={() => state.goToPage(state.currentPage - 1)}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M9 3L4 7l5 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      {#each Array.from({ length: state.totalPages }, (_, i) => i + 1) as page (page)}
        <button
          class="pagination-btn pagination-btn-page"
          class:pagination-btn-active={page === state.currentPage}
          onclick={() => state.goToPage(page)}
        >
          {page}
        </button>
      {/each}

      <button
        class="pagination-btn"
        disabled={state.currentPage >= state.totalPages}
        onclick={() => state.goToPage(state.currentPage + 1)}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5 3l5 4-5 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <span class="pagination-info">
        {state.totalRecords} record{state.totalRecords !== 1 ? 's' : ''}
      </span>
    </div>
  {/if}
</div>
