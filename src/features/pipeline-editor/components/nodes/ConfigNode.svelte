<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  let { data, selected }: NodeProps = $props();

  let label = $derived((data.label as string) || 'Config');
  let configType = $derived((data.configType as string) || 'std');
  let tableName = $derived((data.tableName as string) || '');
  let sourceInfo = $derived((data.sourceTable as string) || '');
  let targetInfo = $derived((data.targetTable as string) || '');
  let mappingCount = $derived((data.mappingCount as number) || 0);
</script>

<div class="config-node" class:config-node-selected={selected}>
  <div
    class="config-node-header"
    class:config-type-std={configType === 'std'}
    class:config-type-custom={configType !== 'std'}
  >
    <div class="config-node-type-badge">{configType}</div>
    <span class="config-node-title">{label}</span>
    <button
      class="config-node-edit-btn"
      onclick={(e) => {
        e.stopPropagation();
        const onEdit = data.onEdit as ((id: string) => void) | undefined;
        if (onEdit) {
          onEdit(data.configId as string);
        }
      }}
      aria-label="Edit config"
      title="Edit"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M11.333 2L14 4.667L4.5 14.167H1.833V11.5L11.333 2Z"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
  <div class="config-node-body">
    <div class="config-node-row">
      <span class="config-node-label">Table</span>
      <span class="config-node-value">{tableName}</span>
    </div>
    {#if sourceInfo && targetInfo}
      <div class="config-node-row">
        <span class="config-node-label">Flow</span>
        <span class="config-node-value config-node-flow"
          >{sourceInfo} → {targetInfo}</span
        >
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
