<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  import type {
    TransformerOption,
    ValidatorOption,
  } from '$core/types/schema-mapper';

  interface Props {
    open: boolean;
    title: string;
    type: 'transformers' | 'validators';
    items: Array<TransformerOption | ValidatorOption>;
    selected: string[];
    onClose: () => void;
    onApply: (selected: string[]) => void;
  }

  let { open, title, type, items, selected, onClose, onApply }: Props =
    $props();

  let searchQuery = $state('');
  let localSelected = new SvelteSet<string>();
  let currentCategory = $state<string | null>(null);

  $effect(() => {
    if (open) {
      localSelected.clear();
      for (const s of selected) {
        localSelected.add(s);
      }
      searchQuery = '';
      currentCategory = null;
    }
  });

  const categories = $derived(
    type === 'transformers'
      ? ['text', 'dates', 'healthcare', 'names', 'data_type', 'lookup']
      : undefined
  );

  const filteredItems = $derived.by(() => {
    let result = items;

    if (type === 'transformers' && currentCategory) {
      result = result.filter((item) =>
        'category' in item ? item.category === currentCategory : false
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return result;
  });

  function toggleItem(name: string) {
    if (localSelected.has(name)) {
      localSelected.delete(name);
    } else {
      localSelected.add(name);
    }
  }

  function handleApply() {
    onApply(Array.from(localSelected));
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  function handleClearAll() {
    localSelected.clear();
  }
</script>

{#if open}
  <div
    class="drawer-overlay drawer-overlay-open"
    role="presentation"
    onclick={handleCancel}
  ></div>
  <div class="drawer drawer-open">
    <div class="drawer-header">
      <h3 class="drawer-title">{title}</h3>
      <button class="drawer-close" onclick={handleCancel} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 4l12 12M16 4l-12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="drawer-body">
      <!-- Search -->
      <div class="form-group" style="margin-bottom: 16px;">
        <div class="item-selector-search-wrapper">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            class="item-selector-search-icon"
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
            class="form-input"
            placeholder="Search..."
            value={searchQuery}
            oninput={(e) =>
              (searchQuery = (e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <!-- Category Filter for Transformers -->
      {#if type === 'transformers' && categories}
        <div class="form-group" style="margin-bottom: 16px;">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="form-label">Category</label>
          <div class="category-pills">
            <button
              class="category-pill"
              class:category-pill--active={currentCategory === null}
              onclick={() => (currentCategory = null)}
            >
              All
            </button>
            {#each categories as cat (cat)}
              <button
                class="category-pill"
                class:category-pill--active={currentCategory === cat}
                onclick={() => (currentCategory = cat)}
              >
                {cat}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Selected Count -->
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 12px; background-color: var(--bg-secondary); border-radius: 6px;"
      >
        <span style="font-size: 13px; color: var(--text-secondary);">
          {localSelected.size} selected
        </span>
        {#if localSelected.size > 0}
          <button
            class="btn"
            style="padding: 4px 8px; font-size: 12px; color: var(--peach-text);"
            onclick={handleClearAll}
          >
            Clear All
          </button>
        {/if}
      </div>

      <!-- Items List -->
      <div class="items-list">
        {#if filteredItems.length === 0}
          <div class="item-selector-empty">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              style="color: var(--text-muted); margin-bottom: 8px;"
            >
              <circle
                cx="16"
                cy="16"
                r="12"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M16 10v6M16 18v.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <p style="color: var(--text-secondary); font-size: 13px;">
              No items found
            </p>
          </div>
        {:else}
          {#each filteredItems as item (item.name)}
            {@const itemName = item.name}
            <div
              class="item-row"
              class:item-row--selected={localSelected.has(itemName)}
              role="option"
              aria-selected={localSelected.has(itemName)}
              tabindex="0"
              onclick={() => toggleItem(itemName)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleItem(itemName);
                }
              }}
            >
              <div class="item-checkbox">
                <input
                  type="checkbox"
                  checked={localSelected.has(itemName)}
                  onchange={(e) => {
                    e.stopPropagation();
                    toggleItem(itemName);
                  }}
                />
              </div>
              <div class="item-content">
                <div class="item-header">
                  <span class="item-name">{item.label}</span>
                  {#if 'has_params' in item && item.has_params}
                    <span class="param-badge">Params</span>
                  {/if}
                </div>
                <div class="item-description">{item.description}</div>
                <div class="item-code">{itemName}</div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="drawer-footer">
      <button class="btn btn-secondary" onclick={handleCancel}>Cancel</button>
      <button class="btn btn-primary" onclick={handleApply}>
        Apply ({localSelected.size})
      </button>
    </div>
  </div>
{/if}
