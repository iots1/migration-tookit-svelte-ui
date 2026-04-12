<svelte:head>
	<title>Pipelines - Migration Toolkit</title>
</svelte:head>

<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { listPipelines, deletePipeline } from "$features/pipeline-editor/api";
	import type { PipelineListItem } from "$core/types/pipeline";
	import "$features/pipeline-editor/pipeline-editor.css";

	let pipelines = $state<PipelineListItem[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentPage = $state(1);
	let pageSize = $state(10);
	let totalPages = $state(1);
	let totalRecords = $state(0);
	let searchQuery = $state("");
	let searchInput = $state("");

	async function fetchPipelines() {
		try {
			loading = true;
			error = null;
			const response = await listPipelines({
				page: currentPage,
				limit: pageSize,
				search: searchQuery || undefined
			});
			pipelines = response.data;
			totalPages = response.meta.pagination.total_pages;
			totalRecords = response.meta.pagination.total_records;
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to load pipelines";
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchPipelines();
	});

	function handleSearch() {
		searchQuery = searchInput;
		currentPage = 1;
		fetchPipelines();
	}

	function handleClearSearch() {
		searchInput = "";
		searchQuery = "";
		currentPage = 1;
		fetchPipelines();
	}

	function handleNewPipeline() {
		goto("/pipeline-editor");
	}

	function handleEdit(id: string) {
		goto(`/pipeline-editor/${id}`);
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this pipeline?")) return;

		try {
			await deletePipeline(id);
			await fetchPipelines();
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to delete pipeline";
		}
	}

	function goToPage(page: number) {
		currentPage = page;
		fetchPipelines();
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
				bind:value={searchInput}
				onkeydown={(e) => e.key === "Enter" && handleSearch()}
			/>
			{#if searchInput}
				<button class="search-clear" onclick={handleClearSearch} aria-label="Clear search">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				</button>
			{/if}
		</div>
		<button class="btn btn-secondary" onclick={handleSearch}>Search</button>
	</div>

	{#if error}
		<div class="pipeline-error">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" />
				<path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
			<span>{error}</span>
			<button class="pipeline-error-close" onclick={() => (error = null)} aria-label="Dismiss error">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	{/if}

	<div class="pipeline-table-wrapper">
		{#if loading}
		<div class="pipeline-list-loading">
			<div class="pipeline-loading-spinner"></div>
			<span>Loading...</span>
		</div>
	{:else if pipelines.length === 0}
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
				{#each pipelines as pipeline (pipeline.id)}
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

	{#if totalPages > 1}
		<div class="pagination">
		<button class="pagination-btn" disabled={currentPage <= 1} onclick={() => goToPage(currentPage - 1)} aria-label="Previous page">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M9 3L4 7l5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
			<button
				class="pagination-btn pagination-btn-page"
				class:pagination-btn-active={page === currentPage}
				onclick={() => goToPage(page)}
			>
				{page}
			</button>
		{/each}

		<button class="pagination-btn" disabled={currentPage >= totalPages} onclick={() => goToPage(currentPage + 1)} aria-label="Next page">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M5 3l5 4-5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<span class="pagination-info">
			{totalRecords} record{totalRecords !== 1 ? "s" : ""}
		</span>
	</div>
	{/if}
</div>
