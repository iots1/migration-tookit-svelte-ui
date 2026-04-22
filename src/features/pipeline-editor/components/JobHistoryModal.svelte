<script lang="ts">
  import type { PipelineJobItem, PipelineRunItem } from '$core/types/pipeline';
  import {
    loadJobPipelineRuns,
    loadPipelineJobs,
  } from '$features/pipeline-editor/api';

  interface ConfigGroup {
    configName: string;
    latestCumulative: number;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    batches: PipelineRunItem[];
  }

  let {
    open = false,
    pipelineId,
    onClose,
  }: {
    open?: boolean;
    pipelineId: string;
    onClose: () => void;
  } = $props();

  const JOBS_LIMIT = 50;
  const RUN_LIMIT_OPTIONS = [50, 100, 500, 1000];

  let jobs = $state<PipelineJobItem[]>([]);
  let jobsLoading = $state(false);
  let jobsOffset = $state(0);
  let hasMoreJobs = $state(false);
  let selectedJobId = $state<string | null>(null);

  let runs = $state<PipelineRunItem[]>([]);
  let runsLoading = $state(false);
  let runsOffset = $state(0);
  let runsLimit = $state(1000);
  let hasMoreRuns = $state(false);

  let openedPipelineId = '';

  let configGroups = $derived(buildConfigGroups(runs));
  let selectedJob = $derived(jobs.find((j) => j.id === selectedJobId) ?? null);

  function buildConfigGroups(items: PipelineRunItem[]): ConfigGroup[] {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain local var, not reactive state
    const map = new Map<string, ConfigGroup>();
    for (const run of items) {
      const group = map.get(run.config_name);
      if (!group) {
        map.set(run.config_name, {
          configName: run.config_name,
          latestCumulative: run.rows_cumulative,
          totalRecords: run.total_records_in_config,
          successCount: run.status === 'success' ? 1 : 0,
          errorCount: run.status !== 'success' ? 1 : 0,
          batches: [run],
        });
      } else {
        group.batches.push(run);
        group.latestCumulative = Math.max(
          group.latestCumulative,
          run.rows_cumulative
        );
        if (run.status === 'success') {
          group.successCount += 1;
        } else {
          group.errorCount += 1;
        }
      }
    }
    return [...map.values()];
  }

  function parseWarnings(raw?: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  async function fetchJobs(reset = false) {
    if (reset) {
      jobsOffset = 0;
      jobs = [];
      selectedJobId = null;
      runs = [];
      runsOffset = 0;
    }
    if (jobsLoading) return;
    jobsLoading = true;
    try {
      const res = await loadPipelineJobs(pipelineId, {
        limit: JOBS_LIMIT,
        offset: jobsOffset,
      });
      jobs = [...jobs, ...res.data];
      hasMoreJobs = res.data.length === JOBS_LIMIT;
      jobsOffset += res.data.length;
      if (reset && res.data.length > 0) {
        selectedJobId = res.data[0].id;
        await fetchRuns(true);
      }
    } finally {
      jobsLoading = false;
    }
  }

  async function fetchRuns(reset = false) {
    if (!selectedJobId) return;
    if (reset) {
      runsOffset = 0;
      runs = [];
    }
    if (runsLoading) return;
    runsLoading = true;
    try {
      const res = await loadJobPipelineRuns(selectedJobId, {
        limit: runsLimit,
        offset: runsOffset,
        sort: 'created_at:asc',
      });
      runs = [...runs, ...res.data];
      hasMoreRuns = res.data.length === runsLimit;
      runsOffset += res.data.length;
    } finally {
      runsLoading = false;
    }
  }

  $effect(() => {
    if (open && pipelineId) {
      if (pipelineId !== openedPipelineId) {
        openedPipelineId = pipelineId;
        void fetchJobs(true);
      }
    } else {
      openedPipelineId = '';
    }
  });

  function handleJobSelect(jobId: string) {
    if (jobId !== selectedJobId) {
      selectedJobId = jobId;
      void fetchRuns(true);
    }
  }

  function handleLimitChange(e: Event) {
    runsLimit = Number((e.target as HTMLSelectElement).value);
    void fetchRuns(true);
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function formatDateTime(iso: string) {
    try {
      return new Date(iso).toLocaleString('th-TH', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function formatDuration(startIso: string, endIso?: string | null): string {
    try {
      const start = new Date(startIso).getTime();
      const end = endIso ? new Date(endIso).getTime() : Date.now();
      const diff = Math.max(0, Math.round((end - start) / 1000));
      if (diff < 60) return `${diff}s`;
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      return `${m}m ${s}s`;
    } catch {
      return '-';
    }
  }

  function progressPct(cumulative: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((cumulative / total) * 100));
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="jh-overlay" role="presentation" onclick={handleOverlayClick}>
    <div class="jh-modal" role="dialog" aria-label="Job History">
      <div class="jh-modal-header">
        <span class="jh-modal-title">Job History</span>
        <button
          class="jh-modal-close"
          onclick={onClose}
          aria-label="Close modal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="jh-modal-body">
        <!-- Left panel: Jobs -->
        <div class="jh-panel-left">
          <div class="jh-panel-header">
            <span class="jh-panel-title">
              Jobs
              {#if jobs.length > 0}
                <span class="jh-count">({jobs.length})</span>
              {/if}
            </span>
          </div>

          <div class="jh-panel-scroll">
            {#if jobsLoading && jobs.length === 0}
              <div class="jh-loading">
                <span class="spinner-inline"></span>
                Loading...
              </div>
            {:else if jobs.length === 0}
              <div class="jh-empty">No jobs found</div>
            {:else}
              <div class="jh-job-list">
                {#each jobs as job (job.id)}
                  {@const isSelected = job.id === selectedJobId}
                  {@const summaryTotalRows = job.summary?.total_rows as
                    | number
                    | undefined}
                  {@const summaryDuration = job.summary?.total_duration_s as
                    | number
                    | undefined}
                  {@const summaryRetries = job.summary?.retries as
                    | number
                    | undefined}
                  <button
                    class="jh-job-card {isSelected ? 'jh-job-card-active' : ''}"
                    onclick={() => handleJobSelect(job.id)}
                  >
                    <div class="jh-job-card-header">
                      <span class="jh-job-status jh-job-status-{job.status}"
                        >{job.status}</span
                      >
                      <span class="jh-job-time"
                        >{formatDuration(
                          job.created_at,
                          job.completed_at
                        )}</span
                      >
                    </div>

                    <div class="jh-job-card-meta">
                      <span class="jh-job-date"
                        >{formatDateTime(job.created_at)}</span
                      >
                      {#if job.total_config !== undefined}
                        <span class="jh-job-meta-sep">•</span>
                        <span
                          >{job.total_config} config{job.total_config !== 1
                            ? 's'
                            : ''}</span
                        >
                      {/if}
                    </div>

                    {#if job.summary && summaryTotalRows !== undefined}
                      <div class="jh-job-summary">
                        <span class="jh-job-summary-stat">
                          <span class="jh-job-summary-value"
                            >{summaryTotalRows.toLocaleString()}</span
                          >
                          <span class="jh-job-summary-label">rows</span>
                        </span>
                        {#if summaryDuration !== undefined}
                          <span class="jh-job-summary-stat">
                            <span class="jh-job-summary-value"
                              >{summaryDuration.toFixed(1)}s</span
                            >
                            <span class="jh-job-summary-label">duration</span>
                          </span>
                        {/if}
                        {#if summaryRetries !== undefined && summaryRetries > 0}
                          <span class="jh-job-summary-stat">
                            <span class="jh-job-summary-value"
                              >{summaryRetries}</span
                            >
                            <span class="jh-job-summary-label">retries</span>
                          </span>
                        {/if}
                      </div>
                    {/if}

                    {#if job.error_message}
                      <div class="jh-job-error">{job.error_message}</div>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}

            {#if hasMoreJobs}
              <button
                class="jh-load-more"
                onclick={() => void fetchJobs(false)}
                disabled={jobsLoading}
              >
                {jobsLoading ? 'Loading...' : 'Load more'}
              </button>
            {/if}
          </div>
        </div>

        <div class="jh-panel-divider"></div>

        <!-- Right panel: Pipeline Runs -->
        <div class="jh-panel-right">
          {#if selectedJob}
            <div class="jh-panel-header">
              <span class="jh-panel-title">
                Pipeline Runs
                {#if runs.length > 0}
                  <span class="jh-count">({runs.length})</span>
                {/if}
              </span>
              <div class="jh-limit-group">
                <label class="jh-limit-label" for="jh-runs-limit">Limit</label>
                <select
                  id="jh-runs-limit"
                  class="form-input jh-limit-select"
                  value={runsLimit}
                  onchange={handleLimitChange}
                >
                  {#each RUN_LIMIT_OPTIONS as opt (opt)}
                    <option value={opt}>{opt}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="jh-panel-scroll">
              {#if runsLoading && runs.length === 0}
                <div class="jh-loading">
                  <span class="spinner-inline"></span>
                  Loading runs...
                </div>
              {:else if runs.length === 0}
                <div class="jh-empty">No runs found for this job</div>
              {:else}
                {#each configGroups as group (group.configName)}
                  {@const pct = progressPct(
                    group.latestCumulative,
                    group.totalRecords
                  )}
                  <div class="jh-config-group">
                    <div class="jh-config-name">{group.configName}</div>

                    <div class="jh-progress-bar-wrap">
                      <div class="jh-progress-bar">
                        <div
                          class="jh-progress-fill {pct >= 100
                            ? 'jh-progress-fill-done'
                            : ''}"
                          style="width: {pct}%"
                        ></div>
                      </div>
                      <span class="jh-progress-pct">{pct}%</span>
                    </div>

                    <div class="jh-progress-meta">
                      <span
                        >{group.latestCumulative.toLocaleString()} / {group.totalRecords.toLocaleString()}
                        rows</span
                      >
                      <span class="jh-progress-meta-sep">•</span>
                      <span>{group.batches.length} batches</span>
                      {#if group.errorCount > 0}
                        <span class="jh-progress-meta-sep">•</span>
                        <span class="jh-progress-error"
                          >{group.errorCount} error{group.errorCount > 1
                            ? 's'
                            : ''}</span
                        >
                      {/if}
                    </div>

                    <div class="jh-batch-log">
                      {#each group.batches as run, i (i)}
                        {@const warnings = parseWarnings(
                          run.transformation_warnings
                        )}
                        <div
                          class="jh-batch-row {run.status !== 'success'
                            ? 'jh-batch-row-error'
                            : ''}"
                        >
                          <span class="jh-batch-num">#{run.batch_round}</span>
                          <span
                            class="jh-batch-status jh-batch-status-{run.status.toLowerCase()}"
                            >{run.status}</span
                          >
                          <span class="jh-batch-rows"
                            >{run.rows_in_batch.toLocaleString()} rows</span
                          >
                          {#if warnings.length > 0}
                            <span
                              class="jh-batch-warn"
                              title={warnings.join('\n')}
                            >
                              ⚠ {warnings.length}
                            </span>
                          {/if}
                          <span class="jh-batch-time"
                            >{formatTime(run.created_at)}</span
                          >
                          {#if run.error_message}
                            <div class="jh-batch-error-msg">
                              {run.error_message}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              {/if}

              {#if hasMoreRuns}
                <button
                  class="jh-load-more"
                  onclick={() => void fetchRuns(false)}
                  disabled={runsLoading}
                >
                  {runsLoading ? 'Loading...' : 'Load more'}
                </button>
              {/if}
            </div>
          {:else}
            <div class="jh-panel-empty">
              <div class="jh-empty">Select a job to view runs</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
