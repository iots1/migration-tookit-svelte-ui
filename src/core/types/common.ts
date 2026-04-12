// ─── Shared API Response Types ───────────────────────────────────────────────

export interface ApiPagination {
  page: number;
  page_size: number;
  total: number;
  total_records: number;
  total_pages: number;
}

export interface ApiStatus {
  code: number;
  message: string;
}

export type ApiLinks = Record<string, string>;

export interface ApiMeta {
  timestamp?: string;
  pagination: ApiPagination;
}

// ─── Flow Diagram Shared Types ────────────────────────────────────────────────

export interface BaseNode {
  id: string;
  type: 'source' | 'transform' | 'target' | 'config';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface BaseEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: Record<string, unknown>;
}

export interface FlowDefinition {
  name?: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export interface HistoryEntry {
  nodes: BaseNode[];
  edges: BaseEdge[];
}
