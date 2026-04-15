<script lang="ts">
  interface Props {
    items: string[];
    limit?: number;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    class?: string;
  }

  let {
    items,
    limit = 3,
    color = 'blue',
    class: className = '',
  }: Props = $props();

  const visibleItems = $derived(items.slice(0, limit));
  const remainingCount = $derived(Math.max(0, items.length - limit));
  const hasOverflow = $derived(remainingCount > 0);

  let showTooltip = $state(false);
  let tooltipEl = $state<HTMLElement>();

  function handleMouseEnter() {
    if (hasOverflow) {
      showTooltip = true;
    }
  }

  function handleMouseLeave() {
    showTooltip = false;
  }

  const badgeColors = {
    blue: 'background-color: var(--blue-bg); color: var(--blue-text);',
    green: 'background-color: var(--green-bg); color: var(--green-text);',
    purple: 'background-color: var(--purple-bg); color: var(--purple-text);',
    orange: 'background-color: var(--orange-bg); color: var(--orange-text);',
    red: 'background-color: var(--peach-bg); color: var(--peach-text);',
  };
</script>

<div
  class="badge-list {className}"
  style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;"
>
  {#each visibleItems as item (item)}
    <span
      class="badge"
      style={badgeColors[color]}
      title={!hasOverflow ? item : ''}
    >
      {item}
    </span>
  {/each}

  {#if hasOverflow}
    <div
      role="group"
      style="position: relative; display: inline-block;"
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
    >
      <span
        bind:this={tooltipEl}
        class="badge badge-overflow"
        style="background-color: var(--bg-secondary); color: var(--text-secondary); cursor: help;"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle
            cx="6"
            cy="6"
            r="5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M6 3v3.5M6 8.5v.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        +{remainingCount}
      </span>

      {#if showTooltip}
        <div class="custom-tooltip">
          <div class="tooltip-header">
            All {items.length} items
          </div>
          {#each items as item (item)}
            <div class="tooltip-item">• {item}</div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-overflow {
    padding: 2px 6px;
  }

  .custom-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    max-width: 300px;
    z-index: 1000;
    animation: fadeIn 0.15s ease-out;
  }

  .tooltip-header {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-color);
  }

  .tooltip-item {
    padding: 3px 0;
    font-size: 12px;
    color: var(--text-primary);
    white-space: nowrap;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
