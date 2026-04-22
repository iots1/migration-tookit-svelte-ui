<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { confirmDialog } from '$lib/confirm-dialog.svelte';
  import { showToast } from '$lib/toast.svelte';

  import '$features/schema-mapper/schema-mapper.scss';

  import { duplicateConfig } from '$features/schema-mapper/api';
  import { createConfigsListState } from '$features/schema-mapper/state/configs-list-state.svelte';

  const listState = createConfigsListState();

  let searchDebounce: ReturnType<typeof setTimeout>;
  let duplicatingId: string | null = $state(null);

  function handleSearchInput(value: string) {
    listState.setSearchInput(value);
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => listState.search(), 300);
  }

  onMount(() => {
    void listState.fetchConfigs();
  });

  async function handleNew() {
    await goto(resolve('/configs/new'));
  }

  async function handleEdit(uuid: string) {
    await goto(`/configs/${uuid}`);
  }

  async function handleDelete(uuid: string) {
    const confirmed = await confirmDialog({
      title: 'Delete Config',
      description:
        'Are you sure you want to delete this config? This action cannot be undone.',
    });
    if (!confirmed) return;
    const success = await listState.deleteById(uuid);
    if (success) {
      showToast('Config deleted successfully', 'success');
    }
  }

  async function handleDuplicate(uuid: string, name: string) {
    const confirmed = await confirmDialog({
      type: 'duplicate',
      title: 'Duplicate Config',
      description: `Create a copy of "${name}"?`,
    });
    if (!confirmed) return;
    duplicatingId = uuid;
    try {
      await duplicateConfig(uuid);
      showToast(`Duplicated "${name}" successfully`, 'success');
      await listState.fetchConfigs();
    } catch (err) {
      showToast('Failed to duplicate config', 'error');
      console.error('Duplicate config error:', err);
    } finally {
      duplicatingId = null;
    }
  }

  function formatDate(iso: string): string {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }
</script>

<svelte:head>
  <title>Schema Mapper - Migration Toolkit</title>
</svelte:head>

<div class="sm-list-page">
  <div class="sm-list-header">
    <div>
      <h2 class="sm-list-title">Schema Mapper</h2>
      <p class="sm-list-subtitle">Manage field mapping configurations</p>
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
      <span>New Config</span>
    </button>
  </div>

  <SearchBar
    value={listState.searchInput}
    placeholder="Search configs..."
    onInput={handleSearchInput}
    onSearch={listState.search}
    onClear={listState.clearSearch}
  />

  {#if listState.error}
    <ErrorBanner message={listState.error} onDismiss={listState.dismissError} />
  {/if}

  <div class="pipeline-table-wrapper">
    {#if listState.loading}
      <div class="pipeline-list-loading">
        <div class="pipeline-loading-spinner"></div>
        <span>Loading...</span>
      </div>
    {:else if listState.configs.length === 0}
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
        <h3>No configs yet</h3>
        <p>Create your first field mapping config to get started</p>
      </div>
    {:else}
      <table class="pipeline-table">
        <thead>
          <tr>
            <th class="th-name">Config Name</th>
            <th>Source &rarr; Target</th>
            <th>Type</th>
            <th class="th-meta">Mappings</th>
            <th>Updated</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each listState.configs as config (config.id)}
            <tr>
              <td class="td-name">
                <span class="pipeline-name-cell">{config.config_name}</span>
              </td>
              <td>
                {#if config.config_type === 'custom'}
                  <span class="sm-flow-text">
                    <span>
                      {#if config.datasource_target_name}
                        <span style="color: var(--text-muted);"
                          >{config.datasource_target_name} ({config.datasource_target_db_type ||
                            '-'})</span
                        >
                      {:else}
                        <span style="color: var(--text-muted);">-</span>
                      {/if}
                    </span>
                  </span>
                {:else}
                  <span class="sm-flow-text">
                    <span>
                      {#if config.source_datasource}
                        <span style="color: var(--text-muted);"
                          >{config.source_datasource}.</span
                        >
                      {/if}{config.source_table || '-'}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M9 4l3 3-3 3"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>
                      {#if config.target_datasource}
                        <span style="color: var(--text-muted);"
                          >{config.target_datasource}.</span
                        >
                      {/if}{config.target_table || '-'}
                    </span>
                  </span>
                {/if}
              </td>
              <td>
                <span class="sm-type-badge sm-type-badge--{config.config_type}">
                  {config.config_type}
                </span>
              </td>
              <td class="td-meta">
                <span class="sm-mapping-count">{config.mapping_count}</span>
              </td>
              <td style="color: var(--text-secondary); font-size: 13px;">
                {formatDate(config.updated_at)}
              </td>
              <td class="td-actions">
                <div class="action-group">
                  <button
                    class="action-btn action-btn-edit"
                    onclick={() => handleEdit(config.id)}
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
                    class="action-btn action-btn-duplicate"
                    onclick={() =>
                      handleDuplicate(config.id, config.config_name)}
                    title="Duplicate"
                    disabled={duplicatingId === config.id}
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                      ></rect>
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="action-btn action-btn-delete"
                    onclick={() => handleDelete(config.id)}
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

  <Pagination
    currentPage={listState.currentPage}
    totalPages={listState.totalPages}
    totalRecords={listState.totalRecords}
    onPageChange={listState.goToPage}
  />
</div>
