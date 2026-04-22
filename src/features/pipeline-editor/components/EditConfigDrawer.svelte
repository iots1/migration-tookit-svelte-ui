<script lang="ts">
  import type {
    ConfigDetailResponse,
    ConfigSavePayload,
  } from '$core/types/schema-mapper';
  import SqlEditor from '$features/db-explorer/components/SqlEditor.svelte';
  import { getConfig, updateConfig } from '$features/schema-mapper/api';
  import JsonViewer from '$lib/components/JsonViewer.svelte';
  import { showToast } from '$lib/toast.svelte';

  let {
    open,
    configId,
    onClose,
    onSaved,
  }: {
    open: boolean;
    configId: string | null;
    onClose: () => void;
    onSaved: (configId: string) => Promise<void>;
  } = $props();

  let config = $state<ConfigDetailResponse | null>(null);
  let configName = $state('');
  let tableName = $state('');
  let script = $state('');
  let generateSql = $state('');
  let configType = $state('std');
  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Store original config data to preserve fields we're not editing
  let originalJsonData = $state('');
  let originalDatasourceSourceId = $state<string | null>(null);
  let originalDatasourceTargetId = $state<string | null>(null);

  async function loadConfig(id: string) {
    loading = true;
    error = null;
    try {
      const loaded = await getConfig(id);
      config = loaded;
      configName = loaded.config_name;
      tableName = loaded.table_name;
      script = loaded.script ?? '';
      generateSql = loaded.generate_sql ?? '';
      configType = loaded.config_type;
      originalJsonData =
        typeof loaded.json_data === 'string'
          ? loaded.json_data
          : JSON.stringify(loaded.json_data);
      originalDatasourceSourceId = loaded.datasource_source_id;
      originalDatasourceTargetId = loaded.datasource_target_id;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load config';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (open && configId) {
      void loadConfig(configId);
    }
  });

  async function handleSave() {
    if (!configId || !config) return;

    saving = true;
    error = null;
    try {
      const payload: ConfigSavePayload = {
        config_name: configName,
        table_name: tableName,
        json_data: originalJsonData,
        datasource_source_id: originalDatasourceSourceId,
        datasource_target_id: originalDatasourceTargetId,
        config_type: configType,
        script: configType === 'custom' ? script : null,
        generate_sql: configType === 'std' ? generateSql.trim() || null : null,
      };

      await updateConfig(configId, payload);
      showToast('Saved successfully');
      await onSaved(configId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save config';
    } finally {
      saving = false;
    }
  }

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
    aria-label="Edit Config"
    tabindex="-1"
    onclick={handleDrawerClick}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="drawer-header">
      <h3 class="drawer-title">Edit Config</h3>
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
      {#if loading}
        <div class="edit-config-spinner">
          <div class="spinner-circle"></div>
          <span>Loading...</span>
        </div>
      {:else if error}
        <div class="edit-config-error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M10 6v4M10 13v.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <span>{error}</span>
        </div>
      {:else}
        <div class="form-group">
          <label class="form-label" for="edit-config-name">Config Name</label>
          <input
            id="edit-config-name"
            type="text"
            class="form-input"
            placeholder="Config name..."
            bind:value={configName}
            disabled={saving}
          />
        </div>

        <div class="form-group">
          <span class="form-label">Config Type</span>
          <div class="config-type-display">{configType}</div>
        </div>

        {#if configType === 'std'}
          <div class="form-group">
            <label class="form-label" for="edit-table-name">Table Name</label>
            <input
              id="edit-table-name"
              type="text"
              class="form-input"
              placeholder="Table name..."
              bind:value={tableName}
              disabled={saving}
            />
          </div>

          <div class="form-group">
            <span class="form-label">Config Data (JSON)</span>
            <JsonViewer
              value={originalJsonData}
              onValueChange={(v: string) => {
                originalJsonData = v;
              }}
            />
          </div>

          <div class="form-group">
            <span class="form-label">Generate SQL</span>
            <div class="edit-config-sql-editor">
              <SqlEditor
                value={generateSql}
                onchange={(v) => (generateSql = String(v))}
              />
            </div>
          </div>
        {/if}

        {#if configType === 'custom'}
          <div class="form-group">
            <span class="form-label">SQL Script</span>
            <div class="edit-config-sql-editor">
              <SqlEditor
                value={script}
                onchange={(v) => (script = String(v))}
              />
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <div class="drawer-footer">
      <button class="btn btn-secondary" onclick={onClose} disabled={saving}
        >Cancel</button
      >
      <button
        class="btn btn-primary"
        onclick={handleSave}
        disabled={saving || loading}
      >
        {#if saving}
          <span class="spinner-inline"></span>
        {/if}
        Save
      </button>
    </div>
  </div>
{/if}
