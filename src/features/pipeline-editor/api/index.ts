import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type { BaseEdge, BaseNode } from '$core/types/common';
import type {
  ConfigItem,
  ConfigsResponse,
  PipelineApiEntity,
  PipelineApiListResponse,
  PipelineEntity,
  PipelineListResponse,
  PipelineRunResponse,
  PipelineSavePayload,
} from '$core/types/pipeline';

export async function loadConfigs(): Promise<ConfigItem[]> {
  const response: ConfigsResponse = await api.get(API_V1.CONFIGS);
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
    `${API_V1.PIPELINES}${qs ? `?${qs}` : ''}`,
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
  pipeline: PipelineSavePayload,
): Promise<{ id: string; message: string }> {
  const response: { id: string; message: string } = await api.post(
    API_V1.PIPELINES,
    pipeline,
  );
  return response;
}

export async function loadPipeline(id: string): Promise<PipelineEntity> {
  const response: PipelineApiEntity = await api.get(
    `${API_V1.PIPELINES}/${id}`,
  );
  return {
    id: response.data.id,
    name: response.data.attributes.name,
    description: response.data.attributes.description,
    nodes: response.data.attributes.nodes.map((node) => ({
      config_id: node.config_id,
      description: undefined,
      position_x: node.position_x,
      position_y: node.position_y,
      order_sort: node.order_sort,
    })),
    edges: response.data.attributes.edges.map((edge) => ({
      source_config_uuid: edge.source_config_uuid,
      target_config_uuid: edge.target_config_uuid,
    })),
    created_at: response.data.attributes.created_at,
    updated_at: response.data.attributes.updated_at,
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
  edges: BaseEdge[],
): PipelineSavePayload {
  const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));

  return {
    name,
    description,
    nodes: nodes.map((node, index) => ({
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
  configs: ConfigItem[],
): Promise<PipelineLoadResult> {
  const configMap = new Map<string, ConfigItem>(configs.map((c) => [c.id, c]));
  const nodeByUuid = new Map<string, string>();

  const nodes: BaseNode[] = entity.nodes.map((node) => {
    const config = configMap.get(node.config_id);
    const nodeId = `config-${node.config_id}`;

    nodeByUuid.set(node.config_id, nodeId);

    return {
      id: nodeId,
      type: 'config',
      position: {
        x: node.position_x,
        y: node.position_y,
      },
      data: {
        label: config?.attributes.config_name ?? 'Unknown Config',
        configId: node.config_id,
        configType: config?.attributes.config_type ?? 'std',
        tableName: config?.attributes.table_name ?? '',
        sourceDb: config?.attributes.json_data.source.database ?? '',
        sourceTable: config?.attributes.json_data.source.table ?? '',
        targetDb: config?.attributes.json_data.target.database ?? '',
        targetTable: config?.attributes.json_data.target.table ?? '',
        mappingCount: config?.attributes.json_data.mappings.length ?? 0,
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

      return {
        id: `edge-${sourceNodeId}-${targetNodeId}`,
        source: sourceNodeId,
        target: targetNodeId,
      };
    })
    .filter((e): e is BaseEdge => e !== null);

  return {
    name: entity.name,
    description: entity.description,
    nodes,
    edges,
  };
}
