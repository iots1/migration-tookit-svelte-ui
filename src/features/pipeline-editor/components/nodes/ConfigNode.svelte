<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	let { data, selected }: NodeProps = $props();

	let label = $derived((data.label as string) || 'Config');
	let configType = $derived((data.configType as string) || 'std');
	let tableName = $derived((data.tableName as string) || '');
	let sourceInfo = $derived((data.sourceTable as string) || '');
	let targetInfo = $derived((data.targetTable as string) || '');
	let mappingCount = $derived((data.mappingCount as number) || 0);
</script>

<div class="config-node" class:config-node-selected={selected}>
	<div class="config-node-header" class:config-type-std={configType === 'std'} class:config-type-custom={configType !== 'std'}>
		<div class="config-node-type-badge">{configType}</div>
		<span class="config-node-title">{label}</span>
	</div>
	<div class="config-node-body">
		<div class="config-node-row">
			<span class="config-node-label">Table</span>
			<span class="config-node-value">{tableName}</span>
		</div>
		{#if sourceInfo && targetInfo}
			<div class="config-node-row">
				<span class="config-node-label">Flow</span>
				<span class="config-node-value config-node-flow">{sourceInfo} → {targetInfo}</span>
			</div>
		{/if}
		<div class="config-node-row">
			<span class="config-node-label">Mappings</span>
			<span class="config-node-value">{mappingCount} fields</span>
		</div>
	</div>
	<Handle type="target" position={Position.Left} class="config-handle" />
	<Handle type="source" position={Position.Right} class="config-handle" />
</div>
