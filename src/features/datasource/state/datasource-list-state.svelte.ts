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
    ...state,
    get datasources() {
      return state.items;
    },
    fetchDatasources: state.fetchItems,
  };
}
