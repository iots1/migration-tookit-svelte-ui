<script lang="ts">
	import type { BaseNode } from "$core/types/pipeline";

	let {
		open,
		name,
		description,
		nodes,
		edges,
		onClose,
		onSave
	}: {
		open: boolean;
		name: string;
		description: string;
		nodes: BaseNode[];
		edges: unknown[];
		onClose: () => void;
		onSave: (name: string, description: string) => void;
	} = $props();

	let localName = $state('');
	let localDescription = $state('');

	$effect(() => {
		localName = name;
		localDescription = description;
	});

	function handleSave() {
		onSave(localName, localDescription);
	}

	function handleOverlayClick() {
		onClose();
	}

	function handleDrawerClick(e: MouseEvent) {
		e.stopPropagation();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="drawer-overlay drawer-overlay-open" onclick={handleOverlayClick} onkeydown={handleKeydown}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="drawer drawer-open" role="dialog" aria-label="Pipeline Settings" tabindex="-1" onclick={handleDrawerClick} onkeydown={(e) => e.stopPropagation()}>
		<div class="drawer-header">
			<h3 class="drawer-title">Pipeline Settings</h3>
			<button class="drawer-close" onclick={onClose} aria-label="Close">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<div class="drawer-body">
			<div class="form-group">
				<label class="form-label" for="pipeline-name">Name</label>
				<input
					id="pipeline-name"
					type="text"
					class="form-input"
					placeholder="Pipeline name..."
					bind:value={localName}
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="pipeline-description">Description</label>
				<textarea
					id="pipeline-description"
					class="form-textarea"
					rows="3"
					placeholder="Describe what this pipeline does..."
					bind:value={localDescription}
				></textarea>
			</div>

			<div class="form-group">
				<span class="form-label">Pipeline Summary</span>
				<div class="pipeline-summary">
					<div class="summary-item">
						<span class="summary-label">Nodes</span>
						<span class="summary-value">{nodes.length}</span>
					</div>
					<div class="summary-item">
						<span class="summary-label">Edges</span>
						<span class="summary-value">{edges.length}</span>
					</div>
				</div>
			</div>

			{#if nodes.length > 0}
				<div class="form-group">
					<span class="form-label">Nodes ({nodes.length})</span>
					<div class="nodes-list">
						{#each nodes as node (node.id)}
							<div class="node-item">
								<span class="node-item-name">{node.data.label as string}</span>
								<span class="node-item-table">{node.data.tableName as string}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="drawer-footer">
			<button class="btn btn-secondary" onclick={onClose}>Cancel</button>
			<button class="btn btn-primary" onclick={handleSave}>Save</button>
		</div>
	</div>
{/if}
