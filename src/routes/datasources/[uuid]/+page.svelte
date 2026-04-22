<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import { showToast } from '$lib/toast.svelte';

  import '$features/datasource/datasource.scss';

  import { createDatasourceFormState } from '$features/datasource/state/datasource-form-state.svelte';

  const rawId = $derived(page.url.pathname.split('/').pop() ?? 'new');
  const isCreate = $derived(rawId === 'new');

  const formState = $derived(
    createDatasourceFormState(
      isCreate ? 'create' : 'edit',
      isCreate ? null : rawId
    )
  );

  let showPassword = $state(false);

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (formState.isDirty) {
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
    if (!isCreate && rawId !== 'new') {
      await formState.load(rawId);
    }
  });

  async function handleSave() {
    const savedId = await formState.save();
    if (savedId) {
      showToast(
        isCreate
          ? 'Datasource created successfully'
          : 'Datasource updated successfully',
        'success'
      );
      if (isCreate) {
        await goto(`/datasources/${savedId}`, { replaceState: true });
      }
    }
  }

  function handleBack() {
    if (
      formState.isDirty &&
      !confirm('You have unsaved changes. Leave anyway?')
    ) {
      return;
    }
    void goto(resolve('/datasources'));
  }
</script>

<svelte:head>
  <title
    >{isCreate ? 'New Datasource' : 'Edit Datasource'} - Migration Toolkit</title
  >
</svelte:head>

{#if formState.loading}
  <div class="pipeline-list-loading" style="padding: 120px 20px;">
    <div class="pipeline-loading-spinner"></div>
    <span>Loading datasource...</span>
  </div>
{:else}
  <div class="ds-form-page">
    <div class="ds-form-header">
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
        <h2 class="ds-form-title">
          {isCreate ? 'New Datasource' : `Edit: ${formState.name}`}
        </h2>
      </div>
      <button
        class="btn btn-primary"
        onclick={handleSave}
        disabled={formState.saving || !formState.name.trim()}
      >
        {#if formState.saving}
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

    {#if formState.error}
      <div class="ds-error-banner">
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
        <span>{formState.error}</span>
        <button
          class="ds-error-close"
          onclick={() => formState.clearError()}
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

    <div class="ds-form-card">
      <div class="form-group">
        <label class="form-label" for="ds-name">Datasource Name</label>
        <input
          id="ds-name"
          type="text"
          class="form-input"
          placeholder="e.g. Production PostgreSQL"
          value={formState.name}
          oninput={(e) =>
            formState.setName((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="ds-form-row">
        <div class="form-group">
          <label class="form-label" for="ds-type">Database Type</label>
          <select
            id="ds-type"
            class="form-input"
            value={formState.db_type}
            onchange={(e) =>
              formState.setDbType((e.target as HTMLSelectElement).value)}
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mssql">Microsoft SQL Server</option>
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="oracle">Oracle</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="ds-port">Port</label>
          <input
            id="ds-port"
            type="text"
            class="form-input"
            placeholder="5432"
            value={formState.port}
            oninput={(e) =>
              formState.setPort((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="ds-host">Host</label>
        <input
          id="ds-host"
          type="text"
          class="form-input"
          placeholder="e.g. localhost or 192.168.1.100"
          value={formState.host}
          oninput={(e) =>
            formState.setHost((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="ds-dbname">Database Name</label>
        <input
          id="ds-dbname"
          type="text"
          class="form-input"
          placeholder="e.g. my_database"
          value={formState.dbname}
          oninput={(e) =>
            formState.setDbname((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="ds-form-row">
        <div class="form-group">
          <label class="form-label" for="ds-username">Username</label>
          <input
            id="ds-username"
            type="text"
            class="form-input"
            placeholder="e.g. admin"
            value={formState.username}
            oninput={(e) =>
              formState.setUsername((e.target as HTMLInputElement).value)}
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="ds-password">Password</label>
          <div class="ds-password-wrapper">
            <input
              id="ds-password"
              type={showPassword ? 'text' : 'password'}
              class="form-input"
              placeholder={isCreate
                ? 'Enter password'
                : 'Leave blank to keep current'}
              value={formState.password}
              oninput={(e) =>
                formState.setPassword((e.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              class="ds-password-toggle"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {#if showPassword}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                  ></path>
                  <path
                    d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                  ></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              {:else}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
