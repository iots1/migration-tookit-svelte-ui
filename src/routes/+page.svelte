<script lang="ts">
  import { resolve } from '$app/paths';

  import './+page.scss';
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
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
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
      <h2 class="card-title">Pipelines</h2>
      <p class="card-desc">View, search and manage your migration pipelines</p>
    </a>

    <a href={resolve('/pipeline-editor')} class="home-card">
      <div class="card-icon icon-purple">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
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
      <h2 class="card-title">Pipeline Editor</h2>
      <p class="card-desc">Design migration flows with drag-and-drop nodes</p>
    </a>

    <a href={resolve('/db-explorer')} class="home-card">
      <div class="card-icon icon-blue">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
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
      <h2 class="card-title">DB Explorer</h2>
      <p class="card-desc">Browse tables and inspect schema definitions</p>
    </a>

    <a href={resolve('/migration-runner')} class="home-card">
      <div class="card-icon icon-peach">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 16l3-4 3 2 4-8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13 6l2 0 0 2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <h2 class="card-title">Migration Runner</h2>
      <p class="card-desc">Execute and monitor migration jobs in real-time</p>
    </a>
  </div>
</div>
