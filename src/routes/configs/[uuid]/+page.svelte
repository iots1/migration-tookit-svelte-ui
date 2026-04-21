<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import type { DatasourceItem } from '$core/types/db-explorer';
  import type { ValueMapParams } from '$core/types/schema-mapper';
  import { listDatasources } from '$features/db-explorer/api';
  import SqlEditor from '$features/db-explorer/components/SqlEditor.svelte';
  import { createFieldMappingState } from '$features/schema-mapper/state/field-mapping-state.svelte';
  import BadgeList from '$lib/components/BadgeList.svelte';
  import ItemSelectorDrawer from '$lib/components/ItemSelectorDrawer.svelte';
  import SqlGuideModal from '$lib/components/SqlGuideModal.svelte';
  import ValueMapParamsDrawer from '$lib/components/ValueMapParamsDrawer.svelte';
  import { showToast } from '$lib/toast.svelte';

  import '$features/schema-mapper/schema-mapper.scss';

  const rawId = $derived(page.url.pathname.split('/').pop() ?? 'new');

  const fm = $derived.by(() => {
    const mode = rawId === 'new' ? 'create' : 'edit';
    const configId = rawId === 'new' ? null : rawId;
    return createFieldMappingState(mode, configId);
  });

  let datasources = $state<DatasourceItem[]>([]);
  const emptyValueMapParams: ValueMapParams = { rules: [], default: null };

  // Drawer state
  let showTransformerDrawer = $state(false);
  let showValidatorDrawer = $state(false);
  let showValueMapDrawer = $state(false);
  let showSqlGuide = $state(false);
  let currentMappingIndex = $state(-1);

  let activeMappings = $derived(
    fm.mappings.filter((m) => !m.ignore && m.targetColumn).length
  );

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (fm.isDirty) {
      e.preventDefault();
    }
  }

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  onMount(async () => {
    try {
      const items = await listDatasources();
      datasources = items;
    } catch {
      console.error('Failed to load datasources');
    }
    if (rawId !== 'new') {
      await fm.loadConfig(rawId);
    }
    await fm.loadOptions();
  });

  async function handleSave() {
    const savedId = await fm.save();
    if (savedId) {
      // cspell:disable-next-line
      showToast('บันทึกสำเร็จ');
      if (rawId === 'new') {
        await goto(`/configs/${savedId}`, {
          replaceState: true,
        });
      }
    }
  }

  function handleBack() {
    if (fm.isDirty && !confirm('You have unsaved changes. Leave anyway?')) {
      return;
    }
    void goto(resolve('/configs'));
  }

  function stepClass(step: number): string {
    if (step === fm.currentStep) return 'sm-step--active';
    if (step < fm.currentStep) return 'sm-step--completed';
    if (step <= fm.maxReachedStep) return 'sm-step--default';
    return 'sm-step--disabled';
  }

  function connectorClass(step: number): string {
    if (step < fm.currentStep) return 'sm-step-connector--completed';
    if (step === fm.currentStep) return 'sm-step-connector--active';
    return '';
  }

  const stepLabels = ['Config Type', 'Source', 'Target', 'Field Mapping'];

  function openTransformerDrawer(index: number) {
    currentMappingIndex = index;
    showTransformerDrawer = true;
  }

  function openValidatorDrawer(index: number) {
    currentMappingIndex = index;
    showValidatorDrawer = true;
  }

  function handleTransformerApply(
    selected: string[],
    defaults: Record<string, string>
  ) {
    if (currentMappingIndex >= 0) {
      const currentParams =
        fm.mappings[currentMappingIndex]?.transformerParams ?? {};
      const newParams: Record<string, unknown> = {};
      for (const name of selected) {
        const existing = currentParams[name];
        const defaultVal = defaults[name];
        if (existing !== null && typeof existing === 'object') {
          newParams[name] = defaultVal
            ? {
                ...(existing as Record<string, unknown>),
                default_value: defaultVal,
              }
            : existing;
        } else if (defaultVal) {
          newParams[name] = { default_value: defaultVal };
        }
      }
      fm.updateMapping(currentMappingIndex, {
        transformers: selected,
        transformerParams: newParams,
      });
    }
  }

  function handleValidatorApply(
    selected: string[],
    _defaults: Record<string, string>
  ) {
    if (currentMappingIndex >= 0) {
      fm.updateMapping(currentMappingIndex, { validators: selected });
    }
  }

  function openValueMapDrawer(index: number) {
    currentMappingIndex = index;
    showValueMapDrawer = true;
  }

  function handleValueMapSave(params: ValueMapParams) {
    if (currentMappingIndex >= 0) {
      const mapping = fm.mappings[currentMappingIndex];
      if (mapping) {
        fm.updateMapping(currentMappingIndex, {
          transformerParams: {
            ...mapping.transformerParams,
            VALUE_MAP: params,
          },
        });
      }
    }
  }
</script>

<svelte:head>
  <title>{rawId === 'new' ? 'New Config' : 'Edit Config'} - Schema Mapper</title
  >
</svelte:head>

{#if fm.loading}
  <div class="pipeline-list-loading" style="padding: 120px 20px;">
    <div class="pipeline-loading-spinner"></div>
    <span>Loading config...</span>
  </div>
{:else}
  <div class="sm-wizard">
    <div
      style="display: flex; justify-content: space-between; align-items: center;"
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="btn btn-secondary" onclick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Back
        </button>
        <h2
          style="color: var(--text-primary); font-size: 18px; font-weight: 700; margin: 0;"
        >
          {rawId === 'new' ? 'New Config' : fm.configName || 'Edit Config'}
        </h2>
      </div>
      <button
        class="btn btn-primary"
        onclick={handleSave}
        disabled={fm.saving || !fm.configName.trim()}
      >
        {#if fm.saving}
          <span
            class="spin"
            style="width: 14px; height: 14px; border-width: 2px;"
          ></span>
          Saving...
        {:else}
          Save
        {/if}
      </button>
    </div>

    {#if fm.error}
      <div class="sm-error-banner">
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
        <span>{fm.error}</span>
        <button
          class="sm-error-close"
          onclick={() => fm.clearError()}
          aria-label="Dismiss"
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

    <div class="sm-wizard-steps">
      {#each stepLabels as label, i (i)}
        {@const step = i + 1}
        {#if fm.configType === 'std' || step === 1}
          <button
            class="sm-step {stepClass(step)}"
            onclick={() => fm.goToStep(step)}
            disabled={step > fm.maxReachedStep}
          >
            <span class="sm-step-number">
              {#if step < fm.currentStep}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {:else}
                {step}
              {/if}
            </span>
            <span class="sm-step-label">{label}</span>
          </button>
          {#if i < stepLabels.length - 1 && fm.configType === 'std'}
            <div class="sm-step-connector {connectorClass(step)}"></div>
          {/if}
        {/if}
      {/each}
    </div>

    <!-- Step 1: Config Type -->
    {#if fm.currentStep === 1}
      <div class="sm-card">
        <div class="sm-card-header">
          <span class="sm-card-title">Configuration Type</span>
        </div>
        <div class="sm-card-body">
          <div class="form-group">
            <label class="form-label" for="config-name">Config Name</label>
            <input
              id="config-name"
              type="text"
              class="form-input"
              placeholder="e.g. patients_mapping"
              value={fm.configName}
              oninput={(e) =>
                fm.setConfigName((e.target as HTMLInputElement).value)}
            />
          </div>

          <fieldset class="form-group">
            <legend class="form-label">Type</legend>
            <div class="sm-type-group">
              <label
                class="sm-type-option sm-type-option--active={fm.configType ===
                  'std'}"
              >
                <input
                  type="radio"
                  name="configType"
                  class="sm-type-radio"
                  checked={fm.configType === 'std'}
                  onchange={() => fm.setConfigType('std')}
                />
                <div>
                  <div class="sm-type-label">Standard (std)</div>
                  <div class="sm-type-desc">
                    Map source columns to target columns with field mapping
                    table
                  </div>
                </div>
              </label>
              <label
                class="sm-type-option sm-type-option--active={fm.configType ===
                  'custom'}"
              >
                <input
                  type="radio"
                  name="configType"
                  class="sm-type-radio"
                  checked={fm.configType === 'custom'}
                  onchange={() => fm.setConfigType('custom')}
                />
                <div>
                  <div class="sm-type-label">Custom</div>
                  <div class="sm-type-desc">
                    Write your own SQL script directly
                  </div>
                </div>
              </label>
            </div>
          </fieldset>

          {#if fm.configType === 'custom'}
            <div class="form-group">
              <label class="form-label" for="custom-target-ds"
                >Target Datasource</label
              >
              <select
                id="custom-target-ds"
                class="form-input"
                disabled={fm.loadingTables}
                onchange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  const ds = datasources.find((d) => d.id === val);
                  void fm.setTargetDatasource({
                    id: val || null,
                    name: ds?.name ?? null,
                    dbname: ds?.dbname ?? null,
                  });
                }}
              >
                <option value="" disabled selected={!fm.targetDatasourceId}>
                  {fm.loadingTables ? 'Loading...' : 'Select datasource'}
                </option>
                {#each datasources as ds (ds.id)}
                  <option
                    value={ds.id}
                    selected={ds.id === fm.targetDatasourceId}
                  >
                    {ds.name} ({ds.db_type})
                  </option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <div
                style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;"
              >
                <div class="form-label" style="margin: 0;">SQL Script</div>
                <button
                  class="btn btn-secondary"
                  onclick={() => (showSqlGuide = true)}
                  style="padding: 4px 12px; font-size: 12px; display: flex; align-items: center; gap: 6px;"
                  title="View SQL Script Guide"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 2.5v9M3 6.5l-1.5 1.5 1.5 1.5M11 6.5l1.5 1.5-1.5 1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Guide
                </button>
              </div>
              <SqlEditor
                value={fm.script}
                onchange={(value) => fm.setScript(String(value))}
              />
            </div>
          {/if}
        </div>
        {#if fm.configType === 'std'}
          <div class="sm-card-footer">
            <button
              class="btn btn-primary"
              onclick={fm.nextStep}
              disabled={!fm.configName.trim()}
            >
              Next
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Step 2: Source -->
    {#if fm.currentStep === 2}
      <div class="sm-card">
        <div class="sm-card-header">
          <span class="sm-card-title">
            <span class="sm-selection-badge sm-selection-badge--source"
              >SOURCE</span
            >
            Datasource & Table
          </span>
        </div>
        <div class="sm-card-body">
          <div class="sm-selection-grid">
            <div class="sm-selection-block">
              <label class="form-label" for="source-ds">Datasource</label>
              <select
                id="source-ds"
                class="form-input"
                disabled={fm.loadingTables}
                onchange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  const ds = datasources.find((d) => d.id === val);
                  // cspell:disable-next-line
                  void fm.setSourceDatasource({
                    id: val || null,
                    name: ds?.name ?? null,
                    dbname: ds?.dbname ?? null,
                  });
                }}
              >
                <option value="" disabled selected={!fm.sourceDatasourceId}>
                  {fm.loadingTables ? 'Loading...' : 'Select datasource'}
                </option>
                {#each datasources as ds (ds.id)}
                  <option
                    value={ds.id}
                    selected={ds.id === fm.sourceDatasourceId}
                  >
                    {ds.name} ({ds.db_type})
                  </option>
                {/each}
              </select>
            </div>
            <div class="sm-selection-block">
              <label class="form-label" for="source-tbl">Table</label>
              {#if fm.sourceTables.length > 0}
                <select
                  id="source-tbl"
                  class="form-input"
                  disabled={fm.loadingColumns}
                  onchange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    void fm.setSourceTable(val || null);
                  }}
                >
                  <option value="" disabled selected={!fm.sourceTableName}>
                    {fm.loadingColumns ? 'Loading...' : 'Select table'}
                  </option>
                  {#each fm.sourceTables as tbl (tbl)}
                    <option value={tbl} selected={tbl === fm.sourceTableName}>
                      {tbl}
                    </option>
                  {/each}
                </select>
              {:else if fm.sourceDatasourceId}
                {#if fm.loadingTables}
                  <div class="pipeline-list-loading" style="padding: 16px;">
                    <div class="pipeline-loading-spinner"></div>
                  </div>
                {:else}
                  <p
                    style="color: var(--text-muted); font-size: 13px; margin: 0;"
                  >
                    No tables found or datasource unavailable.
                  </p>
                {/if}
              {:else}
                <p
                  style="color: var(--text-muted); font-size: 13px; margin: 0;"
                >
                  Select a datasource first.
                </p>
              {/if}
            </div>
          </div>
          {#if fm.sourceColumns.length > 0}
            <div style="margin-top: 16px;">
              <div class="form-label" role="heading" aria-level="3">
                Source Columns ({fm.sourceColumns.length})
              </div>
              <div class="sm-table-select" style="max-height: 200px;">
                {#each fm.sourceColumns as col (col.name)}
                  <div class="sm-table-item" style="cursor: default;">
                    <span
                      style="font-size: 12px; min-width: 60px; color: var(--text-muted);"
                    >
                      {col.type}
                    </span>
                    <span>{col.name}</span>
                    {#if !col.is_nullable}
                      <span
                        style="color: var(--peach-text); font-size: 10px; font-weight: 600;"
                        >NOT NULL</span
                      >
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <div class="sm-card-footer">
          <button class="btn btn-secondary" onclick={fm.prevStep}>Back</button>
          <button
            class="btn btn-primary"
            onclick={fm.nextStep}
            disabled={!fm.sourceTableName}
          >
            Next
          </button>
        </div>
      </div>
    {/if}

    <!-- Step 3: Target -->
    {#if fm.currentStep === 3}
      <div class="sm-card">
        <div class="sm-card-header">
          <span class="sm-card-title">
            <span class="sm-selection-badge sm-selection-badge--target"
              >TARGET</span
            >
            Datasource & Table
          </span>
        </div>
        <div class="sm-card-body">
          <div class="sm-selection-grid">
            <div class="sm-selection-block">
              <label class="form-label" for="target-ds">Datasource</label>
              <select
                id="target-ds"
                class="form-input"
                disabled={fm.loadingTables}
                onchange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  const ds = datasources.find((d) => d.id === val);
                  // cspell:disable-next-line
                  void fm.setTargetDatasource({
                    id: val || null,
                    name: ds?.name ?? null,
                    dbname: ds?.dbname ?? null,
                  });
                }}
              >
                <option value="" disabled selected={!fm.targetDatasourceId}>
                  {fm.loadingTables ? 'Loading...' : 'Select datasource'}
                </option>
                {#each datasources as ds (ds.id)}
                  <option
                    value={ds.id}
                    selected={ds.id === fm.targetDatasourceId}
                  >
                    {ds.name} ({ds.db_type})
                  </option>
                {/each}
              </select>
            </div>
            <div class="sm-selection-block">
              <label class="form-label" for="target-tbl">Table</label>
              {#if fm.targetTables.length > 0}
                <select
                  id="target-tbl"
                  class="form-input"
                  disabled={fm.loadingColumns}
                  onchange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    void fm.setTargetTable(val || null);
                  }}
                >
                  <option value="" disabled selected={!fm.targetTableName}>
                    {fm.loadingColumns ? 'Loading...' : 'Select table'}
                  </option>
                  {#each fm.targetTables as tbl (tbl)}
                    <option value={tbl} selected={tbl === fm.targetTableName}>
                      {tbl}
                    </option>
                  {/each}
                </select>
              {:else if fm.targetDatasourceId}
                {#if fm.loadingTables}
                  <div class="pipeline-list-loading" style="padding: 16px;">
                    <div class="pipeline-loading-spinner"></div>
                  </div>
                {:else}
                  <p
                    style="color: var(--text-muted); font-size: 13px; margin: 0;"
                  >
                    No tables found or datasource unavailable.
                  </p>
                {/if}
              {:else}
                <p
                  style="color: var(--text-muted); font-size: 13px; margin: 0;"
                >
                  Select a datasource first.
                </p>
              {/if}
            </div>
          </div>
          {#if fm.targetColumns.length > 0}
            <div style="margin-top: 16px;">
              <div class="form-label" role="heading" aria-level="3">
                Target Columns ({fm.targetColumns.length})
              </div>
              <div class="sm-table-select" style="max-height: 200px;">
                {#each fm.targetColumns as col (col.name)}
                  <div class="sm-table-item" style="cursor: default;">
                    <span
                      style="font-size: 12px; min-width: 60px; color: var(--text-muted);"
                    >
                      {col.type}
                    </span>
                    <span>{col.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <div class="sm-card-footer">
          <button class="btn btn-secondary" onclick={fm.prevStep}>Back</button>
          <button
            class="btn btn-primary"
            onclick={fm.nextStep}
            disabled={!fm.targetTableName}
          >
            Next
          </button>
        </div>
      </div>
    {/if}

    <!-- Step 4: Field Mapping -->
    {#if fm.currentStep === 4}
      <div class="sm-card">
        <div class="sm-card-header">
          <span class="sm-card-title">Field Mapping</span>
          <div
            style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-secondary);"
          >
            <span class="sm-mapping-count"
              >{activeMappings} / {fm.mappings.length} mapped</span
            >
            <span>Source: <strong>{fm.sourceTableName}</strong></span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7h8M9 4l3 3-3 3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Target: <strong>{fm.targetTableName}</strong></span>
          </div>
        </div>
        <div class="sm-card-body" style="padding: 0;">
          {#if fm.mappings.length === 0}
            <div class="pipeline-list-empty" style="padding: 40px 20px;">
              <p>No columns found. Go back and select source/target tables.</p>
            </div>
          {:else}
            <div class="sm-mapping-wrapper">
              <table class="sm-mapping-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">Status</th>
                    <th style="width: 36px;">
                      <span title="Skip this field (do not migrate)">Skip</span>
                    </th>
                    <th>Source Column</th>
                    <th style="width: 120px;">Type</th>
                    <th>Target Column</th>
                    <th style="width: 130px;">Transformers</th>
                    <th style="width: 120px;">Validators</th>
                    <th style="width: 100px;">Default</th>
                    <th style="width: 40px;"></th>
                  </tr>
                </thead>
                <tbody>
                  {#each fm.mappings as mapping, i (i)}
                    <tr class={mapping.ignore ? 'sm-row--ignored' : ''}>
                      <td style="text-align: center;">
                        {#if mapping.targetColumn}
                          <span
                            class="sm-status-dot"
                            class:sm-status-dot--ok={mapping.targetExists}
                            class:sm-status-dot--missing={!mapping.targetExists}
                            title={mapping.targetExists
                              ? 'Column exists'
                              : 'Column not found in target'}
                          ></span>
                        {:else}
                          <span
                            class="sm-status-dot sm-status-dot--missing"
                            title="No target column selected"
                          ></span>
                        {/if}
                      </td>
                      <td style="text-align: center;">
                        <input
                          type="checkbox"
                          class="sm-mapping-checkbox"
                          checked={mapping.ignore}
                          onchange={() =>
                            fm.updateMapping(i, { ignore: !mapping.ignore })}
                        />
                      </td>
                      <td class="sm-mapping-col">
                        {#if mapping.isManual}
                          <input
                            type="text"
                            class="sm-mapping-input"
                            placeholder="column name"
                            value={mapping.sourceColumn}
                            oninput={(e) =>
                              fm.updateMapping(i, {
                                sourceColumn: (e.target as HTMLInputElement)
                                  .value,
                              })}
                          />
                        {:else}
                          {mapping.sourceColumn}
                        {/if}
                      </td>
                      <td class="sm-mapping-type" title={mapping.sourceType}>
                        {#if mapping.isManual}
                          <input
                            type="text"
                            class="sm-mapping-input"
                            placeholder="type"
                            value={mapping.sourceType}
                            oninput={(e) =>
                              fm.updateMapping(i, {
                                sourceType: (e.target as HTMLInputElement)
                                  .value,
                              })}
                          />
                        {:else}
                          {mapping.sourceType}
                        {/if}
                      </td>
                      <td>
                        <select
                          class="sm-mapping-select"
                          value={mapping.targetColumn}
                          onchange={(e) =>
                            fm.updateMapping(i, {
                              targetColumn: (e.target as HTMLSelectElement)
                                .value,
                            })}
                        >
                          <option value="">-- select --</option>
                          {#each fm.targetColumns as col (col.name)}
                            <option value={col.name}>{col.name}</option>
                          {/each}
                        </select>
                      </td>
                      <td>
                        <div
                          style="display: flex; align-items: center; gap: 4px;"
                        >
                          {#if mapping.transformers.length > 0}
                            <BadgeList
                              items={mapping.transformers}
                              limit={3}
                              color="purple"
                            />
                          {/if}
                          {#if mapping.transformers.includes('VALUE_MAP')}
                            <button
                              class="vm-configure-btn"
                              onclick={() => openValueMapDrawer(i)}
                              title="Configure VALUE_MAP"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                              >
                                <path
                                  d="M5.5 1.5l-.5 2a4.5 4.5 0 00-1.5 1L1.5 4l-1 2 1.5 1.5a4.5 4.5 0 000 2L1 11l1 2 2-.5a4.5 4.5 0 002 0l.5 2 2-1 1.5-1.5a4.5 4.5 0 002 0l2 .5 1-2-1.5-1.5a4.5 4.5 0 000-2L13 6l-1-2-2 .5a4.5 4.5 0 00-1.5-1l-.5-2h-2z"
                                  stroke="currentColor"
                                  stroke-width="1"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <circle
                                  cx="7"
                                  cy="7"
                                  r="2"
                                  stroke="currentColor"
                                  stroke-width="1"
                                />
                              </svg>
                            </button>
                          {/if}
                          <button
                            class="sm-add-btn"
                            onclick={() => openTransformerDrawer(i)}
                            title="Add transformers"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M6 2v8M2 6h8"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td>
                        <div
                          style="display: flex; align-items: center; gap: 4px;"
                        >
                          {#if mapping.validators.length > 0}
                            <BadgeList
                              items={mapping.validators}
                              limit={3}
                              color="green"
                            />
                          {/if}
                          <button
                            class="sm-add-btn"
                            onclick={() => openValidatorDrawer(i)}
                            title="Add validators"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M6 2v8M2 6h8"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          class="sm-mapping-input"
                          placeholder="-"
                          value={mapping.defaultValue}
                          oninput={(e) =>
                            fm.updateMapping(i, {
                              defaultValue: (e.target as HTMLInputElement)
                                .value,
                            })}
                        />
                      </td>
                      <td style="text-align: center;">
                        {#if mapping.isManual}
                          <button
                            class="action-btn action-btn-delete"
                            onclick={() => fm.removeMapping(i)}
                            title="Remove row"
                            aria-label="Remove row"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 2l8 8M10 2l-8 8"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <div style="padding: 8px 12px;">
              <button
                class="btn btn-secondary"
                onclick={() => fm.addMapping()}
                style="font-size: 12px; padding: 4px 10px;"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style="margin-right: 4px;"
                >
                  <path
                    d="M6 2v8M2 6h8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                Add Row
              </button>
            </div>
          {/if}
        </div>

        <div style="padding: 16px 20px;">
          <div class="sm-sql-section">
            <div class="sm-sql-header">
              <span class="sm-sql-title">Generated SQL</span>
              <button
                class="btn btn-secondary"
                onclick={fm.autoGenerateSql}
                style="padding: 4px 10px; font-size: 12px;"
              >
                Auto Generate
              </button>
            </div>
            <SqlEditor
              value={fm.generateSql}
              onchange={(value) => fm.setGenerateSql(String(value))}
            />
          </div>
        </div>

        <div class="sm-card-footer">
          <button class="btn btn-secondary" onclick={fm.prevStep}>Back</button>
          <button
            class="btn btn-primary"
            onclick={handleSave}
            disabled={fm.saving || !fm.configName.trim()}
          >
            {#if fm.saving}
              <span
                class="spin"
                style="width: 14px; height: 14px; border-width: 2px;"
              ></span>
              Saving...
            {:else}
              Save Config
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Transformer Drawer -->
  <ItemSelectorDrawer
    open={showTransformerDrawer}
    title="Select Transformers"
    type="transformers"
    items={fm.transformers}
    selected={fm.mappings[currentMappingIndex]?.transformers ?? []}
    transformerParams={fm.mappings[currentMappingIndex]?.transformerParams ??
      {}}
    onClose={() => (showTransformerDrawer = false)}
    onApply={handleTransformerApply}
  />

  <!-- Validator Drawer -->
  <ItemSelectorDrawer
    open={showValidatorDrawer}
    title="Select Validators"
    type="validators"
    items={fm.validators}
    selected={fm.mappings[currentMappingIndex]?.validators ?? []}
    onClose={() => (showValidatorDrawer = false)}
    onApply={handleValidatorApply}
  />

  <!-- VALUE_MAP Params Drawer -->
  {#if currentMappingIndex >= 0}
    <ValueMapParamsDrawer
      open={showValueMapDrawer}
      sourceColumns={fm.sourceColumns.map((c) => c.name)}
      params={(fm.mappings[currentMappingIndex]?.transformerParams
        ?.VALUE_MAP as ValueMapParams) ?? emptyValueMapParams}
      onClose={() => (showValueMapDrawer = false)}
      onSave={handleValueMapSave}
    />
  {/if}

  <!-- SQL Guide Modal -->
  <SqlGuideModal open={showSqlGuide} onClose={() => (showSqlGuide = false)} />
{/if}
