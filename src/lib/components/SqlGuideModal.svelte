<script lang="ts">
  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let activeTab = $state<
    'warnings' | 'best-practices' | 'examples' | 'debugging' | 'performance'
  >('warnings');

  const tabs = [
    {
      id: 'warnings' as const,
      label: '⚠️ Warnings',
      color: 'var(--peach-text)',
    },
    {
      id: 'best-practices' as const,
      label: '✅ Best Practices',
      color: 'var(--green-text)',
    },
    {
      id: 'examples' as const,
      label: '📝 Examples',
      color: 'var(--blue-text)',
    },
    {
      id: 'debugging' as const,
      label: '🔍 Debugging',
      color: 'var(--yellow-text)',
    },
    {
      id: 'performance' as const,
      label: '⚡ Performance',
      color: 'var(--purple-text)',
    },
  ];

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    // Could add toast notification here
  }

  const warnings = [
    {
      icon: '❌',
      title: 'DROP TABLE, TRUNCATE',
      description:
        'Deletes actual data — Use DELETE FROM ... WHERE with filters instead',
    },
    {
      icon: '❌',
      title: 'ALTER TABLE, DROP COLUMN',
      description: 'Changes schema at runtime may lock system tables',
    },
    {
      icon: '❌',
      title: 'GRANT, REVOKE, CREATE USER',
      description: 'Permission management should be done by DBAs',
    },
    {
      icon: '❌',
      title: 'VACUUM FULL, CLUSTER',
      description:
        'Locks tables for long duration — Use VACUUM (ANALYZE) instead',
    },
    {
      icon: '❌',
      title: 'Scripts without explicit COMMIT/ROLLBACK',
      description:
        'May leave transactions hanging → lock tables for long periods',
    },
    {
      icon: '❌',
      title: 'SELECT * from large tables',
      description: 'Memory overflow — Specify columns or use LIMIT',
    },
    {
      icon: '❌',
      title: 'Loop inserting one row at a time',
      description: 'Very slow — Use batch insert (5,000–10,000 rows/batch)',
    },
  ];

  const bestPractices = [
    {
      title: '1. Transaction Management',
      code: `-- ✅ Use DO $$ ... $$ with COMMIT between batches
DO $$
DECLARE
    batch_size INT := 5000;
    affected INT;
    total INT := 0;
BEGIN
    LOOP
        INSERT INTO target_table (...)
        SELECT ...
        FROM source_table
        WHERE NOT EXISTS (...)
        LIMIT batch_size;

        GET DIAGNOSTICS affected = ROW_COUNT;
        total := total + affected;
        RAISE NOTICE 'Inserted % rows (total: %)', affected, total;

        EXIT WHEN affected = 0;
        COMMIT;  -- ✅ Commit between batches to prevent long locks
    END LOOP;
END $$;`,
    },
    {
      title: '2. Safety Checks',
      code: `-- ✅ Check row count before running
DO $$
DECLARE
    target_count INT;
BEGIN
    SELECT COUNT(*) INTO target_count
    FROM patient_insurances
    WHERE deleted_at IS NULL;

    IF target_count > 0 THEN
        RAISE NOTICE 'Found % existing rows — skipping insert', target_count;
        RETURN;
    END IF;

    -- ... proceed with work ...
END $$;`,
    },
    {
      title: '3. Progress Tracking',
      code: `-- ✅ Use RAISE NOTICE to show progress
RAISE NOTICE 'Processing batch % ...', batch_num;
RAISE NOTICE 'Inserted % rows (total: %)', affected, total;`,
    },
    {
      title: '4. Error Handling',
      code: `-- ✅ Add EXCEPTION block for clear error logging
DO $$
BEGIN
    -- ... main script ...
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % %', SQLERRM, SQLSTATE;
    RAISE;  -- Re-raise to let system know it failed
END $$;`,
    },
  ];

  const debuggingTips = [
    {
      problem: 'Script gets canceled',
      solution:
        'Add SET statement_timeout = 0; at the top (system sets it automatically)',
    },
    {
      problem: 'Inserts too slow',
      solution: 'Reduce batch_size (start with 5000 → reduce to 1000)',
    },
    {
      problem: 'Memory overflow',
      solution: 'Use CURSOR + FETCH instead of SELECT ... all at once',
    },
    {
      problem: 'Tables locked for long time',
      solution: 'Make sure you COMMIT between batches',
    },
  ];

  const performanceTips = {
    tip1: `-- ✅ Create temporary indexes for faster lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS tmp_idx
ON patient_insurances (patient_id, health_right_id)
WHERE deleted_at IS NULL;

-- ... run script ...

-- ✅ Drop index after use (if needed)
-- DROP INDEX CONCURRENTLY IF NOT EXISTS tmp_idx;`,
  };
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="dialog-overlay" role="presentation" onclick={onClose}>
    <div
      class="dialog dialog--large"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sql-guide-title"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="dialog-header">
        <h2 id="sql-guide-title" class="dialog-title">
          📝 Custom SQL Script Guide
        </h2>
        <button class="dialog-close" onclick={onClose} aria-label="Close">
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

      <!-- Tabs -->
      <div class="sql-guide-tabs">
        <div class="sql-guide-tabs-container">
          {#each tabs as tab (tab.id)}
            <button
              class="sql-guide-tab"
              class:sql-guide-tab--active={activeTab === tab.id}
              onclick={() => (activeTab = tab.id)}
              style="--tab-color: {tab.color};"
            >
              <span class="sql-guide-tab-label">{tab.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Content -->
      <div class="dialog-body sql-guide-body">
        <!-- Warnings Tab -->
        {#if activeTab === 'warnings'}
          <div class="sql-guide-section">
            <div class="sql-guide-warnings">
              {#each warnings as warning (warning.title)}
                <div class="sql-guide-warning-item">
                  <span class="sql-guide-warning-icon">{warning.icon}</span>
                  <div class="sql-guide-warning-content">
                    <div class="sql-guide-warning-title">{warning.title}</div>
                    <div class="sql-guide-warning-desc">
                      {warning.description}
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <div class="sql-guide-summary">
              <div class="sql-guide-summary-title">📌 Summary</div>
              <ul class="sql-guide-summary-list">
                <li>Avoid DDL that locks system tables (DROP, ALTER)</li>
                <li>Never DROP/TRUNCATE — Use DELETE ... WHERE instead</li>
                <li>Always COMMIT between batch processing</li>
              </ul>
            </div>
          </div>
        {/if}

        <!-- Best Practices Tab -->
        {#if activeTab === 'best-practices'}
          <div class="sql-guide-section">
            <div class="sql-guide-practices">
              {#each bestPractices as practice (practice.title)}
                <div class="sql-guide-practice-item">
                  <div class="sql-guide-practice-title">{practice.title}</div>
                  <div class="sql-guide-code-block">
                    <button
                      class="sql-guide-copy-btn"
                      onclick={() => copyToClipboard(practice.code)}
                      title="Copy to clipboard"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="8"
                          height="8"
                          rx="1"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M5 5h7M8 8h7"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                      </svg>
                      Copy
                    </button>
                    <pre class="sql-guide-code"><code>{practice.code}</code
                      ></pre>
                  </div>
                </div>
              {/each}
            </div>

            <div class="sql-guide-summary">
              <div class="sql-guide-summary-title">📌 Summary</div>
              <ul class="sql-guide-summary-list">
                <li>
                  Use DO $$ ... COMMIT ... $$ + batch processing (5,000
                  rows/batch)
                </li>
                <li>Add RAISE NOTICE for progress tracking</li>
                <li>Include EXCEPTION WHEN OTHERS for clear error logging</li>
              </ul>
            </div>
          </div>
        {/if}

        <!-- Examples Tab -->
        {#if activeTab === 'examples'}
          <div class="sql-guide-section">
            <div class="sql-guide-example-intro">
              <div class="sql-guide-example-title">
                Batch Insert with Progress Tracking
              </div>
              <p class="sql-guide-example-desc">
                Complete example script for batch inserting large amounts of
                data with progress tracking and comprehensive error handling
              </p>
            </div>

            <div class="sql-guide-code-block sql-guide-code-block--large">
              <button
                class="sql-guide-copy-btn"
                onclick={() =>
                  copyToClipboard(`DO $$
DECLARE
    batch_size INT := 5000;
    affected INT;
    total INT := 0;
BEGIN
    LOOP
        INSERT INTO patient_insurances (
            patient_id,
            health_right_id,
            health_right_name,
            scheme_code,
            priority_order,
            is_active,
            is_deleted,
            is_ready_for_claim,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            '1f5af16e-5b25-4bb6-af57-f68d3efea370',
            hr.name_th,
            hr.code,
            1,
            true,
            false,
            false,
            NOW(),
            NOW()
        FROM patients p
        CROSS JOIN health_rights hr
        WHERE hr.id = '1f5af16e-5b25-4bb6-af57-f68d3efea370'
          AND NOT EXISTS (
              SELECT 1 FROM patient_insurances pi
              WHERE pi.patient_id = p.id
                AND pi.health_right_id = '1f5af16e-5b25-4bb6-af57-f68d3efea370'
                AND pi.deleted_at IS NULL
          )
        LIMIT batch_size;

        GET DIAGNOSTICS affected = ROW_COUNT;
        total := total + affected;
        RAISE NOTICE 'Inserted % rows (total: %)', affected, total;

        EXIT WHEN affected = 0;
        COMMIT;
    END LOOP;

    RAISE NOTICE 'Done! Total inserted: %', total;
END $$;`)}
                title="Copy to clipboard"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect
                    x="2"
                    y="2"
                    width="8"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path
                    d="M5 5h7M8 8h7"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                </svg>
                Copy Full Example
              </button>
              <pre class="sql-guide-code"><code
                  >DO $$
DECLARE
    batch_size INT := 5000;
    affected INT;
    total INT := 0;
BEGIN
    LOOP
        INSERT INTO patient_insurances (
            patient_id,
            health_right_id,
            health_right_name,
            scheme_code,
            priority_order,
            is_active,
            is_deleted,
            is_ready_for_claim,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            '1f5af16e-5b25-4bb6-af57-f68d3efea370',
            hr.name_th,
            hr.code,
            1,
            true,
            false,
            false,
            NOW(),
            NOW()
        FROM patients p
        CROSS JOIN health_rights hr
        WHERE hr.id = '1f5af16e-5b25-4bb6-af57-f68d3efea370'
          AND NOT EXISTS (
              SELECT 1 FROM patient_insurances pi
              WHERE pi.patient_id = p.id
                AND pi.health_right_id = '1f5af16e-5b25-4bb6-af57-f68d3efea370'
                AND pi.deleted_at IS NULL
          )
        LIMIT batch_size;

        GET DIAGNOSTICS affected = ROW_COUNT;
        total := total + affected;
        RAISE NOTICE 'Inserted % rows (total: %)', affected, total;

        EXIT WHEN affected = 0;
        COMMIT;
    END LOOP;

    RAISE NOTICE 'Done! Total inserted: %', total;
END $$;</code
                ></pre>
            </div>
          </div>
        {/if}

        <!-- Debugging Tab -->
        {#if activeTab === 'debugging'}
          <div class="sql-guide-section">
            <div class="sql-guide-debug-table">
              <table class="sql-guide-table">
                <thead>
                  <tr>
                    <th>🐛 ปัญหา</th>
                    <th>🔧 วิธีแก้</th>
                  </tr>
                </thead>
                <tbody>
                  {#each debuggingTips as tip (tip.problem)}
                    <tr>
                      <td class="sql-guide-problem">{tip.problem}</td>
                      <td class="sql-guide-solution">{tip.solution}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- Performance Tab -->
        {#if activeTab === 'performance'}
          <div class="sql-guide-section">
            <div class="sql-guide-performance">
              <div class="sql-guide-performance-title">
                Performance Optimization Tips
              </div>

              <div class="sql-guide-code-block">
                <button
                  class="sql-guide-copy-btn"
                  onclick={() => copyToClipboard(performanceTips.tip1)}
                  title="Copy to clipboard"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="M5 5h7M8 8h7"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                  </svg>
                  Copy
                </button>
                <pre class="sql-guide-code"><code>{performanceTips.tip1}</code
                  ></pre>
              </div>

              <div class="sql-guide-performance-tips">
                <div class="sql-guide-performance-tip">
                  <div class="sql-guide-performance-tip-title">
                    🚀 Optimal Batch Size
                  </div>
                  <p class="sql-guide-performance-tip-desc">
                    Start with 5,000 rows/batch. If too slow, reduce to 1,000
                    for better performance
                  </p>
                </div>

                <div class="sql-guide-performance-tip">
                  <div class="sql-guide-performance-tip-title">
                    📊 Progress Monitoring
                  </div>
                  <p class="sql-guide-performance-tip-desc">
                    Use RAISE NOTICE statements to track progress and make
                    debugging easier
                  </p>
                </div>

                <div class="sql-guide-performance-tip">
                  <div class="sql-guide-performance-tip-title">
                    🔍 Index Optimization
                  </div>
                  <p class="sql-guide-performance-tip-desc">
                    Create temporary indexes with CONCURRENTLY to avoid blocking
                    write operations
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="btn btn-secondary" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
