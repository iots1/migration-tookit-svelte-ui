<script lang="ts">
	import { SvelteFlow, Background, Controls, MiniMap } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import ConfigNode from '$features/pipeline-editor/components/nodes/ConfigNode.svelte';

	import type { Node, Edge, Connection } from '@xyflow/svelte';

	let {
		nodes,
		edges,
		onEdgesChange,
		onNodeDragStop
	}: {
		nodes: Node[];
		edges: Edge[];
		onEdgesChange: (edges: Edge[]) => void;
		onNodeDragStop: (node: Node) => void;
	} = $props();

	const nodeTypes = {
		config: ConfigNode
	};

	function handleConnect(params: Connection) {
		if (!params.source || !params.target) return;
		const newEdge: Edge = {
			id: `edge-${params.source}-${params.target}`,
			source: params.source,
			target: params.target,
			sourceHandle: params.sourceHandle ?? undefined,
			targetHandle: params.targetHandle ?? undefined
		};
		onEdgesChange([...edges, newEdge]);
	}
</script>

<div class="pipeline-canvas-wrapper">
		<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		onconnect={handleConnect}
		onnodedragstop={(e) => { if (e.targetNode) onNodeDragStop(e.targetNode); }}
		fitView
		snapGrid={[15, 15]}
		connectionLineStyle="stroke: var(--accent); stroke-width: 2;"
		class="pipeline-flow"
	>
		<Background gap={15} size={1} />
		<Controls position="bottom-left" />
		<MiniMap position="bottom-right" />
	</SvelteFlow>
</div>
