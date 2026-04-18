<script lang="ts">
  import { SvelteFlowProvider, type Edge, type Node } from '@xyflow/svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import type { ConfigItem } from '$core/types/pipeline';
  import {
    createJob,
    loadConfigs,
    loadPipeline,
    reconstructPipelineFromEntity,
  } from '$features/pipeline-editor/api';
  import PipelineToolbar from '$features/pipeline-editor/components/controls/PipelineToolbar.svelte';
  import EditConfigDrawer from '$features/pipeline-editor/components/EditConfigDrawer.svelte';
  import JobProgress from '$features/pipeline-editor/components/JobProgress.svelte';
  import PipelineDrawer from '$features/pipeline-editor/components/PipelineDrawer.svelte';
  import { showToast } from '$lib/toast.svelte';

  import '$features/pipeline-editor/pipeline-editor.scss';

  import PipelineCanvas from '$features/pipeline-editor/PipelineCanvas.svelte';
  import { createEditorState } from '$features/pipeline-editor/state/editor-state.svelte';
  import { createJobState } from '$features/pipeline-editor/state/job-state.svelte';

  const editor = createEditorState();
  const jobState = createJobState();

  let isJobDrawerOpen = $state(false);
  let editingConfigId = $state<string | null>(null);

  let editUuid = $derived(page.params.uuid);

  function handleEditConfig(configId: string) {
    editingConfigId = configId;
  }

  async function handleConfigSaved(configId: string) {
    const configs = await loadConfigs();
    editor.setConfigs(configs);
    const updated = configs.find((c) => c.id === configId);
    if (updated) {
      const jsonData = updated.attributes.json_data as unknown as Record<
        string,
        unknown
      >;
      const source = (jsonData.source ?? {}) as Record<string, unknown>;
      const target = (jsonData.target ?? {}) as Record<string, unknown>;
      const mappings = (jsonData.mappings ?? []) as unknown[];

      editor.setNodes(
        editor.nodes.map((n) =>
          (n.data.configId as string) === configId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: updated.attributes.config_name,
                  configType: updated.attributes.config_type,
                  tableName: updated.attributes.table_name,
                  sourceTable: (source.table as string) ?? '',
                  targetTable: (target.table as string) ?? '',
                  mappingCount: mappings.length,
                },
              }
            : n
        )
      );
    }
    editingConfigId = null;
  }

  onMount(async () => {
    try {
      editor.setLoading(true);
      const configs = await loadConfigs();
      editor.setConfigs(configs);

      if (editUuid && editUuid !== 'new') {
        const entity = await loadPipeline(editUuid);
        const result = await reconstructPipelineFromEntity(entity, configs);
        editor.setPipelineFromLoad(
          result.name,
          result.description,
          result.nodes,
          result.edges
        );
        editor.setPipelineId(editUuid);
      }
    } catch (err) {
      editor.setError(
        err instanceof Error ? err.message : 'Failed to load data'
      );
    } finally {
      editor.setLoading(false);
    }
  });

  function handleAddConfig(config: ConfigItem) {
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
      showToast('บันทึกสำเร็จ');
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

    try {
      const id = await editor.save(name, description);
      if (!id) return;

      if (!editUuid || editUuid === 'new') {
        await goto(`/pipeline-editor/${id}`);
      }
      editor.closeDrawer();

      const jobResponse = await createJob({ pipeline_id: id });
      jobState.connect(jobResponse.job_id, jobResponse.run_id);
      isJobDrawerOpen = true;
    } catch (err) {
      editor.setError(
        err instanceof Error ? err.message : 'Failed to start job'
      );
    }
  }

  function handleCloseJobProgress() {
    isJobDrawerOpen = false;
    jobState.disconnect();
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
    running={jobState.active}
    configs={editor.configs}
    onOpenDrawer={() => editor.openDrawer()}
    onAddConfig={handleAddConfig}
    onSave={() => handleSave(editor.pipelineName, editor.pipelineDescription)}
    onSaveRun={handleSaveRun}
    onUndo={() => editor.undo()}
    onRedo={() => editor.redo()}
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

  <JobProgress
    open={isJobDrawerOpen}
    active={jobState.active}
    status={jobState.status}
    jobId={jobState.jobId}
    runId={jobState.runId}
    currentStep={jobState.currentStep}
    totalRows={jobState.totalRows}
    batches={jobState.batches}
    errorMessage={jobState.errorMessage}
    onClose={handleCloseJobProgress}
  />

  <EditConfigDrawer
    open={editingConfigId !== null}
    configId={editingConfigId}
    onClose={() => (editingConfigId = null)}
    onSaved={handleConfigSaved}
  />
</div>
