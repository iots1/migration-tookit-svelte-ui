import { createPaginatedListState } from '$core/state/paginated-list-state.svelte';
import type { ConfigListItem } from '$core/types/schema-mapper';
import { deleteConfig, listConfigs } from '$features/schema-mapper/api';

export type ConfigsListState = ReturnType<typeof createConfigsListState>;

export function createConfigsListState() {
  const state = createPaginatedListState<ConfigListItem>(
    listConfigs,
    deleteConfig,
    'Configs'
  );

  return {
    get configs() {
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
    fetchConfigs: state.fetchItems,
    setSearchInput: state.setSearchInput,
    search: state.search,
    clearSearch: state.clearSearch,
    deleteById: state.deleteById,
    goToPage: state.goToPage,
    dismissError: state.dismissError,
  };
}
