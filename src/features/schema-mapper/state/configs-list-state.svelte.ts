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
    ...state,
    get configs() {
      return state.items;
    },
    fetchConfigs: state.fetchItems,
  };
}
