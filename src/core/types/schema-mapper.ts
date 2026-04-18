import type { ApiLinks, ApiMeta, ApiStatus } from './common';
import type { ConfigMapping } from './pipeline';

// ─── Transformer & Validator Types ────────────────────────────────────────────────

export interface TransformerOption {
  name: string;
  label: string;
  description: string;
  has_params: boolean;
  category?: 'text' | 'dates' | 'healthcare' | 'names' | 'data_type' | 'lookup';
}

export interface ValidatorOption {
  name: string;
  label: string;
  description: string;
}

export interface TransformersApiResponse {
  data: TransformerOption[];
  status: ApiStatus;
}

export interface ValidatorsApiResponse {
  data: ValidatorOption[];
  status: ApiStatus;
}

// ─── Datasource Schema Types ──────────────────────────────────────────────────

export interface DatasourceColumn {
  name: string;
  type: string;
  is_nullable: boolean;
  column_default: string | null;
}

// ─── Config List Types ────────────────────────────────────────────────────────

export interface ConfigListItem {
  id: string;
  config_name: string;
  table_name: string;
  source_datasource: string;
  source_table: string;
  target_datasource: string;
  target_table: string;
  datasource_source_name: string | null;
  datasource_source_db_type: string | null;
  datasource_source_dbname: string | null;
  datasource_target_name: string | null;
  datasource_target_db_type: string | null;
  datasource_target_dbname: string | null;
  config_type: string;
  mapping_count: number;
  updated_at: string;
}

interface ConfigListApiResponseItem {
  type: string;
  id: string;
  attributes: {
    config_name: string;
    table_name: string;
    json_data: {
      source: { table: string; datasource_name?: string };
      target: { table: string; datasource_name?: string };
      mappings: ConfigMapping[];
    };
    config_type: string;
    datasource_source_name: string | null;
    datasource_source_db_type: string | null;
    datasource_source_dbname: string | null;
    datasource_target_name: string | null;
    datasource_target_db_type: string | null;
    datasource_target_dbname: string | null;
    updated_at: string;
  };
}

export interface ConfigListResponse {
  data: ConfigListItem[];
  meta: {
    pagination: {
      page: number;
      page_size: number;
      total: number;
      total_records: number;
      total_pages: number;
    };
  };
  status: ApiStatus;
}

export interface ConfigListApiResponse {
  data: ConfigListApiResponseItem[];
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

// ─── Config Detail Types ──────────────────────────────────────────────────────

export interface ConfigDetailResponse {
  id: string;
  config_name: string;
  table_name: string;
  json_data: string;
  datasource_source_id: string | null;
  datasource_target_id: string | null;
  config_type: string;
  script: string | null;
  generate_sql: string | null;
  condition: string | null;
  lookup: string | null;
  updated_at: string;
}

interface ConfigDetailApiResource {
  type: string;
  id: string;
  attributes: ConfigDetailResponse;
}

export interface ConfigDetailApiResponse {
  data: ConfigDetailApiResource;
  status: ApiStatus;
}

// ─── Config Save Payload ──────────────────────────────────────────────────────

export interface ConfigSavePayload {
  config_name: string;
  table_name: string;
  json_data: string;
  datasource_source_id: string | null;
  datasource_target_id: string | null;
  config_type: string;
  script: string | null;
  generate_sql: string | null;
}

// ─── VALUE_MAP Transformer Types ──────────────────────────────────────────────

export interface ValueMapRule {
  when: Record<string, string>;
  then: string;
}

export interface ValueMapParams {
  rules: ValueMapRule[];
  default: string | null;
}

// ─── Field Mapping Types ──────────────────────────────────────────────────────

export interface MappingRow {
  sourceColumn: string;
  sourceType: string;
  targetColumn: string;
  targetExists: boolean;
  transformers: string[];
  validators: string[];
  transformerParams: Record<string, unknown>;
  defaultValue: string;
  ignore: boolean;
  isManual?: boolean;
}

export interface FieldMappingConfigData {
  name: string;
  module: string;
  source: {
    database: string;
    table: string;
    datasource_id?: string | number;
    datasource_name?: string;
  };
  target: {
    database: string;
    table: string;
    datasource_id?: string | number;
    datasource_name?: string;
  };
  mappings: ConfigMapping[];
}
