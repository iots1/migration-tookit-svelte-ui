import type { ApiLinks, ApiMeta, ApiPagination, ApiStatus } from './common';

// ─── Datasource List Types ──────────────────────────────────────────────────

export interface DatasourceListItem {
  id: string;
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface DatasourceApiListItemAttributes {
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface DatasourceApiListItem {
  type: string;
  id: string;
  attributes: DatasourceApiListItemAttributes;
}

export interface DatasourceListResponse {
  data: DatasourceListItem[];
  meta: {
    pagination: ApiPagination;
  };
  status: ApiStatus;
}

export interface DatasourceApiListResponse {
  data: DatasourceApiListItem[];
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

// ─── Datasource Detail Types ────────────────────────────────────────────────

export interface DatasourceDetail {
  id: string;
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

interface DatasourceApiDetailAttributes {
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

interface DatasourceApiDetailItem {
  type: string;
  id: string;
  attributes: DatasourceApiDetailAttributes;
}

export interface DatasourceDetailResponse {
  data: DatasourceDetail;
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

export interface DatasourceApiDetailResponse {
  data: DatasourceApiDetailItem;
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

// ─── Datasource Save Payload ────────────────────────────────────────────────

export interface DatasourceSavePayload {
  name: string;
  db_type: string;
  host: string;
  port: string;
  dbname: string;
  username: string;
  password: string;
}
