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
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    onNodeEdit,
    onNodeSelect,
  }: {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: (nodes: Node[]) => void;
    onEdgesChange: (edges: Edge[]) => void;
    onNodeDragStop: (node: Node) => void;
    onNodeEdit?: (configId: string) => void;
    onNodeSelect?: (nodeId: string | null) => void;
  } = $props();

  let nodesWithHandler = $state.raw<Node[]>([]);

  $effect(() => {
    nodesWithHandler = onNodeEdit
      ? nodes.map((n) => ({
          ...n,
          data: { ...n.data, onEdit: onNodeEdit },
        }))
      : nodes;
  });

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
    nodes: deletedNodes,
    edges: deletedEdges,
  }: {
    nodes: Node[];
    edges: Edge[];
  }) {
    const deletedNodeIds = new Set(deletedNodes.map((n) => n.id));

    if (deletedNodeIds.size > 0) {
      const remainingNodes = nodes.filter((n) => !deletedNodeIds.has(n.id));
      const remainingEdges = edges.filter(
        (e) => !deletedNodeIds.has(e.source) && !deletedNodeIds.has(e.target)
      );
      onNodesChange(remainingNodes);
      onEdgesChange(remainingEdges);
      return;
    }

    if (deletedEdges.length > 0) {
      const deletedEdgeIds = new Set(deletedEdges.map((e) => e.id));
      onEdgesChange(edges.filter((e) => !deletedEdgeIds.has(e.id)));
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
    onnodeclick={({ node }) => {
      if (onNodeSelect) onNodeSelect(node.id);
    }}
    onpaneclick={() => {
      if (onNodeSelect) onNodeSelect(null);
    }}
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
