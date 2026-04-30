<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  import './+page.scss';

  let roadmapRef: HTMLElement | undefined = $state();
  let visibleSteps = $state<Set<number>>(new Set());

  interface RoadmapStep {
    icon: string;
    title: string;
    desc: string;
    neon: string;
  }

  interface RowStep extends RoadmapStep {
    globalIndex: number;
  }

  const steps: RoadmapStep[] = [
    {
      icon: '🔌',
      title: 'Connect',
      desc: 'Creates two SQLAlchemy engines with connection pooling, TCP keepalive, and dialect-specific session tuning.',
      neon: '#60a5fa',
    },
    {
      icon: '📋',
      title: 'Build Query',
      desc: 'Generates SELECT statements from field mappings automatically, or uses custom SQL with column remapping.',
      neon: '#4ade80',
    },
    {
      icon: '📄',
      title: 'Paginate',
      desc: 'Cursor-based batch fetching via primary keys for O(1) performance with crash-resumable positioning.',
      neon: '#c084fc',
    },
    {
      icon: '⚙️',
      title: 'Transform',
      desc: 'Runs configured transformers as a vectorized pipeline on Pandas Series with validator warnings.',
      neon: '#fbbf24',
    },
    {
      icon: '💾',
      title: 'Insert',
      desc: 'PostgreSQL COPY FROM STDIN for 5-10x faster inserts. Supports upsert strategies via temp tables.',
      neon: '#2dd4bf',
    },
    {
      icon: '💿',
      title: 'Checkpoint',
      desc: 'Atomic checkpoint file per batch with cursor position and row count for automatic resume.',
      neon: '#f472b6',
    },
    {
      icon: '✅',
      title: 'Verify',
      desc: 'Row count verification, checkpoint cleanup, and full result summary with duration.',
      neon: '#34d399',
    },
  ];

  const COLS = 4;
  const rowData: RowStep[][] = [];
  for (let i = 0; i < steps.length; i += COLS) {
    rowData.push(
      steps.slice(i, i + COLS).map((s, ci) => ({
        ...s,
        globalIndex: i + ci,
      }))
    );
  }

  onMount(() => {
    if (!roadmapRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const index = Number(el.dataset.step);
            if (!isNaN(index)) {
              const delay = index * 150;
              setTimeout(() => {
                visibleSteps = new Set([...visibleSteps, index]);
              }, delay);
            }
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.1 }
    );

    const items = roadmapRef.querySelectorAll('.roadmap-step');
    for (const item of items) {
      observer.observe(item);
    }

    return () => observer.disconnect();
  });
</script>

<svelte:head>
  <title>Home - Migration Toolkit</title>
</svelte:head>

<div class="home-page">
  <div class="home-hero">
    <h1 class="home-title">Migration Toolkit</h1>
    <p class="home-subtitle">Visual database migration pipeline builder</p>
  </div>

  <div class="home-cards">
    <a href={resolve('/pipelines')} class="home-card">
      <div class="card-icon icon-teal">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 4h14v12H3z"
            stroke="currentColor"
            stroke-width="1.5"
            rx="1"
          />
          <path d="M3 8h14" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M7 12h6"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <path
            d="M7 15h4"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      <div class="card-text">
        <h2 class="card-title">Pipelines</h2>
        <p class="card-desc">Manage migration pipelines</p>
      </div>
    </a>

    <a href={resolve('/datasources')} class="home-card">
      <div class="card-icon icon-peach">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <ellipse
            cx="10"
            cy="5"
            rx="7"
            ry="3"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3 10c0 1.657 3.134 3 7 3s7-1.343 7-3"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </div>
      <div class="card-text">
        <h2 class="card-title">Datasources</h2>
        <p class="card-desc">Database connections</p>
      </div>
    </a>

    <a href={resolve('/pipeline-editor')} class="home-card">
      <div class="card-icon icon-purple">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <rect
            x="1.5"
            y="1.5"
            width="6"
            height="6"
            rx="2"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <rect
            x="12.5"
            y="12.5"
            width="6"
            height="6"
            rx="2"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M7.5 4.5h2l3.5 3.5v2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle
            cx="11"
            cy="8"
            r="1.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </div>
      <div class="card-text">
        <h2 class="card-title">Pipeline Editor</h2>
        <p class="card-desc">Design migration flows</p>
      </div>
    </a>

    <a href={resolve('/db-explorer')} class="home-card">
      <div class="card-icon icon-blue">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <ellipse
            cx="10"
            cy="5"
            rx="7"
            ry="3"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3 10c0 1.657 3.134 3 7 3s7-1.343 7-3"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </div>
      <div class="card-text">
        <h2 class="card-title">DB Explorer</h2>
        <p class="card-desc">Browse schema definitions</p>
      </div>
    </a>
  </div>

  <div class="home-roadmap" bind:this={roadmapRef}>
    <div class="roadmap-header">
      <h2 class="roadmap-title">How Migration Works</h2>
      <p class="roadmap-subtitle">
        Each config runs through these steps automatically
      </p>
    </div>

    <div class="roadmap-flow">
      {#each rowData as row, ri (ri)}
        <div class="roadmap-row">
          {#each row as step, ci (step.globalIndex)}
            <div
              class="roadmap-step"
              class:roadmap-step--visible={visibleSteps.has(step.globalIndex)}
              data-step={step.globalIndex}
            >
              <div class="roadmap-step-box" style="--neon: {step.neon}">
                <div class="roadmap-step-badge">{step.globalIndex + 1}</div>
                <span class="roadmap-step-icon">{step.icon}</span>
                <h3 class="roadmap-step-title">{step.title}</h3>
                <p class="roadmap-step-desc">{step.desc}</p>
              </div>
            </div>
            {#if ci < row.length - 1}
              <div
                class="roadmap-h-connector"
                class:roadmap-h-connector--visible={visibleSteps.has(
                  step.globalIndex
                )}
                style="--neon: {step.neon}; --neon-next: {steps[
                  step.globalIndex + 1
                ].neon}"
              >
                <div class="roadmap-h-line"></div>
                <svg
                  class="roadmap-h-arrow"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            {/if}
          {/each}
        </div>

        {#if ri < rowData.length - 1}
          {@const lastInRow = row[row.length - 1]}
          {@const firstNextRow = rowData[ri + 1][0]}
          <div class="roadmap-v-spacer">
            <div
              class="roadmap-v-connector"
              class:roadmap-v-connector--visible={visibleSteps.has(
                lastInRow.globalIndex
              )}
              style="--neon: {lastInRow.neon}; --neon-next: {firstNextRow.neon}"
            >
              <div class="roadmap-v-line"></div>
              <div class="roadmap-v-glow"></div>
              <svg
                class="roadmap-v-arrow"
                width="10"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
              >
                <path
                  d="M1 1l4 5 4-5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>
