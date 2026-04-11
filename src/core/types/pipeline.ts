export interface BaseNode {
	id: string;
	type: 'source' | 'transform' | 'target';
	position: { x: number; y: number };
	data: Record<string, unknown>;
}

export interface BaseEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface FlowDefinition {
	nodes: BaseNode[];
	edges: BaseEdge[];
}
