import type { DatasourceItem, QueryResult } from '$core/types/db-explorer';
import { executeQuery, listDatasources } from '$features/db-explorer/api';

export interface DbExplorerState {
  readonly datasources: DatasourceItem[];
  readonly selectedDatasourceId: string | null;
  readonly sql: string;
  readonly result: QueryResult | null;
  readonly loadingDatasources: boolean;
  readonly running: boolean;
  readonly error: string | null;
  selectDatasource: (id: string | null) => void;
  setSql: (value: string) => void;
  clearResult: () => void;
  fetchDatasources: () => Promise<void>;
  runQuery: () => Promise<void>;
}

export function createDbExplorerState(): DbExplorerState {
  let datasources = $state.raw<DatasourceItem[]>([]);
  let selectedDatasourceId = $state<string | null>(null);
  let sql = $state('');
  let result = $state<QueryResult | null>(null);
  let loadingDatasources = $state(false);
  let running = $state(false);
  let error = $state<string | null>(null);

  return {
    get datasources() {
      return datasources;
    },
    get selectedDatasourceId() {
      return selectedDatasourceId;
    },
    get sql() {
      return sql;
    },
    get result() {
      return result;
    },
    get loadingDatasources() {
      return loadingDatasources;
    },
    get running() {
      return running;
    },
    get error() {
      return error;
    },
    selectDatasource(id: string | null) {
      selectedDatasourceId = id;
      result = null;
      error = null;
    },
    setSql(value: string) {
      sql = value;
    },
    clearResult() {
      result = null;
      error = null;
    },
    async fetchDatasources() {
      loadingDatasources = true;
      error = null;
      try {
        const items = await listDatasources();
        datasources = items;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load datasources';
        error = message;
      } finally {
        loadingDatasources = false;
      }
    },
    async runQuery() {
      if (!selectedDatasourceId || !sql.trim()) return;

      running = true;
      error = null;
      result = null;
      try {
        const res = await executeQuery({
          cmd: sql.trim(),
          datasource_id: selectedDatasourceId,
        });
        result = res;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Query execution failed';
        error = message;
      } finally {
        running = false;
      }
    },
  };
}
