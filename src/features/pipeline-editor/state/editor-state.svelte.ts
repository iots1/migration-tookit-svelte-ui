import type { FlowDefinition } from '$core/types/pipeline';

export function createEditorState() {
	let nodes = $state<FlowDefinition['nodes']>([]);
	let edges = $state<FlowDefinition['edges']>([]);
	let selectedNodeId = $state<string | null>(null);

	return {
		get nodes() {
			return nodes;
		},
		get edges() {
			return edges;
		},
		get selectedNodeId() {
			return selectedNodeId;
		},
		setNodes(value: FlowDefinition['nodes']) {
			nodes = value;
		},
		setEdges(value: FlowDefinition['edges']) {
			edges = value;
		},
		selectNode(id: string | null) {
			selectedNodeId = id;
		}
	};
}
