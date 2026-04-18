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
  total_row: number;
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
  totalRow: number;
  limit: number;
  truncated: boolean;
}

// === Query Tab ===

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
}

// === Schema Exploration Types ===

export interface TableItem {
  name: string;
}

export interface ConstraintItem {
  name: string;
  type: string;
}

export interface IndexItem {
  name: string;
  unique: boolean;
  primary: boolean;
}

export interface ColumnItem {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
  columnDefault: string | null;
  length: number | null;
  precision: number | null;
  scale: number | null;
  comment: string | null;
  constraints: ConstraintItem[];
  indexes: IndexItem[];
}

interface TableApiResource {
  type: string;
  id: string;
  attributes: {
    name: string;
  };
}

export interface TableListResponse {
  data: TableApiResource[];
  meta: {
    timestamp?: string;
  };
  status: {
    code: number;
    message: string;
  };
}

interface ColumnApiResource {
  type: string;
  id: string;
  attributes: {
    name: string;
    type: string;
    is_nullable: boolean;
    is_primary: boolean;
    column_default: string | null;
    length: number | null;
    precision: number | null;
    scale: number | null;
    comment: string | null;
    constraints: Array<{ name: string; type: string }>;
    indexes: Array<{ name: string; unique: boolean; primary: boolean }>;
  };
}

export interface ColumnListResponse {
  data: ColumnApiResource[];
  meta: {
    timestamp?: string;
  };
  status: {
    code: number;
    message: string;
  };
}
