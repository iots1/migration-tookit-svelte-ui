import type { DatasourceListItem } from '$core/types/datasource';
import {
  deleteDatasource,
  listDatasourcesPaginated,
} from '$features/datasource/api';

export interface DatasourcesListState {
  readonly datasources: DatasourceListItem[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalRecords: number;
  readonly searchInput: string;
  fetchDatasources: () => Promise<void>;
  setSearchInput: (value: string) => void;
  search: () => void;
  clearSearch: () => void;
  deleteById: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  dismissError: () => void;
}

export function createDatasourcesListState(): DatasourcesListState {
  let datasources = $state<DatasourceListItem[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let currentPage = $state(1);
  const pageSize = 10;
  let totalPages = $state(1);
  let totalRecords = $state(0);
  let searchQuery = $state('');
  let searchInput = $state('');

  async function fetchDatasources() {
    try {
      loading = true;
      error = null;
      const response = await listDatasourcesPaginated({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      datasources = response.data;
      totalPages = response.meta.pagination.total_pages;
      totalRecords = response.meta.pagination.total_records;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load datasources';
    } finally {
      loading = false;
    }
  }

  function search() {
    searchQuery = searchInput;
    currentPage = 1;
    void fetchDatasources();
  }

  function clearSearch() {
    searchInput = '';
    searchQuery = '';
    currentPage = 1;
    void fetchDatasources();
  }

  async function deleteById(id: string): Promise<boolean> {
    try {
      await deleteDatasource(id);
      await fetchDatasources();
      return true;
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to delete datasource';
      return false;
    }
  }

  function goToPage(page: number) {
    currentPage = page;
    void fetchDatasources();
  }

  return {
    get datasources() {
      return datasources;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get currentPage() {
      return currentPage;
    },
    pageSize,
    get totalPages() {
      return totalPages;
    },
    get totalRecords() {
      return totalRecords;
    },
    get searchInput() {
      return searchInput;
    },
    fetchDatasources,
    setSearchInput(value: string) {
      searchInput = value;
    },
    search,
    clearSearch,
    deleteById,
    goToPage,
    dismissError() {
      error = null;
    },
  };
}
