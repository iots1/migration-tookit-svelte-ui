<script lang="ts">
  interface Props {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
  }

  let { currentPage, totalPages, totalRecords, onPageChange }: Props = $props();
</script>

{#if totalPages > 1}
  <div class="pagination">
    <button
      class="pagination-btn"
      disabled={currentPage <= 1}
      onclick={() => onPageChange(currentPage - 1)}
      aria-label="Previous page"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M9 3L4 7l5 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
      <button
        class="pagination-btn pagination-btn-page"
        class:pagination-btn-active={page === currentPage}
        onclick={() => onPageChange(page)}
      >
        {page}
      </button>
    {/each}

    <button
      class="pagination-btn"
      disabled={currentPage >= totalPages}
      onclick={() => onPageChange(currentPage + 1)}
      aria-label="Next page"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M5 3l5 4-5 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <span class="pagination-info">
      {totalRecords} record{totalRecords !== 1 ? 's' : ''}
    </span>
  </div>
{/if}
