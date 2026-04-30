import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type {
  DatasourceApiDetailResponse,
  DatasourceApiListResponse,
  DatasourceDetailResponse,
  DatasourceListResponse,
  DatasourceSavePayload,
} from '$core/types/datasource';

export async function listDatasourcesPaginated(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<DatasourceListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) {
    query.set('or', `name||$cont||${params.search}`);
    query.append('or', `host||$cont||${params.search}`);
    query.append('or', `dbname||$cont||${params.search}`);
  }
  const qs = query.toString();
  const response: DatasourceApiListResponse = await api.get(
    `${API_V1.DATASOURCES}${qs ? `?${qs}` : ''}`
  );
  return {
    data: response.data.map((item) => ({
      id: item.id,
      name: item.attributes.name,
      db_type: item.attributes.db_type,
      host: item.attributes.host,
      port: item.attributes.port,
      dbname: item.attributes.dbname,
      username: item.attributes.username,
      created_at: item.attributes.created_at,
      updated_at: item.attributes.updated_at,
    })),
    meta: response.meta,
    status: response.status,
  };
}

export async function getDatasource(
  id: string
): Promise<DatasourceDetailResponse> {
  const response: DatasourceApiDetailResponse = await api.get(
    API_V1.DATASOURCE_DETAIL(id)
  );
  return {
    data: {
      id: response.data.id,
      name: response.data.attributes.name,
      db_type: response.data.attributes.db_type,
      host: response.data.attributes.host,
      port: response.data.attributes.port,
      dbname: response.data.attributes.dbname,
      username: response.data.attributes.username,
      password: response.data.attributes.password,
      created_at: response.data.attributes.created_at,
      updated_at: response.data.attributes.updated_at,
    },
    links: response.links,
    meta: response.meta,
    status: response.status,
  };
}

export async function createDatasource(
  payload: DatasourceSavePayload
): Promise<{ id: string; message: string }> {
  const raw = await api.post<Record<string, unknown>>(
    API_V1.DATASOURCES,
    payload
  );
  const data = raw.data as Record<string, unknown>;
  return {
    id: (data?.id as string) ?? '',
    message: (raw.message as string) ?? 'Created',
  };
}

export async function updateDatasource(
  id: string,
  payload: DatasourceSavePayload
): Promise<{ id: string; message: string }> {
  const raw = await api.put<Record<string, unknown>>(
    API_V1.DATASOURCE_DETAIL(id),
    payload
  );
  const data = raw.data as Record<string, unknown>;
  return {
    id: (data?.id as string) ?? id,
    message: (raw.message as string) ?? 'Updated',
  };
}

export async function deleteDatasource(id: string): Promise<void> {
  await api.delete(API_V1.DATASOURCE_DETAIL(id));
}
