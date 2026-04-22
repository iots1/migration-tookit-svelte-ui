<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { confirmDialog } from '$lib/confirm-dialog.svelte';
  import { showToast } from '$lib/toast.svelte';

  import '$features/datasource/datasource.scss';

  import { createDatasourcesListState } from '$features/datasource/state/datasource-list-state.svelte';

  const listState = createDatasourcesListState();

  onMount(() => {
    void listState.fetchDatasources();
  });

  async function handleNew() {
    await goto(resolve('/datasources/new'));
  }

  async function handleEdit(id: string) {
    await goto(`/datasources/${id}`);
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = await confirmDialog({
      title: 'Delete Datasource',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    });
    if (!confirmed) return;
    const success = await listState.deleteById(id);
    if (success) {
      showToast('Datasource deleted successfully', 'success');
    }
  }
</script>

<svelte:head>
  <title>Datasources - Migration Toolkit</title>
</svelte:head>

<div class="ds-list-page">
  <div class="ds-list-header">
    <div>
      <h2 class="ds-list-title">Datasources</h2>
      <p class="ds-list-subtitle">Manage your database connections</p>
    </div>
    <button class="btn btn-primary" onclick={handleNew}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v10M3 8h10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span>New Datasource</span>
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
        placeholder="Search datasources..."
        value={listState.searchInput}
        oninput={(e) =>
          listState.setSearchInput((e.target as HTMLInputElement).value)}
        onkeydown={(e) => e.key === 'Enter' && listState.search()}
      />
      {#if listState.searchInput}
        <button
          class="search-clear"
          onclick={listState.clearSearch}
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
    <button class="btn btn-secondary" onclick={listState.search}>Search</button>
  </div>

  {#if listState.error}
    <div class="ds-error-banner">
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
      <span>{listState.error}</span>
      <button
        class="ds-error-close"
        onclick={listState.dismissError}
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

  <div class="ds-table-wrapper">
    {#if listState.loading}
      <div class="pipeline-list-loading">
        <div class="pipeline-loading-spinner"></div>
        <span>Loading...</span>
      </div>
    {:else if listState.datasources.length === 0}
      <div class="pipeline-list-empty">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          class="empty-icon"
        >
          <ellipse
            cx="24"
            cy="18"
            rx="14"
            ry="6"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M10 18v12c0 3.314 6.268 6 14 6s14-2.686 14-6V18"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M10 24c0 3.314 6.268 6 14 6s14-2.686 14-6"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <h3>No datasources yet</h3>
        <p>Create your first database connection to get started</p>
      </div>
    {:else}
      <table class="ds-table">
        <thead>
          <tr>
            <th class="ds-th-name">Name</th>
            <th class="ds-th-type">Type</th>
            <th class="ds-th-host">Host</th>
            <th class="ds-th-db">Database</th>
            <th class="ds-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each listState.datasources as ds (ds.id)}
            <tr>
              <td class="ds-td-name">
                <span class="ds-name-cell">{ds.name}</span>
              </td>
              <td class="ds-th-type">
                <span class="ds-type-badge">{ds.db_type}</span>
              </td>
              <td class="ds-td-host">
                <span class="ds-host-cell">
                  {ds.host}
                  <span class="ds-host-cell-port">:{ds.port}</span>
                </span>
              </td>
              <td class="ds-td-db">{ds.dbname}</td>
              <td class="ds-td-actions">
                <div class="action-group">
                  <button
                    class="action-btn action-btn-edit"
                    onclick={() => handleEdit(ds.id)}
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
                    onclick={() => handleDelete(ds.id, ds.name)}
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

  {#if listState.totalPages > 1}
    <div class="pagination">
      <button
        class="pagination-btn"
        disabled={listState.currentPage <= 1}
        onclick={() => listState.goToPage(listState.currentPage - 1)}
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

      {#each Array.from({ length: listState.totalPages }, (_, i) => i + 1) as page (page)}
        <button
          class="pagination-btn pagination-btn-page"
          class:pagination-btn-active={page === listState.currentPage}
          onclick={() => listState.goToPage(page)}
        >
          {page}
        </button>
      {/each}

      <button
        class="pagination-btn"
        disabled={listState.currentPage >= listState.totalPages}
        onclick={() => listState.goToPage(listState.currentPage + 1)}
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
        {listState.totalRecords} record{listState.totalRecords !== 1 ? 's' : ''}
      </span>
    </div>
  {/if}
</div>
