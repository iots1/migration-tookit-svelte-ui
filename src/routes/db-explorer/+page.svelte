<script lang="ts">
  import { onMount } from 'svelte';

  import { createDbExplorerState } from '$features/db-explorer/db-store.svelte';

  import '$features/db-explorer/db-explorer.scss';

  const state = createDbExplorerState();

  let selectedDatasourceId = $derived(state.selectedDatasourceId);
  let sql = $derived(state.sql);
  let result = $derived(state.result);
  let datasources = $derived(state.datasources);
  let running = $derived(state.running);
  let error = $derived(state.error);

  onMount(() => {
    void state.fetchDatasources();
  });

  function handleRun() {
    void state.runQuery();
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }

  function formatCell(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
</script>

<svelte:head>
  <title>DB Explorer - Migration Toolkit</title>
</svelte:head>

<div class="db-explorer">
  <div class="db-explorer__toolbar">
    <div
      class="form-group db-explorer__toolbar-select"
      style="margin-bottom: 0;"
    >
      <label class="form-label" for="datasource-select">Datasource</label>
      <select
        id="datasource-select"
        class="form-input"
        disabled={state.loadingDatasources}
        onchange={(e) => {
          const val = (e.target as HTMLSelectElement).value;
          state.selectDatasource(val || null);
        }}
      >
        <option value="" disabled selected={!selectedDatasourceId}>
          {state.loadingDatasources ? 'Loading...' : 'Select a datasource'}
        </option>
        {#each datasources as ds (ds.id)}
          <option value={ds.id} selected={ds.id === selectedDatasourceId}>
            {ds.name} ({ds.db_type} / {ds.dbname})
          </option>
        {/each}
      </select>
    </div>

    <div class="db-explorer__toolbar-actions">
      {#if selectedDatasourceId}
        {#each datasources as ds (ds.id)}
          {#if ds.id === selectedDatasourceId}
            <span class="db-explorer__datasource-badge">
              {ds.host}:{ds.port}
            </span>
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  <div class="db-explorer__editor">
    <div class="db-explorer__editor-header">
      <span class="db-explorer__editor-title">SQL Query</span>
      <div style="display: flex; gap: 8px;">
        <button
          class="btn btn-secondary"
          disabled={!sql.trim()}
          onclick={() => state.setSql('')}
        >
          Clear
        </button>
        <button
          class="btn btn-primary"
          disabled={!selectedDatasourceId || !sql.trim() || running}
          onclick={handleRun}
        >
          {#if running}
            <span
              class="spin"
              style="width: 14px; height: 14px; border-width: 2px;"
            ></span>
            Running...
          {:else}
            Run (Ctrl+Enter)
          {/if}
        </button>
      </div>
    </div>
    <div class="db-explorer__sql-wrapper">
      <textarea
        class="db-explorer__sql"
        placeholder="SELECT * FROM your_table LIMIT 100;"
        value={sql}
        oninput={(e) => state.setSql((e.target as HTMLTextAreaElement).value)}
        onkeydown={handleKeydown}
      ></textarea>
    </div>
  </div>

  {#if error}
    <div class="db-explorer__error">
      <svg
        class="db-explorer__error-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  {#if running}
    <div class="db-explorer__results">
      <div class="db-explorer__results-header">
        <span class="db-explorer__results-title">Results</span>
      </div>
      <div class="db-explorer__loading">
        <span class="spin" style="width: 18px; height: 18px; border-width: 2px;"
        ></span>
        Executing query...
      </div>
    </div>
  {:else if result}
    <div class="db-explorer__results">
      <div class="db-explorer__results-header">
        <span class="db-explorer__results-title">Results</span>
        <div class="db-explorer__results-meta">
          <span class="db-explorer__results-meta-item">
            {result.rowCount} rows
          </span>
          <span class="db-explorer__results-meta-item">
            {result.columns.length} columns
          </span>
          {#if result.truncated}
            <span
              class="db-explorer__results-meta-item"
              style="color: var(--peach-text);"
            >
              Truncated at {result.limit}
            </span>
          {/if}
        </div>
      </div>

      {#if result.rows.length === 0}
        <div class="db-explorer__empty">
          <span style="color: var(--text-muted); font-size: 14px;">
            Query returned no results.
          </span>
        </div>
      {:else}
        <div class="db-explorer__results-body">
          <div class="db-explorer__table-wrapper">
            <table class="db-explorer__table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  {#each result.columns as col (col)}
                    <th>{col}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each result.rows as row, i (i)}
                  <tr>
                    <td style="color: var(--text-muted); font-size: 12px;">
                      {i + 1}
                    </td>
                    {#each result.columns as col (col)}
                      <td>
                        {#if row[col] === null || row[col] === undefined}
                          <span class="db-explorer__null">NULL</span>
                        {:else}
                          {formatCell(row[col])}
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        {#if result.truncated}
          <div class="db-explorer__truncated">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd"
              />
            </svg>
            Results truncated — showing first {result.limit} of all matching rows.
          </div>
        {/if}
      {/if}
    </div>
  {:else if !error}
    <div class="db-explorer__results">
      <div class="db-explorer__results-header">
        <span class="db-explorer__results-title">Results</span>
      </div>
      <div class="db-explorer__empty">
        <div class="db-explorer__empty-icon">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <ellipse cx="10" cy="5" rx="7" ry="3" />
            <path d="M3 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5" />
            <path d="M3 10c0 1.657 3.134 3 7 3s7-1.343 7-3" />
          </svg>
        </div>
        <span class="db-explorer__empty-title">No results yet</span>
        <span class="db-explorer__empty-text">
          Select a datasource, write a SQL query, and press Run to see results.
        </span>
      </div>
    </div>
  {/if}
</div>
