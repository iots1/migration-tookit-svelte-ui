interface PaginatedListState<T> {
  readonly items: T[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalRecords: number;
  readonly searchInput: string;
  fetchItems: () => Promise<void>;
  setSearchInput: (value: string) => void;
  search: () => void;
  clearSearch: () => void;
  deleteById: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  dismissError: () => void;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total_pages: number;
      total_records: number;
    };
  };
}

export function createPaginatedListState<T>(
  fetchFn: (params: {
    page: number;
    limit: number;
    search?: string;
  }) => Promise<PaginatedResponse<T>>,
  deleteFn: (id: string) => Promise<void>,
  errorMessagePrefix = 'Items'
): PaginatedListState<T> {
  let items = $state<T[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let currentPage = $state(1);
  const pageSize = 10;
  let totalPages = $state(1);
  let totalRecords = $state(0);
  let searchQuery = $state('');
  let searchInput = $state('');

  async function fetchItems() {
    try {
      loading = true;
      error = null;
      const response = await fetchFn({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      items = response.data;
      totalPages = response.meta.pagination.total_pages;
      totalRecords = response.meta.pagination.total_records;
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : `Failed to load ${errorMessagePrefix.toLowerCase()}`;
    } finally {
      loading = false;
    }
  }

  function search() {
    searchQuery = searchInput;
    currentPage = 1;
    void fetchItems();
  }

  function clearSearch() {
    searchInput = '';
    searchQuery = '';
    currentPage = 1;
    void fetchItems();
  }

  async function deleteById(id: string): Promise<boolean> {
    try {
      await deleteFn(id);
      await fetchItems();
      return true;
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : `Failed to delete ${errorMessagePrefix.toLowerCase()}`;
      return false;
    }
  }

  function goToPage(page: number) {
    currentPage = page;
    void fetchItems();
  }

  return {
    get items() {
      return items;
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
    fetchItems,
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
