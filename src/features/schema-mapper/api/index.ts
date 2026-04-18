import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type {
  ConfigDetailApiResponse,
  ConfigDetailResponse,
  ConfigListApiResponse,
  ConfigListResponse,
  ConfigSavePayload,
  DatasourceColumn,
  TransformerOption,
  ValidatorOption,
} from '$core/types/schema-mapper';

export async function listConfigs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ConfigListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) {
    query.set('filter', `config_name||$cont||${params.search}`);
  }
  const qs = query.toString();
  const response: ConfigListApiResponse = await api.get(
    `${API_V1.CONFIGS}${qs ? `?${qs}` : ''}`
  );
  return {
    data: response.data.map((item) => ({
      id: item.id,
      config_name: item.attributes.config_name,
      table_name: item.attributes.table_name,
      source_datasource:
        item.attributes.json_data.source?.datasource_name ?? '',
      source_table: item.attributes.json_data.source?.table ?? '',
      target_datasource:
        item.attributes.json_data.target?.datasource_name ?? '',
      target_table: item.attributes.json_data.target?.table ?? '',
      datasource_source_name: item.attributes.datasource_source_name ?? null,
      datasource_source_db_type:
        item.attributes.datasource_source_db_type ?? null,
      datasource_source_dbname:
        item.attributes.datasource_source_dbname ?? null,
      datasource_target_name: item.attributes.datasource_target_name ?? null,
      datasource_target_db_type:
        item.attributes.datasource_target_db_type ?? null,
      datasource_target_dbname:
        item.attributes.datasource_target_dbname ?? null,
      config_type: item.attributes.config_type,
      mapping_count: (item.attributes.json_data.mappings ?? []).filter(
        (m) => !m.ignore
      ).length,
      updated_at: item.attributes.updated_at,
    })),
    meta: response.meta,
    status: response.status,
  };
}

export async function getConfig(id: string): Promise<ConfigDetailResponse> {
  const response: ConfigDetailApiResponse = await api.get(
    `${API_V1.CONFIGS}/${id}`
  );
  return response.data.attributes;
}

export async function createConfig(
  payload: ConfigSavePayload
): Promise<{ id: string }> {
  return api.post<{ id: string }>(API_V1.CONFIGS, payload);
}

export async function updateConfig(
  id: string,
  payload: ConfigSavePayload
): Promise<void> {
  await api.put(`${API_V1.CONFIGS}/${id}`, payload);
}

export async function deleteConfig(id: string): Promise<void> {
  await api.delete(`${API_V1.CONFIGS}/${id}`);
}

interface DatasourceTablesApiItem {
  id: string;
  attributes: { name: string };
}

interface DatasourceTablesApiResponse {
  data: DatasourceTablesApiItem[];
}

export async function getDatasourceTables(
  datasourceId: string
): Promise<string[]> {
  const response: DatasourceTablesApiResponse = await api.get(
    API_V1.DATASOURCE_TABLES(datasourceId)
  );
  return response.data.map((item) => item.attributes.name);
}

interface DatasourceColumnsApiItem {
  id: string;
  attributes: {
    name: string;
    type: string;
    is_nullable: boolean;
    column_default: string | null;
  };
}

interface DatasourceColumnsApiResponse {
  data: DatasourceColumnsApiItem[];
}

export async function getDatasourceTableColumns(
  datasourceId: string,
  tableName: string
): Promise<DatasourceColumn[]> {
  const response: DatasourceColumnsApiResponse = await api.get(
    API_V1.DATASOURCE_TABLE_COLUMNS(datasourceId, tableName)
  );
  return response.data.map((item) => ({
    name: item.attributes.name,
    type: item.attributes.type,
    is_nullable: item.attributes.is_nullable,
    column_default: item.attributes.column_default,
  }));
}

interface TransformerApiItem {
  id: string;
  type: string;
  attributes: {
    name?: string;
    label: string;
    description: string;
    has_params: boolean;
    category?: TransformerOption['category'];
  };
}

interface ValidatorApiItem {
  id: string;
  type: string;
  attributes: {
    name?: string;
    label: string;
    description: string;
  };
}

interface TransformersRawApiResponse {
  data: TransformerApiItem[];
}

interface ValidatorsRawApiResponse {
  data: ValidatorApiItem[];
}

export async function getTransformers(): Promise<TransformerOption[]> {
  const response: TransformersRawApiResponse = await api.get(
    API_V1.TRANSFORMERS
  );
  return response.data.map((item) => ({
    name: item.attributes.name ?? item.id,
    label: item.attributes.label,
    description: item.attributes.description,
    has_params: item.attributes.has_params,
    category: item.attributes.category,
  }));
}

export async function getValidators(): Promise<ValidatorOption[]> {
  const response: ValidatorsRawApiResponse = await api.get(API_V1.VALIDATORS);
  return response.data.map((item) => ({
    name: item.attributes.name ?? item.id,
    label: item.attributes.label,
    description: item.attributes.description,
  }));
}
