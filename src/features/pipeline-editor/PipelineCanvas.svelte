<script lang="ts">
  import {
    Background,
    Controls,
    MiniMap,
    SvelteFlow,
    type Connection,
    type Edge,
    type Node,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import ConfigNode from '$features/pipeline-editor/components/nodes/ConfigNode.svelte';

  let {
    nodes,
    edges,
    onEdgesChange,
    onNodeDragStop,
    onNodeEdit,
  }: {
    nodes: Node[];
    edges: Edge[];
    onEdgesChange: (edges: Edge[]) => void;
    onNodeDragStop: (node: Node) => void;
    onNodeEdit?: (configId: string) => void;
  } = $props();

  let nodesWithHandler = $derived(
    onNodeEdit
      ? nodes.map((n) => ({
          ...n,
          data: { ...n.data, onEdit: onNodeEdit },
        }))
      : nodes
  );

  const nodeTypes = {
    config: ConfigNode,
  };

  function handleConnect(params: Connection) {
    if (!params.source || !params.target) return;
    const newEdge: Edge = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle ?? undefined,
      targetHandle: params.targetHandle ?? undefined,
    };
    onEdgesChange([...edges, newEdge]);
  }

  function handleDelete({
    edges: deletedEdges,
  }: {
    nodes: Node[];
    edges: Edge[];
  }) {
    if (deletedEdges.length > 0) {
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      onEdgesChange(edges.filter((e) => !deletedIds.has(e.id)));
    }
  }
</script>

<div class="pipeline-canvas-wrapper">
  <SvelteFlow
    nodes={nodesWithHandler}
    {edges}
    {nodeTypes}
    onconnect={handleConnect}
    ondelete={handleDelete}
    onnodedragstop={(e) => {
      if (e.targetNode) onNodeDragStop(e.targetNode);
    }}
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
