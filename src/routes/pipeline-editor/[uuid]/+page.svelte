<script lang="ts">
  import { SvelteFlowProvider, type Edge, type Node } from '@xyflow/svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import PipelineToolbar from '$features/pipeline-editor/components/controls/PipelineToolbar.svelte';
  import EditConfigDrawer from '$features/pipeline-editor/components/EditConfigDrawer.svelte';
  import JobHistoryModal from '$features/pipeline-editor/components/JobHistoryModal.svelte';
  import PipelineDrawer from '$features/pipeline-editor/components/PipelineDrawer.svelte';
  import { showToast } from '$lib/toast.svelte';

  import '$features/pipeline-editor/pipeline-editor.scss';

  import PipelineCanvas from '$features/pipeline-editor/PipelineCanvas.svelte';
  import { createEditorState } from '$features/pipeline-editor/state/editor-state.svelte';

  const editor = createEditorState();

  let isJobHistoryOpen = $state(false);
  let editingConfigId = $state<string | null>(null);
  let initialJobId = $state<string | null>(null);

  let editUuid = $derived(page.params.uuid);

  function handleEditConfig(configId: string) {
    editingConfigId = configId;
  }

  async function handleConfigSaved(configId: string) {
    await editor.updateNodeFromConfig(configId);
    editingConfigId = null;
  }

  onMount(async () => {
    await editor.initialize(editUuid ?? 'new');
  });

  function handleAddConfig(config: Parameters<typeof editor.addConfigNode>[0]) {
    editor.addConfigNode(config);
  }

  function handleNodesChange(updatedNodes: Node[]) {
    editor.setNodes(updatedNodes as unknown as typeof editor.nodes);
    editor.pushHistory();
    editor.scheduleAutoSave();
  }

  function handleEdgesChange(edges: Edge[]) {
    editor.setEdges(edges as unknown as typeof editor.edges);
    editor.pushHistory();
    editor.scheduleAutoSave();
  }

  function handleNodeDragStop(node: Node) {
    editor.updateNodePosition(node.id, node.position);
  }

  async function handleSave(name: string, description: string) {
    const id = await editor.save(name, description);
    if (id) {
      showToast('Saved successfully');
      if (!editUuid || editUuid === 'new') {
        await goto(`/pipeline-editor/${id}`);
      }
      editor.closeDrawer();
    }
  }

  async function handleSaveRun() {
    const name = editor.pipelineName || `Pipeline ${Date.now()}`;
    const description = editor.pipelineDescription || '';

    if (editor.nodes.length === 0) {
      editor.setError('Add at least one config node before running');
      return;
    }

    const jobId = await editor.saveAndCreateJob(name, description);
    if (!jobId) return;

    if (!editUuid || editUuid === 'new') {
      const id = editor.pipelineId;
      if (id) {
        await goto(`/pipeline-editor/${id}`);
      }
    }
    editor.closeDrawer();

    initialJobId = jobId;
    isJobHistoryOpen = true;
  }
</script>

<svelte:head>
  <title>Pipeline Editor - Migration Toolkit</title>
</svelte:head>

<div class="pipeline-page">
  {#if editor.error}
    <div class="pipeline-error">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="6.5"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M8 5v3.5M8 10.5v.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <span>{editor.error}</span>
      <button
        class="pipeline-error-close"
        onclick={() => editor.setError(null)}
        aria-label="Dismiss error"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  {/if}

  <PipelineToolbar
    pipelineName={editor.pipelineName || 'Untitled'}
    canUndo={editor.canUndo}
    canRedo={editor.canRedo}
    saving={editor.saving}
    running={false}
    isEditMode={editUuid !== 'new'}
    onOpenDrawer={() => editor.openDrawer()}
    onAddConfig={handleAddConfig}
    onSave={() => handleSave(editor.pipelineName, editor.pipelineDescription)}
    onSaveRun={handleSaveRun}
    onUndo={() => editor.undo()}
    onRedo={() => editor.redo()}
    onOpenJobHistory={() => {
      initialJobId = null;
      isJobHistoryOpen = true;
    }}
  />

  <div class="pipeline-canvas-area">
    {#if editor.loading}
      <div class="pipeline-loading">
        <div class="pipeline-loading-spinner"></div>
        <span>Loading...</span>
      </div>
    {:else if editor.nodes.length === 0}
      <div class="pipeline-empty">
        <div class="pipeline-empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect
              x="6"
              y="6"
              width="16"
              height="16"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <rect
              x="26"
              y="26"
              width="16"
              height="16"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M22 14h4l6 6v4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="26"
              cy="20"
              r="3"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </div>
        <h3>Start building your pipeline</h3>
        <p>
          Click "Add Config" above to load config nodes, then connect them to
          define your data pipeline.
        </p>
      </div>
    {:else}
      <SvelteFlowProvider>
        <PipelineCanvas
          nodes={editor.nodes as unknown as Node[]}
          edges={editor.edges as unknown as Edge[]}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onNodeEdit={handleEditConfig}
        />
      </SvelteFlowProvider>
    {/if}
  </div>

  <PipelineDrawer
    open={editor.isDrawerOpen}
    name={editor.pipelineName}
    description={editor.pipelineDescription}
    nodes={editor.nodes}
    edges={editor.edges}
    onClose={() => editor.closeDrawer()}
    onSave={handleSave}
  />

  <JobHistoryModal
    open={isJobHistoryOpen}
    pipelineId={editUuid ?? ''}
    {initialJobId}
    onClose={() => {
      isJobHistoryOpen = false;
      initialJobId = null;
    }}
  />

  <EditConfigDrawer
    open={editingConfigId !== null}
    configId={editingConfigId}
    onClose={() => (editingConfigId = null)}
    onSaved={handleConfigSaved}
  />
</div>
