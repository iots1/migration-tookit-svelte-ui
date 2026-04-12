<svelte:head>
	<title>Pipeline Editor - Migration Toolkit</title>
</svelte:head>

<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import type { ConfigItem } from "$core/types/pipeline";
	import {
	  loadConfigs,
	  loadPipeline,
	  reconstructPipelineFromEntity,
	  runPipeline,
	  savePipeline,
	  toPipelineSavePayload
	} from "$features/pipeline-editor/api";
	import PipelineToolbar from "$features/pipeline-editor/components/controls/PipelineToolbar.svelte";
	import PipelineDrawer from "$features/pipeline-editor/components/PipelineDrawer.svelte";
	import "$features/pipeline-editor/pipeline-editor.css";
	import PipelineCanvas from "$features/pipeline-editor/PipelineCanvas.svelte";
	import { createEditorState } from "$features/pipeline-editor/state/editor-state.svelte";
	import type { Edge, Node } from "@xyflow/svelte";
	import { SvelteFlowProvider } from "@xyflow/svelte";
	import { onMount, tick } from "svelte";

	const state = createEditorState();

	let editUuid = $derived(page.params.uuid as string | undefined);

	onMount(async () => {
		try {
			state.setLoading(true);
			const configs = await loadConfigs();
			state.setConfigs(configs);

			if (editUuid) {
				const entity = await loadPipeline(editUuid);
				const result = await reconstructPipelineFromEntity(entity, configs);
				state.setPipelineFromLoad(result.name, result.description, result.nodes, result.edges);
				state.setPipelineId(editUuid);
			}
		} catch (err) {
			state.setError(err instanceof Error ? err.message : "Failed to load data");
		} finally {
			state.setLoading(false);
		}
	});

	function handleAddConfig(config: ConfigItem) {
		state.addConfigNode(config);
	}

	function handleEdgesChange(edges: Edge[]) {
		state.setEdges(edges as unknown as typeof state.edges);
		state.pushHistory();
	}

	async function handleSave(name: string, description: string) {
		if (state.nodes.length === 0) {
			state.setError("Add at least one config node before saving");
			return;
		}

		try {
			state.setSaving(true);
			state.setError(null);
			state.setPipelineName(name);
			state.setPipelineDescription(description);

			const payload = toPipelineSavePayload(name, description, state.nodes, state.edges);
			const result = await savePipeline(payload);
			state.setPipelineId(result.id);

			if (!editUuid) {
				await tick();
				goto(`/pipeline-editor/${result.id}`, { replaceState: true });
			}

			state.closeDrawer();
		} catch (err) {
			state.setError(err instanceof Error ? err.message : "Failed to save pipeline");
		} finally {
			state.setSaving(false);
		}
	}

	async function handleSaveRun() {
		if (state.nodes.length === 0) {
			state.setError("Add at least one config node before saving");
			return;
		}

		const name = state.pipelineName || `Pipeline ${new Date().toISOString()}`;
		const description = state.pipelineDescription || "";

		try {
			state.setSaving(true);
			state.setError(null);

			const payload = toPipelineSavePayload(name, description, state.nodes, state.edges);
			const result = await savePipeline(payload);
			state.setPipelineId(result.id);

			if (!editUuid) {
				await tick();
				goto(`/pipeline-editor/${result.id}`, { replaceState: true });
			}

			state.setRunning(true);
			const runResult = await runPipeline(result.id);
			alert(`Job started: ${runResult.job_id} - ${runResult.message}`);
		} catch (err) {
			state.setError(err instanceof Error ? err.message : "Failed to save or run pipeline");
		} finally {
			state.setSaving(false);
			state.setRunning(false);
		}
	}
</script>

<div class="pipeline-page">
	{#if state.error}
	<div class="pipeline-error">
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" />
			<path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		</svg>
		<span>{state.error}</span>
		<button class="pipeline-error-close" onclick={() => state.setError(null)} aria-label="Dismiss error">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
		</button>
	</div>
	{/if}

	<PipelineToolbar
		pipelineName={state.pipelineName || "Untitled"}
		canUndo={state.canUndo}
		canRedo={state.canRedo}
		saving={state.saving}
		running={state.running}
		configs={state.configs}
		onOpenDrawer={() => state.openDrawer()}
		onAddConfig={handleAddConfig}
		onSave={() => handleSave(state.pipelineName, state.pipelineDescription)}
		onSaveRun={handleSaveRun}
		onUndo={() => state.undo()}
		onRedo={() => state.redo()}
	/>

	<div class="pipeline-canvas-area">
		{#if state.loading}
			<div class="pipeline-loading">
				<div class="pipeline-loading-spinner"></div>
				<span>Loading...</span>
			</div>
		{:else if state.nodes.length === 0}
			<div class="pipeline-empty">
				<div class="pipeline-empty-icon">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<rect x="6" y="6" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" />
						<rect x="26" y="26" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" />
						<path d="M22 14h4l6 6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						<circle cx="26" cy="20" r="3" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3>Start building your pipeline</h3>
				<p>Click "Add Config" above to load config nodes, then connect them to define your data pipeline.</p>
			</div>
		{:else}
			<SvelteFlowProvider>
				<PipelineCanvas
					nodes={state.nodes as unknown as Node[]}
					edges={state.edges as unknown as Edge[]}
					onEdgesChange={handleEdgesChange}
				/>
			</SvelteFlowProvider>
		{/if}
	</div>

	<PipelineDrawer
		open={state.isDrawerOpen}
		name={state.pipelineName}
		description={state.pipelineDescription}
		nodes={state.nodes}
		edges={state.edges}
		onClose={() => state.closeDrawer()}
		onSave={handleSave}
	/>
</div>
