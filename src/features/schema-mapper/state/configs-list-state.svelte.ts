import type { ConfigListItem } from '$core/types/schema-mapper';
import { deleteConfig, listConfigs } from '$features/schema-mapper/api';

export interface ConfigsListState {
  readonly configs: ConfigListItem[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalRecords: number;
  readonly searchInput: string;
  fetchConfigs: () => Promise<void>;
  setSearchInput: (value: string) => void;
  search: () => void;
  clearSearch: () => void;
  deleteById: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  dismissError: () => void;
}

export function createConfigsListState(): ConfigsListState {
  let configs = $state<ConfigListItem[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let currentPage = $state(1);
  const pageSize = 10;
  let totalPages = $state(1);
  let totalRecords = $state(0);
  let searchQuery = $state('');
  let searchInput = $state('');

  async function fetchConfigs() {
    try {
      loading = true;
      error = null;
      const response = await listConfigs({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      configs = response.data;
      totalPages = response.meta.pagination.total_pages;
      totalRecords = response.meta.pagination.total_records;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load configs';
    } finally {
      loading = false;
    }
  }

  function search() {
    searchQuery = searchInput;
    currentPage = 1;
    void fetchConfigs();
  }

  function clearSearch() {
    searchInput = '';
    searchQuery = '';
    currentPage = 1;
    void fetchConfigs();
  }

  async function deleteById(id: string): Promise<boolean> {
    try {
      await deleteConfig(id);
      await fetchConfigs();
      return true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete config';
      return false;
    }
  }

  function goToPage(page: number) {
    currentPage = page;
    void fetchConfigs();
  }

  return {
    get configs() {
      return configs;
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
    get totalPages() {
      return totalPages;
    },
    get totalRecords() {
      return totalRecords;
    },
    get searchInput() {
      return searchInput;
    },
    fetchConfigs,
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
