<script lang="ts">
  import type { ConfigItem } from '$core/types/pipeline';
  import { loadConfigs } from '$features/pipeline-editor/api';

  let {
    onSelect,
  }: {
    onSelect: (config: ConfigItem) => void;
  } = $props();

  let open = $state(false);
  let searchQuery = $state('');
  let items = $state<ConfigItem[]>([]);
  let loading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;

  async function fetchConfigs(search?: string) {
    loading = true;
    try {
      items = await loadConfigs({ search: search || undefined, limit: 50 });
    } catch {
      items = [];
    } finally {
      loading = false;
    }
  }

  function handleSearchInput(value: string) {
    searchQuery = value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void fetchConfigs(value);
    }, 300);
  }

  function handleSelect(config: ConfigItem) {
    onSelect(config);
    open = false;
    searchQuery = '';
  }

  $effect(() => {
    if (!open) return;

    void fetchConfigs();

    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.config-dropdown-wrapper')) {
        open = false;
        searchQuery = '';
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  });
</script>

<div class="config-dropdown-wrapper">
  <button
    class="toolbar-btn toolbar-btn-add-config"
    onclick={() => (open = !open)}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span>Add Config</span>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 5l3 3 3-3"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>

  {#if open}
    <div class="config-dropdown">
      <div class="config-dropdown-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
          placeholder="Search configs..."
          value={searchQuery}
          oninput={(e) =>
            handleSearchInput((e.target as HTMLInputElement).value)}
          class="config-search-input"
        />
      </div>
      <div class="config-dropdown-list">
        {#if loading}
          <div class="config-dropdown-empty">Loading...</div>
        {:else if items.length === 0}
          <div class="config-dropdown-empty">No configs found</div>
        {:else}
          {#each items as config (config.id)}
            <button
              class="config-dropdown-item"
              onclick={() => handleSelect(config)}
            >
              <div class="config-item-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
              </div>
              <div class="config-item-info">
                <span class="config-item-name"
                  >{config.attributes.config_name}</span
                >
                <span class="config-item-type"
                  >{config.attributes.table_name}</span
                >
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
