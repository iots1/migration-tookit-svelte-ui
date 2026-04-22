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
    ...state,
    get pipelines() {
      return state.items;
    },
    fetchPipelines: state.fetchItems,
  };
}
