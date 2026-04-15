import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type {
  DatasourceItem,
  DatasourceListResponse,
  ExecuteQueryPayload,
  QueryResult,
  QueryResultResponse,
} from '$core/types/db-explorer';

export async function listDatasources(): Promise<DatasourceItem[]> {
  const response: DatasourceListResponse = await api.get(API_V1.DATASOURCES);
  return response.data.map((item) => ({
    id: item.id,
    name: item.attributes.name,
    db_type: item.attributes.db_type,
    host: item.attributes.host,
    port: item.attributes.port,
    dbname: item.attributes.dbname,
    username: item.attributes.username,
  }));
}

export async function executeQuery(
  payload: ExecuteQueryPayload
): Promise<QueryResult> {
  const response: QueryResultResponse = await api.post(
    API_V1.DB_EXPLORERS,
    payload
  );
  return {
    columns: response.data.attributes.columns,
    rows: response.data.attributes.rows,
    rowCount: response.data.attributes.row_count,
    limit: response.data.attributes.limit,
    truncated: response.data.attributes.truncated,
  };
}
