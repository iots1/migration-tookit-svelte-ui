import type {
  ApiLinks,
  ApiMeta,
  ApiPagination,
  ApiStatus,
  BaseEdge,
  BaseNode,
  FlowDefinition,
  HistoryEntry,
} from "./common";

// Re-export shared types so existing imports from this file continue to work.
export type {
  ApiLinks,
  ApiMeta,
  ApiPagination,
  ApiStatus,
  BaseEdge,
  BaseNode,
  FlowDefinition,
  HistoryEntry,
};

// ─── Config Types ─────────────────────────────────────────────────────────────

export interface ConfigMapping {
  source: string;
  target: string;
  ignore: boolean;
  transformers?: string[];
  validators?: string[];
  default_value?: unknown;
  transformer_params?: Record<string, unknown>;
}

export interface ConfigJsonData {
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

export interface ConfigAttributes {
  config_name: string;
  table_name: string;
  json_data: ConfigJsonData;
  config_type: string;
  datasource_source_id: string | null;
  datasource_target_id: string | null;
  script: string | null;
  generate_sql: string | null;
  condition: string | null;
  lookup: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ConfigItem {
  type: string;
  id: string;
  attributes: ConfigAttributes;
}

export interface ConfigsResponse {
  data: ConfigItem[];
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

// ─── Pipeline Entity Types ────────────────────────────────────────────────────

export interface PipelineSavePayload {
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface PipelineNode {
  config_id: string;
  description?: string;
  position_x: number;
  position_y: number;
  order_sort: number;
}

export interface PipelineEdge {
  source_config_uuid: string;
  target_config_uuid: string;
}

export interface PipelineEntity {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  created_at: string;
  updated_at: string;
}

export interface PipelineApiEntity {
  data: {
    type: string;
    id: string;
    attributes: {
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
      nodes: Array<{
        id: string;
        pipeline_id: string;
        config_id: string;
        position_x: number;
        position_y: number;
        order_sort: number;
      }>;
      edges: Array<{
        id: string;
        pipeline_id: string;
        source_config_uuid: string;
        target_config_uuid: string;
      }>;
    };
  };
  status: ApiStatus;
}

// ─── Pipeline List Types ──────────────────────────────────────────────────────

export interface PipelineListItem {
  id: string;
  name: string;
  description: string;
  nodes_count: number;
  edges_count: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineApiResponseItem {
  type: string;
  id: string;
  attributes: {
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    nodes: Array<{
      id: string;
      pipeline_id: string;
      config_id: string;
      position_x: number;
      position_y: number;
      order_sort: number;
    }>;
    edges: Array<{
      id: string;
      pipeline_id: string;
      source_config_uuid: string;
      target_config_uuid: string;
    }>;
  };
}

export interface PipelineListResponse {
  data: PipelineListItem[];
  meta: {
    pagination: ApiPagination;
  };
  status: ApiStatus;
}

export interface PipelineApiListResponse {
  data: PipelineApiResponseItem[];
  links: ApiLinks;
  meta: ApiMeta;
  status: ApiStatus;
}

// ─── Pipeline Run Types ───────────────────────────────────────────────────────

export interface PipelineRunResponse {
  job_id: string;
  status: string;
  message: string;
}
