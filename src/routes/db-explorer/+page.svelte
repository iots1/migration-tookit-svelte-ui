<script lang="ts">
  import { onMount, tick } from 'svelte';

  import type { ColumnItem } from '$core/types/db-explorer';
  import SqlEditor, {
    type SqlEditorSchemaTable,
  } from '$features/db-explorer/components/SqlEditor.svelte';
  import TabContextMenu, {
    type ContextMenuItem,
  } from '$features/db-explorer/components/TabContextMenu.svelte';
  import { createDbExplorerState } from '$features/db-explorer/db-store.svelte';

  import type { SqlLanguage } from 'sql-formatter';

  import '$features/db-explorer/db-explorer.scss';

  const explorer = createDbExplorerState();

  let selectedDatasourceId = $derived(explorer.selectedDatasourceId);
  let sql = $derived(explorer.sql);
  let results = $derived(explorer.results);
  let datasources = $derived(explorer.datasources);
  let running = $derived(explorer.running);
  let error = $derived(explorer.error);
  let tables = $derived(explorer.tables);
  let loadingTables = $derived(explorer.loadingTables);
  let expandedTables = $derived(explorer.expandedTables);
  let loadingColumns = $derived(explorer.loadingColumns);
  let defaultLimit = $derived(explorer.defaultLimit);
  let activeDatasource = $derived(explorer.activeDatasource);
  let tabs = $derived(explorer.tabs);
  let activeTabId = $derived(explorer.activeTabId);
  let globalError = $derived(explorer.globalError);

  let editorSchema = $derived<SqlEditorSchemaTable[]>(
    tables.map((table) => ({
      name: table.name,
      columns: (expandedTables[table.name] ?? []).map((col) => ({
        name: col.name,
        type: col.dataType,
      })),
    }))
  );

  let sqlDialect = $derived<SqlLanguage>(
    activeDatasource?.db_type === 'mssql' ||
      activeDatasource?.db_type === 'sqlserver'
      ? 'tsql'
      : activeDatasource?.db_type === 'postgresql'
        ? 'postgresql'
        : activeDatasource?.db_type === 'mysql'
          ? 'mysql'
          : 'sql'
  );

  onMount(() => {
    void explorer.fetchDatasources();
  });

  function handleRun() {
    void explorer.runQuery();
  }

  function handleTableDblClick(tableName: string) {
    void explorer.openAndRunTableQuery(tableName);
  }

  function formatCell(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  // --- Column display helpers ---

  /** Shorten verbose Postgres type names for compact display */
  function abbreviateType(type: string): string {
    return type
      .replace('character varying', 'varchar')
      .replace('timestamp with time zone', 'timestamptz')
      .replace('timestamp without time zone', 'timestamp')
      .replace('double precision', 'float8')
      .replace('character', 'char')
      .replace('boolean', 'bool');
  }

  function hasConstraintType(col: ColumnItem, constraintType: string): boolean {
    return col.constraints.some((c) => c.type === constraintType);
  }

  function hasNonPrimaryIndex(col: ColumnItem): boolean {
    return col.indexes.some((idx) => !idx.primary);
  }

  /** Tooltip with full column metadata */
  function columnTooltip(col: ColumnItem): string {
    const parts: string[] = [`Type: ${col.dataType}`];
    if (col.length !== null) parts.push(`Length: ${col.length}`);
    if (col.precision !== null) parts.push(`Precision: ${col.precision}`);
    if (col.scale !== null) parts.push(`Scale: ${col.scale}`);
    parts.push(`Nullable: ${col.nullable ? 'yes' : 'no'}`);
    if (col.columnDefault !== null) parts.push(`Default: ${col.columnDefault}`);
    if (col.constraints.length > 0) {
      parts.push(
        `Constraints: ${col.constraints.map((c) => c.type).join(', ')}`
      );
    }
    return parts.join('\n');
  }

  let contextMenuVisible = $state(false);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);
  let contextMenuTabId = $state('');
  let renamingTabId = $state('');
  let renameInputEl = $state<HTMLInputElement | undefined>(undefined);

  function handleTabMenuClick(e: MouseEvent, tabId: string) {
    e.stopPropagation();
    // Toggle: clicking the same tab's menu button closes it
    if (contextMenuVisible && contextMenuTabId === tabId) {
      contextMenuVisible = false;
      return;
    }
    const target = e.currentTarget as HTMLButtonElement;
    const rect = target.getBoundingClientRect();
    contextMenuTabId = tabId;
    contextMenuX = rect.left;
    contextMenuY = rect.bottom + 2;
    contextMenuVisible = true;
  }

  function closeContextMenu() {
    contextMenuVisible = false;
  }

  function startRename(tabId: string) {
    renamingTabId = tabId;
    closeContextMenu();
    void tick().then(() => {
      if (renameInputEl) {
        renameInputEl.focus();
        renameInputEl.select();
      }
    });
  }

  function finishRename(tabId: string) {
    if (renameInputEl) {
      const val = renameInputEl.value.trim();
      if (val) {
        explorer.renameTab(tabId, val);
      }
    }
    renamingTabId = '';
  }

  function cancelRename() {
    renamingTabId = '';
  }

  let tableFilter = $state('');

  let filteredTables = $derived(() => {
    if (!tableFilter.trim()) return tables;
    const filter = tableFilter.toLowerCase();
    return tables.filter((table) => table.name.toLowerCase().includes(filter));
  });

  let contextMenuItems = $derived<ContextMenuItem[]>([
    {
      label: 'New Query Tab',
      action: () => explorer.addTab(),
    },
    { label: '', action: () => {}, separator: true },
    {
      label: 'Rename',
      action: () => startRename(contextMenuTabId),
    },
    {
      label: 'Close Tab',
      action: () => explorer.removeTab(contextMenuTabId),
      disabled: tabs.length <= 1,
    },
    {
      label: 'Close Other Tabs',
      action: () => explorer.closeOtherTabs(contextMenuTabId),
      disabled: tabs.length <= 1,
    },
    {
      label: 'Close All Tabs',
      action: () => explorer.closeAllTabs(),
      disabled: tabs.length <= 1,
    },
  ]);
</script>

<svelte:head>
  <title>DB Explorer - Migration Toolkit</title>
</svelte:head>

<div class="db-explorer-layout">
  <aside class="db-explorer__sidebar">
    <div class="db-explorer__sidebar-header">
      <span class="db-explorer__sidebar-label">Datasource</span>
      <select
        class="form-input"
        disabled={explorer.loadingDatasources}
        onchange={(e) => {
          const val = (e.target as HTMLSelectElement).value;
          explorer.selectDatasource(val || null);
        }}
      >
        <option value="" disabled selected={!selectedDatasourceId}>
          {explorer.loadingDatasources ? 'Loading...' : 'Select a datasource'}
        </option>
        {#each datasources as ds (ds.id)}
          <option value={ds.id} selected={ds.id === selectedDatasourceId}>
            {ds.name}
          </option>
        {/each}
      </select>
      {#if activeDatasource}
        <span class="db-explorer__datasource-badge">
          {activeDatasource.host}:{activeDatasource.port}
        </span>
      {/if}
    </div>

    {#if globalError}
      <div class="db-explorer__global-error">
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
        <span>{globalError}</span>
      </div>
    {/if}

    {#if selectedDatasourceId}
      {#if loadingTables}
        <div class="db-explorer__loading">
          <span class="spin"></span>
          Loading tables...
        </div>
      {:else}
        <div
          class="db-explorer__sidebar-label db-explorer__sidebar-label--tables"
        >
          Tables ({tables.length})
        </div>
        <input
          class="form-input db-explorer__table-filter"
          type="text"
          placeholder="Filter tables..."
          bind:value={tableFilter}
        />
        {#each filteredTables() as table (table.name)}
          <button
            class="db-explorer__tree-item {expandedTables[table.name]
              ? 'db-explorer__tree-item--expanded'
              : ''}"
            onclick={() => explorer.toggleTableColumns(table.name)}
            ondblclick={() => handleTableDblClick(table.name)}
          >
            <svg
              class="db-explorer__tree-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              {#if expandedTables[table.name]}
                <path d="M4 6l4 4 4-4" />
              {:else}
                <path d="M6 4l4 4-4 4" />
              {/if}
            </svg>
            <svg
              class="db-explorer__tree-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="2" y="3" width="12" height="10" rx="1" />
              <path d="M2 6h12" />
            </svg>
            <span>{table.name}</span>
          </button>

          {#if expandedTables[table.name]}
            <div class="db-explorer__tree-children">
              {#each expandedTables[table.name] as col (col.name)}
                <button
                  class="db-explorer__tree-item db-explorer__tree-item--column"
                  title={columnTooltip(col)}
                  onclick={() => explorer.insertColumnName(col.name)}
                >
                  <!-- column icon: key for PK, circle for others -->
                  {#if col.primaryKey}
                    <svg
                      class="db-explorer__tree-icon db-explorer__tree-icon--pk"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <circle cx="6" cy="8" r="3" />
                      <path d="M9 8h5M12 6v4" />
                    </svg>
                  {:else}
                    <svg
                      class="db-explorer__tree-icon db-explorer__tree-icon--col"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <circle cx="8" cy="8" r="2.5" />
                    </svg>
                  {/if}

                  <div class="db-explorer__column-info">
                    <div class="db-explorer__column-main">
                      <span class="db-explorer__column-name">{col.name}</span>
                      <div class="db-explorer__column-badges">
                        {#if col.primaryKey}
                          <span
                            class="db-explorer__column-badge db-explorer__column-badge--pk"
                            >PK</span
                          >
                        {/if}
                        {#if hasConstraintType(col, 'UNIQUE')}
                          <span
                            class="db-explorer__column-badge db-explorer__column-badge--uq"
                            >UQ</span
                          >
                        {/if}
                        {#if hasConstraintType(col, 'FOREIGN KEY')}
                          <span
                            class="db-explorer__column-badge db-explorer__column-badge--fk"
                            >FK</span
                          >
                        {/if}
                        {#if hasNonPrimaryIndex(col) && !col.primaryKey && !hasConstraintType(col, 'UNIQUE')}
                          <span
                            class="db-explorer__column-badge db-explorer__column-badge--idx"
                            >IDX</span
                          >
                        {/if}
                        {#if col.nullable}
                          <span
                            class="db-explorer__column-badge db-explorer__column-badge--null"
                            title="Nullable">?</span
                          >
                        {/if}
                      </div>
                      <span class="db-explorer__column-type"
                        >{abbreviateType(col.dataType)}</span
                      >
                    </div>
                    {#if col.comment}
                      <div class="db-explorer__column-comment">
                        {col.comment}
                      </div>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {:else if loadingColumns[table.name]}
            <div class="db-explorer__tree-children">
              <div class="db-explorer__loading db-explorer__loading--sm">
                <span
                  class="spin"
                  style="width: 12px; height: 12px; border-width: 2px;"
                ></span>
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    {:else}
      <div class="db-explorer__sidebar-hint">
        Select a datasource to browse schema
      </div>
    {/if}
  </aside>

  <main class="db-explorer__main">
    <!-- Tab Bar -->
    <div class="db-explorer__tab-bar" role="tablist">
      {#each tabs as tab (tab.id)}
        <div
          class="db-explorer__tab {tab.id === activeTabId
            ? 'db-explorer__tab--active'
            : ''}"
          role="tab"
          tabindex="0"
          aria-selected={tab.id === activeTabId}
          onclick={() => explorer.selectTab(tab.id)}
          onkeydown={(e) => {
            if (e.key === 'Enter') explorer.selectTab(tab.id);
          }}
        >
          {#if renamingTabId === tab.id}
            <input
              bind:this={renameInputEl}
              class="db-explorer__tab-rename-input"
              type="text"
              value={tab.title}
              onblur={() => finishRename(tab.id)}
              onkeydown={(e) => {
                if (e.key === 'Enter') finishRename(tab.id);
                if (e.key === 'Escape') cancelRename();
              }}
            />
          {:else}
            <span class="db-explorer__tab-title">{tab.title}</span>
          {/if}
          <!-- ⋯ menu button: click → dropdown (no right-click dependency) -->
          <button
            class="db-explorer__tab-menu-btn"
            type="button"
            aria-label="Tab options"
            aria-expanded={contextMenuVisible && contextMenuTabId === tab.id}
            onclick={(e) => handleTabMenuClick(e, tab.id)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 4"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="14" cy="2" r="1.5" />
            </svg>
          </button>
          {#if tabs.length > 1}
            <button
              class="db-explorer__tab-close"
              type="button"
              aria-label="Close tab"
              onclick={(e) => {
                e.stopPropagation();
                explorer.removeTab(tab.id);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          {/if}
        </div>
      {/each}
      <button
        class="db-explorer__tab-add"
        type="button"
        aria-label="Add new tab"
        onclick={() => explorer.addTab()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M7 1v12M1 7h12" />
        </svg>
      </button>
    </div>

    <!-- Editor Pane -->
    <div class="db-explorer__editor-pane">
      <div class="db-explorer__editor">
        <div class="db-explorer__editor-header">
          <span class="db-explorer__editor-title">SQL Query</span>
          <div class="db-explorer__editor-actions">
            <label class="db-explorer__limit-label" for="default-limit-input">
              Limit
            </label>
            <input
              id="default-limit-input"
              class="form-input db-explorer__limit-input"
              type="number"
              min={1}
              value={defaultLimit}
              onchange={(e) =>
                explorer.setDefaultLimit(
                  Number.parseInt((e.target as HTMLInputElement).value, 10)
                )}
            />
            <button
              class="btn btn-secondary"
              disabled={!sql.trim() && results.length === 0 && !error}
              onclick={() => {
                explorer.setSql('');
                explorer.clearResults();
              }}
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
                Run (⌘/Ctrl+Enter)
              {/if}
            </button>
          </div>
        </div>
        <SqlEditor
          value={sql}
          onchange={(v: string) => explorer.setSql(v)}
          schema={editorSchema}
          dialect={sqlDialect}
          onrun={handleRun}
        />
      </div>
      {#if error}
        <div class="db-explorer__error db-explorer__error--pane">
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
    </div>

    <!-- Results Pane -->
    <div class="db-explorer__results-pane">
      {#if running}
        <div class="db-explorer__loading">
          <span
            class="spin"
            style="width: 18px; height: 18px; border-width: 2px;"
          ></span>
          Executing query...
        </div>
      {:else if results.length > 0}
        {#each results as result, index (index)}
          <div class="db-explorer__result-grid">
            <div class="db-explorer__results-header">
              <span class="db-explorer__results-title">
                Result {index + 1}
              </span>
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
              <div class="db-explorer__empty db-explorer__empty--sm">
                Query returned no results.
              </div>
            {:else}
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
                        <td class="db-explorer__row-number">
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
            {/if}

            {#if result.truncated}
              <div class="db-explorer__truncated">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clip-rule="evenodd"
                  />
                </svg>
                Results truncated — showing first {result.limit} of all matching rows.
              </div>
            {/if}
          </div>
        {/each}
      {:else if !error}
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
            Select a datasource, write a SQL query, and press Run to see
            results.
          </span>
        </div>
      {/if}
    </div>
  </main>

  <TabContextMenu
    visible={contextMenuVisible}
    x={contextMenuX}
    y={contextMenuY}
    items={contextMenuItems}
    onclose={closeContextMenu}
  />
</div>
