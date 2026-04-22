<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    onInput: (value: string) => void;
    onSearch: () => void;
    onClear: () => void;
  }

  let {
    value,
    placeholder = 'Search...',
    onInput,
    onSearch,
    onClear,
  }: Props = $props();
</script>

<div class="pipeline-list-search">
  <div class="search-input-wrapper">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      class="search-icon"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
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
      {placeholder}
      {value}
      oninput={(e) => onInput((e.target as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onSearch()}
    />
    {#if value}
      <button class="search-clear" onclick={onClear} aria-label="Clear search">
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
  <button class="btn btn-secondary" onclick={onSearch}>Search</button>
</div>
