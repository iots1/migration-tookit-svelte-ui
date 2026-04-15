<script lang="ts">
  import type {
    ConfigDetailResponse,
    ConfigSavePayload,
  } from '$core/types/schema-mapper';
  import { getConfig, updateConfig } from '$features/schema-mapper/api';
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
  let configType = $state('std');
  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Store original config data to preserve fields we're not editing
  let originalJsonData = $state('');
  let originalDatasourceSourceId = $state<string | null>(null);
  let originalDatasourceTargetId = $state<string | null>(null);
  let originalGenerateSql = $state<string | null>(null);

  $effect(async () => {
    if (open && configId) {
      loading = true;
      error = null;
      try {
        const loaded = await getConfig(configId);
        config = loaded;
        configName = loaded.config_name;
        tableName = loaded.table_name;
        script = loaded.script ?? '';
        configType = loaded.config_type;
        originalJsonData = loaded.json_data;
        originalDatasourceSourceId = loaded.datasource_source_id;
        originalDatasourceTargetId = loaded.datasource_target_id;
        originalGenerateSql = loaded.generate_sql;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load config';
      } finally {
        loading = false;
      }
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
        generate_sql: originalGenerateSql,
      };

      await updateConfig(configId, payload);
      showToast('บันทึกสำเร็จ');
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
        {/if}

        {#if configType === 'custom'}
          <div class="form-group">
            <label class="form-label" for="edit-script">Script</label>
            <textarea
              id="edit-script"
              class="form-textarea"
              rows="8"
              placeholder="SQL script..."
              bind:value={script}
              disabled={saving}
            ></textarea>
          </div>
        {/if}

        <div class="form-group">
          <span class="form-label">Config Type</span>
          <div class="config-type-display">{configType}</div>
        </div>
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

<style>
  .edit-config-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 12px;
    color: var(--text-secondary);
  }

  .spinner-circle {
    width: 32px;
    height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-inline {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 6px;
  }

  .edit-config-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 12px;
    color: var(--error);
    text-align: center;
  }

  .config-type-display {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
