import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type {
  ColumnItem,
  ColumnListResponse,
  DatasourceItem,
  DatasourceListResponse,
  ExecuteQueryPayload,
  QueryResult,
  QueryResultResponse,
  TableItem,
  TableListResponse,
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

export async function listTables(datasourceId: string): Promise<TableItem[]> {
  const response: TableListResponse = await api.get(
    API_V1.DATASOURCE_TABLES(datasourceId)
  );
  return response.data.map((item) => ({
    name: item.attributes.name,
  }));
}

export async function listColumns(
  datasourceId: string,
  tableName: string
): Promise<ColumnItem[]> {
  const response: ColumnListResponse = await api.get(
    API_V1.DATASOURCE_TABLE_COLUMNS(datasourceId, tableName)
  );
  return response.data.map((item) => ({
    name: item.attributes.name,
    dataType: item.attributes.data_type,
    nullable: item.attributes.nullable,
    primaryKey: item.attributes.primary_key,
  }));
}
