<script lang="ts">
  import { untrack } from 'svelte';

  import type { ValueMapParams } from '$core/types/schema-mapper';

  interface Props {
    open: boolean;
    sourceColumns: string[];
    params: ValueMapParams;
    onClose: () => void;
    onSave: (params: ValueMapParams) => void;
  }

  let { open, sourceColumns, params, onClose, onSave }: Props = $props();

  let localRules = $state<
    Array<{ when: Array<{ column: string; value: string }>; then: string }>
  >([]);
  let localDefault = $state<string>('');
  let useDefault = $state(false);

  $effect(() => {
    if (open) {
      untrack(() => {
        const rules = params.rules ?? [];
        localRules =
          rules.length > 0
            ? rules.map(
                (rule: { when: Record<string, string>; then: string }) => ({
                  when: Object.entries(rule.when).map(([column, value]) => ({
                    column,
                    value,
                  })),
                  then: rule.then,
                })
              )
            : [{ when: [{ column: '', value: '' }], then: '' }];
        useDefault = params.default !== undefined && params.default !== null;
        localDefault = useDefault ? String(params.default) : '';
      });
    }
  });

  function addRule() {
    localRules = [
      ...localRules,
      { when: [{ column: '', value: '' }], then: '' },
    ];
  }

  function removeRule(index: number) {
    localRules = localRules.filter((_, i) => i !== index);
  }

  function addCondition(ruleIndex: number) {
    const updated = [...localRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      when: [...updated[ruleIndex].when, { column: '', value: '' }],
    };
    localRules = updated;
  }

  function removeCondition(ruleIndex: number, condIndex: number) {
    const updated = [...localRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      when: updated[ruleIndex].when.filter((_, i) => i !== condIndex),
    };
    if (updated[ruleIndex].when.length === 0) {
      updated[ruleIndex].when = [{ column: '', value: '' }];
    }
    localRules = updated;
  }

  function updateCondition(
    ruleIndex: number,
    condIndex: number,
    field: 'column' | 'value',
    val: string
  ) {
    const updated = [...localRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      when: updated[ruleIndex].when.map((c, i) =>
        i === condIndex ? { ...c, [field]: val } : c
      ),
    };
    localRules = updated;
  }

  function updateThen(ruleIndex: number, val: string) {
    const updated = [...localRules];
    updated[ruleIndex] = { ...updated[ruleIndex], then: val };
    localRules = updated;
  }

  function handleSave() {
    const rules = localRules
      .filter(
        (r) =>
          r.then !== '' && r.when.some((c) => c.column !== '' && c.value !== '')
      )
      .map((r) => ({
        when: r.when
          .filter((c) => c.column !== '' && c.value !== '')
          .reduce(
            (acc, c) => {
              acc[c.column] = c.value;
              return acc;
            },
            {} as Record<string, string>
          ),
        then: r.then,
      }));

    const result: ValueMapParams = {
      rules,
      default: useDefault ? localDefault : null,
    };
    onSave(result);
    onClose();
  }

  function handleCancel() {
    onClose();
  }
</script>

{#if open}
  <div
    class="drawer-overlay drawer-overlay-open"
    role="presentation"
    onclick={handleCancel}
  ></div>
  <div class="drawer drawer--wide drawer-open">
    <div class="drawer-header">
      <div class="vm-header-info">
        <h3 class="drawer-title">VALUE_MAP Configuration</h3>
        <span class="vm-header-hint">Map source values to target values</span>
      </div>
      <button class="drawer-close" onclick={handleCancel} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 4l12 12M16 4l-12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="drawer-body">
      <div class="vm-rules">
        {#each localRules as rule, ri (ri)}
          <div class="vm-rule">
            <div class="vm-rule-header">
              <span class="vm-rule-label">Rule {ri + 1}</span>
              <div class="vm-rule-actions">
                <button
                  class="vm-btn-icon"
                  onclick={() => addCondition(ri)}
                  title="Add condition"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 2v10M2 7h10"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
                <button
                  class="vm-btn-icon vm-btn-icon--danger"
                  onclick={() => removeRule(ri)}
                  title="Remove rule"
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
            </div>

            <div class="vm-rule-body">
              <div class="vm-conditions">
                <span class="vm-conditions-label">WHEN</span>
                {#each rule.when as cond, ci (ci)}
                  <div class="vm-condition-row">
                    <select
                      class="form-input vm-select"
                      value={cond.column}
                      onchange={(e) =>
                        updateCondition(
                          ri,
                          ci,
                          'column',
                          (e.target as HTMLSelectElement).value
                        )}
                    >
                      <option value="" disabled>Select column</option>
                      {#each sourceColumns as col (col)}
                        <option value={col}>{col}</option>
                      {/each}
                    </select>
                    <input
                      type="text"
                      class="form-input vm-input"
                      placeholder="Value (e.g. =01)"
                      value={cond.value}
                      oninput={(e) =>
                        updateCondition(
                          ri,
                          ci,
                          'value',
                          (e.target as HTMLInputElement).value
                        )}
                    />
                    {#if rule.when.length > 1}
                      <button
                        class="vm-btn-icon vm-btn-icon--danger"
                        onclick={() => removeCondition(ri, ci)}
                        title="Remove condition"
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
                  </div>
                {/each}
              </div>

              <div class="vm-then">
                <span class="vm-then-label">THEN</span>
                <input
                  type="text"
                  class="form-input vm-input"
                  placeholder="Mapped value"
                  value={rule.then}
                  oninput={(e) =>
                    updateThen(ri, (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          </div>
        {/each}
      </div>

      <button class="vm-add-rule" onclick={addRule}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 2v10M2 7h10"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        Add Rule
      </button>

      <div class="vm-default">
        <div class="vm-default-header">
          <label class="vm-default-label">
            <input
              type="checkbox"
              checked={useDefault}
              onchange={() => (useDefault = !useDefault)}
            />
            Set default value
          </label>
          <span class="vm-default-hint">
            {useDefault
              ? 'Use this when no rule matches'
              : 'Keep original value when no rule matches'}
          </span>
        </div>
        {#if useDefault}
          <input
            type="text"
            class="form-input vm-input"
            placeholder="Default value"
            value={localDefault}
            oninput={(e) =>
              (localDefault = (e.target as HTMLInputElement).value)}
          />
        {/if}
      </div>
    </div>

    <div class="drawer-footer">
      <button class="btn btn-secondary" onclick={handleCancel}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSave}>Save</button>
    </div>
  </div>
{/if}
