import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type { BaseEdge, BaseNode } from '$core/types/common';
import type {
  ConfigItem,
  ConfigJsonData,
  ConfigsResponse,
  CreateJobPayload,
  CreateJobResponse,
  PipelineApiEntity,
  PipelineApiListResponse,
  PipelineEntity,
  PipelineListResponse,
  PipelineRunResponse,
  PipelineSavePayload,
} from '$core/types/pipeline';

export async function loadConfigs(params?: {
  search?: string;
  limit?: number;
}): Promise<ConfigItem[]> {
  const query = new URLSearchParams();
  if (params?.search) {
    query.set('filter', `config_name||$cont||${params.search}`);
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  const qs = query.toString();
  const response: ConfigsResponse = await api.get(
    `${API_V1.CONFIGS}${qs ? `?${qs}` : ''}`
  );
  return response.data;
}

export async function loadConfig(id: string): Promise<ConfigsResponse> {
  const response: ConfigsResponse = await api.get(API_V1.CONFIG_DETAIL(id));
  return response;
}

export async function listPipelines(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PipelineListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) {
    query.set('filter', `name||$cont||${params.search}`);
    query.append('filter', `description||$cont||${params.search}`);
  }
  const qs = query.toString();
  const response: PipelineApiListResponse = await api.get(
    `${API_V1.PIPELINES}${qs ? `?${qs}` : ''}`
  );
  return {
    data: response.data.map((item) => ({
      id: item.id,
      name: item.attributes.name,
      description: item.attributes.description,
      nodes_count: item.attributes.nodes?.length ?? 0,
      edges_count: item.attributes.edges?.length ?? 0,
      created_at: item.attributes.created_at,
      updated_at: item.attributes.updated_at,
    })),
    meta: response.meta,
    status: response.status,
  };
}

export async function savePipeline(
  pipeline: PipelineSavePayload
): Promise<{ id: string; message: string }> {
  const raw = await api.post<Record<string, unknown>>(
    API_V1.PIPELINES,
    pipeline
  );
  const data = raw.data as Record<string, unknown>;
  return {
    id: (data?.id as string) ?? '',
    message: (raw.message as string) ?? 'Created',
  };
}

export async function loadPipeline(id: string): Promise<PipelineEntity> {
  const response: PipelineApiEntity = await api.get(
    `${API_V1.PIPELINES}/${id}`
  );
  return {
    id: response.data.id,
    name: response.data.attributes.name,
    description: response.data.attributes.description,
    nodes: response.data.attributes.nodes.map((node) => ({
      id: node.id,
      config_id: node.config_id,
      config_name: node.config_name,
      table_name: node.table_name,
      json_data_str: node.json_data,
      config_type: node.config_type,
      description: undefined,
      position_x: node.position_x,
      position_y: node.position_y,
      order_sort: node.order_sort,
    })),
    edges: response.data.attributes.edges.map((edge) => ({
      id: edge.id,
      source_config_uuid: edge.source_config_uuid,
      target_config_uuid: edge.target_config_uuid,
    })),
    created_at: response.data.attributes.created_at,
    updated_at: response.data.attributes.updated_at,
  };
}

export async function updatePipeline(
  id: string,
  pipeline: PipelineSavePayload
): Promise<{ id: string; message: string }> {
  const raw = await api.put<Record<string, unknown>>(
    `${API_V1.PIPELINES}/${id}`,
    pipeline
  );
  const data = raw.data as Record<string, unknown>;
  return {
    id: (data?.id as string) ?? id,
    message: (raw.message as string) ?? 'Updated',
  };
}

export async function deletePipeline(id: string): Promise<void> {
  await api.delete(`${API_V1.PIPELINES}/${id}`);
}

export async function runPipeline(id: string): Promise<PipelineRunResponse> {
  const response: PipelineRunResponse = await api.post(API_V1.PIPELINE_RUN(id));
  return response;
}

export function toPipelineSavePayload(
  name: string,
  description: string,
  nodes: BaseNode[],
  edges: BaseEdge[]
): PipelineSavePayload {
  const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));

  return {
    name,
    description,
    nodes: nodes.map((node, index) => ({
      id: (node.data.pipelineNodeId as string | undefined) ?? undefined,
      config_id: String(node.data.configId ?? node.id),
      description:
        node.data.nodeDescription !== undefined
          ? String(node.data.nodeDescription)
          : undefined,
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
      order_sort: index,
    })),
    edges: edges.map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      return {
        id: edge.data?.pipelineEdgeId as string | undefined,
        source_config_uuid:
          String(sourceNode?.data.configId ?? '') ||
          sourceNode?.id ||
          edge.source,
        target_config_uuid:
          String(targetNode?.data.configId ?? '') ||
          targetNode?.id ||
          edge.target,
      };
    }),
  };
}

export interface PipelineLoadResult {
  name: string;
  description: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export async function reconstructPipelineFromEntity(
  entity: PipelineEntity,
  configs: ConfigItem[]
): Promise<PipelineLoadResult> {
  const configMap = new Map<string, ConfigItem>(configs.map((c) => [c.id, c]));
  const nodeByUuid = new Map<string, string>();

  const nodes: BaseNode[] = entity.nodes.map((node) => {
    const config = configMap.get(node.config_id);
    const nodeId = `config-${node.config_id}`;

    nodeByUuid.set(node.config_id, nodeId);

    // Prefer inline data from the pipeline API response; fall back to separate config lookup
    const inlineJsonData = (() => {
      if (!node.json_data_str || node.json_data_str === '{}') return null;
      try {
        return JSON.parse(node.json_data_str) as ConfigJsonData;
      } catch {
        return null;
      }
    })();

    const resolvedConfigName =
      node.config_name ?? config?.attributes.config_name ?? 'Unknown Config';
    const resolvedConfigType =
      node.config_type ?? config?.attributes.config_type ?? 'std';
    const resolvedTableName =
      node.table_name ?? config?.attributes.table_name ?? '';
    const jsonData = inlineJsonData ?? config?.attributes.json_data ?? null;

    return {
      id: nodeId,
      type: 'config',
      position: {
        x: node.position_x,
        y: node.position_y,
      },
      data: {
        label: resolvedConfigName,
        configId: node.config_id,
        pipelineNodeId: node.id,
        configType: resolvedConfigType,
        tableName: resolvedTableName,
        sourceDb: jsonData?.source?.database ?? '',
        sourceTable: jsonData?.source?.table ?? '',
        targetDb: jsonData?.target?.database ?? '',
        targetTable: jsonData?.target?.table ?? '',
        mappingCount: jsonData?.mappings?.length ?? 0,
        nodeDescription: node.description,
      },
    };
  });

  const edges: BaseEdge[] = entity.edges
    .map((edge, index) => {
      const sourceNodeId = nodeByUuid.get(edge.source_config_uuid);
      const targetNodeId = nodeByUuid.get(edge.target_config_uuid);

      if (!sourceNodeId || !targetNodeId) {
        console.warn(`Edge ${index}: Missing nodes for`, edge);
        return null;
      }

      const baseEdge: BaseEdge = {
        id: `edge-${sourceNodeId}-${targetNodeId}`,
        source: sourceNodeId,
        target: targetNodeId,
        data: {
          pipelineEdgeId: edge.id,
        },
      };
      return baseEdge;
    })
    .filter((e): e is BaseEdge => e !== null);

  return {
    name: entity.name,
    description: entity.description,
    nodes,
    edges,
  };
}

export async function createJob(
  payload: CreateJobPayload
): Promise<CreateJobResponse> {
  const response: CreateJobResponse = await api.post(
    API_V1.MIGRATION_JOBS,
    payload
  );
  return response;
}
