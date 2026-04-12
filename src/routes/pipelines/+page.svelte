<svelte:head>
	<title>Pipelines - Migration Toolkit</title>
</svelte:head>

<script lang="ts">
	import { base } from "$app/paths";
	import { goto } from "$app/navigation";
	import "$features/pipeline-editor/pipeline-editor.css";
	import { createPipelinesListState } from "$features/pipeline-editor/state/pipelines-list-state.svelte";
	import { onMount } from "svelte";

	const state = createPipelinesListState();

	onMount(() => {
		state.fetchPipelines();
	});

	async function handleNewPipeline() {
		await goto(`${base}/pipeline-editor`);
	}

	async function handleEdit(id: string) {
		await goto(`${base}/pipeline-editor/${id}`);
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this pipeline?")) return;
		await state.deleteById(id);
	}
</script>

<div class="pipeline-list-page">
	<div class="pipeline-list-header">
		<div>
			<h2 class="pipeline-list-title">Pipelines</h2>
			<p class="pipeline-list-subtitle">Manage your data migration pipelines</p>
		</div>
		<button class="btn btn-primary" onclick={handleNewPipeline}>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<span>New Pipeline</span>
		</button>
	</div>

	<div class="pipeline-list-search">
		<div class="search-input-wrapper">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="search-icon">
				<circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
				<path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
			<input
				type="text"
				class="search-input"
				placeholder="Search pipelines..."
				value={state.searchInput}
				oninput={(e) => state.setSearchInput((e.target as HTMLInputElement).value)}
				onkeydown={(e) => e.key === "Enter" && state.search()}
			/>
			{#if state.searchInput}
				<button class="search-clear" onclick={state.clearSearch} aria-label="Clear search">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				</button>
			{/if}
		</div>
		<button class="btn btn-secondary" onclick={state.search}>Search</button>
	</div>

	{#if state.error}
		<div class="pipeline-error">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" />
				<path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
			<span>{state.error}</span>
			<button class="pipeline-error-close" onclick={state.dismissError} aria-label="Dismiss error">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	{/if}

	<div class="pipeline-table-wrapper">
		{#if state.loading}
		<div class="pipeline-list-loading">
			<div class="pipeline-loading-spinner"></div>
			<span>Loading...</span>
		</div>
		{:else if state.pipelines.length === 0}
		<div class="pipeline-list-empty">
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="empty-icon">
				<rect x="6" y="6" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" />
				<rect x="26" y="26" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" />
				<path d="M22 14h4l6 6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<circle cx="26" cy="20" r="3" stroke="currentColor" stroke-width="2" />
			</svg>
			<h3>No pipelines yet</h3>
			<p>Create your first pipeline to get started</p>
		</div>
	{:else}
		<table class="pipeline-table">
			<thead>
				<tr>
					<th class="th-name">Name</th>
					<th class="th-desc">Description</th>
					<th class="th-meta">Nodes</th>
					<th class="th-meta">Edges</th>
					<th class="th-actions">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each state.pipelines as pipeline (pipeline.id)}
					<tr>
						<td class="td-name">
							<span class="pipeline-name-cell">{pipeline.name}</span>
						</td>
						<td class="td-desc">
							<span class="pipeline-desc-cell">{pipeline.description || "-"}</span>
						</td>
						<td class="td-meta">{pipeline.nodes_count}</td>
						<td class="td-meta">{pipeline.edges_count}</td>
						<td class="td-actions">
							<button class="action-btn action-btn-edit" onclick={() => handleEdit(pipeline.id)} title="Edit">
								<svg width="15" height="15" viewBox="0 0 16 16" fill="none">
									<path d="M11.5 1.5l3 3M2.5 14.5l8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
									<path d="M14.5 4.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
							<button class="action-btn action-btn-delete" onclick={() => handleDelete(pipeline.id)} title="Delete">
								<svg width="15" height="15" viewBox="0 0 16 16" fill="none">
									<path d="M2 4h12M5 4l-3 3v7l3 3h4l3-3V7l-3-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
									<path d="M3 4l10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	</div>

	{#if state.totalPages > 1}
		<div class="pagination">
		<button class="pagination-btn" disabled={state.currentPage <= 1} onclick={() => state.goToPage(state.currentPage - 1)} aria-label="Previous page">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M9 3L4 7l5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		{#each Array.from({ length: state.totalPages }, (_, i) => i + 1) as page (page)}
			<button
				class="pagination-btn pagination-btn-page"
				class:pagination-btn-active={page === state.currentPage}
				onclick={() => state.goToPage(page)}
			>
				{page}
			</button>
		{/each}

		<button class="pagination-btn" disabled={state.currentPage >= state.totalPages} onclick={() => state.goToPage(state.currentPage + 1)} aria-label="Next page">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M5 3l5 4-5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<span class="pagination-info">
			{state.totalRecords} record{state.totalRecords !== 1 ? "s" : ""}
		</span>
	</div>
	{/if}
</div>
