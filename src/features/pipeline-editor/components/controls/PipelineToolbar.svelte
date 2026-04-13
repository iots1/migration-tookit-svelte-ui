<script lang="ts">
  import type { ConfigItem } from '$core/types/pipeline';

  import ConfigDropdown from './ConfigDropdown.svelte';

  let {
    pipelineName = 'Untitled',
    canUndo = false,
    canRedo = false,
    saving = false,
    running = false,
    configs = [],
    onOpenDrawer,
    onAddConfig,
    onSave,
    onSaveRun,
    onUndo,
    onRedo,
  }: {
    pipelineName?: string;
    canUndo?: boolean;
    canRedo?: boolean;
    saving?: boolean;
    running?: boolean;
    configs?: ConfigItem[];
    onOpenDrawer: () => void;
    onAddConfig: (config: ConfigItem) => void;
    onSave: () => void;
    onSaveRun: () => void;
    onUndo: () => void;
    onRedo: () => void;
  } = $props();
</script>

<div class="pipeline-toolbar">
  <div class="toolbar-left">
    <button class="toolbar-btn toolbar-btn-untitled" onclick={onOpenDrawer}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="2"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M5 6h6M5 8h6M5 10h4"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
      <span>{pipelineName}</span>
    </button>
    <ConfigDropdown {configs} onSelect={onAddConfig} />
  </div>

  <div class="toolbar-center">
    <button class="toolbar-btn" onclick={onUndo} disabled={!canUndo}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 6h7a3 3 0 110 6H7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6 3L3 6l3 3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Undo</span>
    </button>
    <button class="toolbar-btn" onclick={onRedo} disabled={!canRedo}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M13 6H6a3 3 0 100 6h3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10 3l3 3-3 3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Redo</span>
    </button>
  </div>

  <div class="toolbar-right">
    <button class="toolbar-btn" onclick={onSave} disabled={saving || running}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h10v10H3z" stroke="currentColor" stroke-width="1.5" />
        <path
          d="M6 8l1.5 1.5L10 7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Save</span>
    </button>

    <button
      class="toolbar-btn toolbar-btn-accent"
      onclick={onSaveRun}
      disabled={saving || running}
    >
      {#if saving || running}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          class="spin"
        >
          <path
            d="M14 8A6 6 0 112 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M14 8A6 6 0 002 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            opacity="0.3"
          />
        </svg>
        <span>{saving ? 'Saving...' : 'Running...'}</span>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 2l8 6-8 6V2z" fill="currentColor" />
        </svg>
        <span>Save & Run Job</span>
      {/if}
    </button>
  </div>
</div>
