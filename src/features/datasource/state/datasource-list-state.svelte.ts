import { createPaginatedListState } from '$core/state/paginated-list-state.svelte';
import type { DatasourceListItem } from '$core/types/datasource';
import {
  deleteDatasource,
  listDatasourcesPaginated,
} from '$features/datasource/api';

export type DatasourcesListState = ReturnType<
  typeof createDatasourcesListState
>;

export function createDatasourcesListState() {
  const state = createPaginatedListState<DatasourceListItem>(
    listDatasourcesPaginated,
    deleteDatasource,
    'Datasources'
  );

  return {
    get datasources() {
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
    fetchDatasources: state.fetchItems,
    setSearchInput: state.setSearchInput,
    search: state.search,
    clearSearch: state.clearSearch,
    deleteById: state.deleteById,
    goToPage: state.goToPage,
    dismissError: state.dismissError,
  };
}
