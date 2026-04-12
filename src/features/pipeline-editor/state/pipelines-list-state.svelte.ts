import type { PipelineListItem } from '$core/types/pipeline';
import { deletePipeline, listPipelines } from '$features/pipeline-editor/api';

export interface PipelinesListState {
  readonly pipelines: PipelineListItem[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalRecords: number;
  readonly searchInput: string;
  fetchPipelines: () => Promise<void>;
  setSearchInput: (value: string) => void;
  search: () => void;
  clearSearch: () => void;
  deleteById: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  dismissError: () => void;
}

export function createPipelinesListState(): PipelinesListState {
  let pipelines = $state<PipelineListItem[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let currentPage = $state(1);
  const pageSize = 10;
  let totalPages = $state(1);
  let totalRecords = $state(0);
  let searchQuery = $state('');
  let searchInput = $state('');

  async function fetchPipelines() {
    try {
      loading = true;
      error = null;
      const response = await listPipelines({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      pipelines = response.data;
      totalPages = response.meta.pagination.total_pages;
      totalRecords = response.meta.pagination.total_records;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load pipelines';
    } finally {
      loading = false;
    }
  }

  function search() {
    searchQuery = searchInput;
    currentPage = 1;
    void fetchPipelines();
  }

  function clearSearch() {
    searchInput = '';
    searchQuery = '';
    currentPage = 1;
    void fetchPipelines();
  }

  async function deleteById(id: string): Promise<boolean> {
    try {
      await deletePipeline(id);
      await fetchPipelines();
      return true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete pipeline';
      return false;
    }
  }

  function goToPage(page: number) {
    currentPage = page;
    void fetchPipelines();
  }

  return {
    get pipelines() {
      return pipelines;
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
    fetchPipelines,
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
