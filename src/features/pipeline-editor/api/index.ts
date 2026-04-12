import { api } from "$core/api/client";
import { API_V1 } from "$core/api/endpoints";
import type {
  ConfigItem,
  ConfigsResponse,
  BaseNode,
  BaseEdge,
  PipelineSavePayload,
  PipelineNode,
  PipelineEdge,
  PipelineEntity,
  PipelineListResponse,
  PipelineRunResponse,
} from "$core/types/pipeline";

export async function loadConfigs(): Promise<ConfigItem[]> {
  const response = await api.get<ConfigsResponse>(API_V1.CONFIGS);
  return response.data;
}

export async function loadConfig(id: string) {
  return api.get<ConfigsResponse>(API_V1.CONFIG_DETAIL(id));
}

export async function listPipelines(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PipelineListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) {
    query.set("filter", `name||$cont||${params.search}`);
    query.append("filter", `description||$cont||${params.search}`);
  }
  const qs = query.toString();
  return api.get<PipelineListResponse>(
    `${API_V1.PIPELINES}${qs ? `?${qs}` : ""}`,
  );
}

export async function savePipeline(pipeline: PipelineSavePayload) {
  return api.post<{ id: string; message: string }>(API_V1.PIPELINES, pipeline);
}

export async function loadPipeline(id: string): Promise<PipelineEntity> {
  return api.get<PipelineEntity>(`${API_V1.PIPELINES}/${id}`);
}

export async function deletePipeline(id: string) {
  return api.delete(`${API_V1.PIPELINES}/${id}`);
}

export async function runPipeline(id: string) {
  return api.post<PipelineRunResponse>(API_V1.PIPELINE_RUN(id));
}

export function toPipelineSavePayload(
  name: string,
  description: string,
  nodes: BaseNode[],
  edges: BaseEdge[],
): PipelineSavePayload {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return {
    name,
    description,
    nodes: nodes.map((node, index) => ({
      uuid_config: (node.data.configId as string) || node.id,
      description: (node.data.nodeDescription as string) || undefined,
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
      order_sort: index,
    })),
    edges: edges.map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      return {
        source_config_uuid:
          (sourceNode?.data.configId as string) ||
          sourceNode?.id ||
          edge.source,
        target_config_uuid:
          (targetNode?.data.configId as string) ||
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
  const configMap = new Map(configs.map((c) => [c.id, c]));
  const nodeByUuid = new Map<string, string>(); // uuid_config -> node_id

  const nodes: BaseNode[] = entity.nodes.map((node) => {
    const config = configMap.get(node.uuid_config);
    const nodeId = `config-${node.uuid_config}`;

    nodeByUuid.set(node.uuid_config, nodeId);

    return {
      id: nodeId,
      type: "config",
      position: {
        x: node.position_x,
        y: node.position_y,
      },
      data: {
        label: config?.attributes.config_name || "Unknown Config",
        configId: node.uuid_config,
        configType: config?.attributes.config_type || "std",
        tableName: config?.attributes.table_name || "",
        sourceDb: config?.attributes.json_data.source.database || "",
        sourceTable: config?.attributes.json_data.source.table || "",
        targetDb: config?.attributes.json_data.target.database || "",
        targetTable: config?.attributes.json_data.target.table || "",
        mappingCount: config?.attributes.json_data.mappings.length || 0,
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
