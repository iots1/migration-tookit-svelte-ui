export interface DatasourceItem {
  id: string;
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
}

interface DatasourceApiResource {
  type: string;
  id: string;
  attributes: {
    name: string;
    db_type: string;
    host: string;
    port: string;
    dbname: string;
    username: string;
  };
}

export interface DatasourceListResponse {
  data: DatasourceApiResource[];
  meta: {
    timestamp?: string;
    pagination: {
      page: number;
      page_size: number;
      total: number;
      total_records: number;
      total_pages: number;
    };
  };
  status: {
    code: number;
    message: string;
  };
}

export interface ExecuteQueryPayload {
  cmd: string;
  datasource_id: string;
}

export interface QueryResultRow {
  [column: string]: unknown;
}

interface QueryResultAttributes {
  columns: string[];
  rows: QueryResultRow[];
  row_count: number;
  limit: number;
  truncated: boolean;
}

interface QueryResultApiResource {
  type: string;
  id: string;
  attributes: QueryResultAttributes;
}

export interface QueryResultResponse {
  data: QueryResultApiResource;
  links: { self: string };
  meta: { timestamp: string };
  status: { code: number; message: string };
}

export interface QueryResult {
  columns: string[];
  rows: QueryResultRow[];
  rowCount: number;
  limit: number;
  truncated: boolean;
}
