import { createPaginatedListState } from '$core/state/paginated-list-state.svelte';
import type { PipelineListItem } from '$core/types/pipeline';
import { deletePipeline, listPipelines } from '$features/pipeline-editor/api';

export type PipelinesListState = ReturnType<typeof createPipelinesListState>;

export function createPipelinesListState() {
  const state = createPaginatedListState<PipelineListItem>(
    listPipelines,
    deletePipeline,
    'Pipelines'
  );

  return {
    get pipelines() {
      return state.items;
    },
    get loading() {
      return state.loading;
    },
    get error() {
      return state.error;
    },
    get currentPage() {
      return state.currentPage;
    },
    get pageSize() {
      return state.pageSize;
    },
    get totalPages() {
      return state.totalPages;
    },
    get totalRecords() {
      return state.totalRecords;
    },
    get searchInput() {
      return state.searchInput;
    },
    fetchPipelines: state.fetchItems,
    setSearchInput: state.setSearchInput,
    search: state.search,
    clearSearch: state.clearSearch,
    deleteById: state.deleteById,
    goToPage: state.goToPage,
    dismissError: state.dismissError,
  };
}
