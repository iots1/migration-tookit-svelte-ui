<script lang="ts">
  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let activeTab = $state<
    'flow' | 'sql' | 'pagination' | 'transformers' | 'checkpoint'
  >('flow');
  let lang = $state<'th' | 'en'>('th');

  const tabs = [
    {
      id: 'flow' as const,
      th: '🔄 Pipeline Flow',
      en: '🔄 Pipeline Flow',
      color: 'var(--blue-text)',
    },
    {
      id: 'sql' as const,
      th: '🔍 สร้าง SQL',
      en: '🔍 SQL Generation',
      color: 'var(--green-text)',
    },
    {
      id: 'pagination' as const,
      th: '📄 Pagination',
      en: '📄 Pagination',
      color: 'var(--purple-text)',
    },
    {
      id: 'transformers' as const,
      th: '⚙️ Transformers',
      en: '⚙️ Transformers',
      color: 'var(--yellow-text)',
    },
    {
      id: 'checkpoint' as const,
      th: '💾 Checkpoint',
      en: '💾 Checkpoint',
      color: 'var(--peach-text)',
    },
  ];

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }

  function t(th: string, en: string): string {
    return lang === 'th' ? th : en;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="dialog-overlay" role="presentation" onclick={onClose}>
    <div
      class="dialog dialog--large"
      role="dialog"
      aria-modal="true"
      aria-labelledby="etl-guide-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="dialog-header">
        <h2 id="etl-guide-title" class="dialog-title">
          {t('🔄 วิธีการทำงานของ ETL Migration', '🔄 How ETL Migration Works')}
        </h2>
        <div class="dialog-header-actions">
          <button
            class="lang-toggle"
            onclick={() => (lang = lang === 'th' ? 'en' : 'th')}
          >
            {lang === 'th' ? 'EN' : 'TH'}
          </button>
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
      </div>

      <div class="sql-guide-tabs">
        <div class="sql-guide-tabs-container">
          {#each tabs as tab (tab.id)}
            <button
              class="sql-guide-tab"
              class:sql-guide-tab--active={activeTab === tab.id}
              onclick={() => (activeTab = tab.id)}
              style="--tab-color: {tab.color};"
            >
              <span class="sql-guide-tab-label"
                >{lang === 'th' ? tab.th : tab.en}</span
              >
            </button>
          {/each}
        </div>
      </div>

      <div class="dialog-body sql-guide-body">
        {#if activeTab === 'flow'}
          <div class="sql-guide-section">
            <p class="etl-intro">
              {t(
                'เมื่อ config ถูก run ผ่าน Pipeline executor ระบบจะทำงานตามลำดับดังนี้',
                'When a config is run through the Pipeline executor, the system operates in the following order:'
              )}
            </p>

            <div class="etl-steps">
              <div class="etl-step">
                <div class="etl-step-num">1</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">
                    🔌 Connect to Source & Target
                  </div>
                  <p class="etl-step-desc">
                    {t(
                      'สร้าง SQLAlchemy engine สองตัว (source / target) พร้อม <code>pool_pre_ping=True</code> และ <code>pool_recycle=1800</code> เพื่อป้องกัน stale connection. สำหรับ PostgreSQL จะ tune session ด้วย <code>work_mem = 256MB</code>, <code>statement_timeout = 0</code>, <code>max_parallel_workers_per_gather = 4</code> และเปิด TCP keepalive เพื่อป้องกัน connection หลุดระหว่าง batch.',
                      'Creates two SQLAlchemy engines (source / target) with <code>pool_pre_ping=True</code> and <code>pool_recycle=1800</code> to prevent stale connections. For PostgreSQL, the session is tuned with <code>work_mem = 256MB</code>, <code>statement_timeout = 0</code>, <code>max_parallel_workers_per_gather = 4</code>, and TCP keepalive is enabled to prevent connection drops during batches.'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step">
                <div class="etl-step-num">2</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">📋 Build SELECT Query</div>
                  <p class="etl-step-desc">
                    {t(
                      'ถ้า config มี <code>generate_sql</code> → ใช้ SQL นั้นโดยตรง แล้ว remap column จาก <code>source → target</code> name.<br />ถ้าไม่มี → <code>build_select_query()</code> สร้าง <code>SELECT "col1", "col2" FROM table</code> จาก mappings ที่ไม่ ignore. สำหรับ MSSQL จะ auto-qualify table เป็น <code>dbo.table</code> และ wrap CHAR columns ด้วย <code>TRIM()</code> เพื่อตัด padding.',
                      'If the config has <code>generate_sql</code> → use that SQL directly, then remap columns from <code>source → target</code> names.<br />If not → <code>build_select_query()</code> generates <code>SELECT "col1", "col2" FROM table</code> from non-ignored mappings. For MSSQL, tables are auto-qualified as <code>dbo.table</code> and CHAR columns are wrapped with <code>TRIM()</code> to strip padding.'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step">
                <div class="etl-step-num">3</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">
                    📄 Cursor-Based Pagination (Batches)
                  </div>
                  <p class="etl-step-desc">
                    {t(
                      'ดึงข้อมูลทีละ batch แทนที่จะโหลดทั้งตารางพร้อมกัน. ใช้ <strong>Cursor Pagination</strong> ผ่าน <code>pk_columns</code> (ไม่มี OFFSET slowdown O(N)). ถ้าไม่มี PK ให้ fallback เป็น OFFSET-based pagination. แต่ละ dialect ใช้ syntax ต่างกัน (ดู tab Pagination).',
                      'Fetches data in batches instead of loading the entire table at once. Uses <strong>Cursor Pagination</strong> via <code>pk_columns</code> (no O(N) OFFSET slowdown). Falls back to OFFSET-based pagination if no PK is available. Each dialect uses different syntax (see the Pagination tab).'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step">
                <div class="etl-step-num">4</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">⚙️ Transform Batch</div>
                  <p class="etl-step-desc">
                    {t(
                      '<code>transform_batch()</code> รัน transformers ทุกตัวตาม config บน DataFrame ด้วย vectorized operations (Pandas Series). จากนั้น rename columns <code>source → target</code>, drop ignored columns, lowercase ชื่อ column ทั้งหมด. รัน validators และ collect warnings ไว้รายงาน.',
                      '<code>transform_batch()</code> runs all configured transformers on the DataFrame using vectorized operations (Pandas Series). Then renames columns <code>source → target</code>, drops ignored columns, and lowercases all column names. Validators are run and warnings are collected for reporting.'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step">
                <div class="etl-step-num">5</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">💾 Insert to Target</div>
                  <p class="etl-step-desc">
                    {t(
                      '<strong>PostgreSQL</strong>: ใช้ <code>COPY FROM STDIN</code> (CSV stream) ใน explicit transaction — เร็วกว่า INSERT 5–10x, rollback ทันทีถ้า fail.<br /><strong>MySQL / MSSQL</strong>: ใช้ <code>DataFrame.to_sql(method="multi")</code> ใน <code>engine.begin()</code>.<br />Upsert strategy (<code>upsert</code> / <code>upsert_ignore</code>): COPY เข้า temp table → <code>INSERT ... ON CONFLICT</code>.',
                      '<strong>PostgreSQL</strong>: Uses <code>COPY FROM STDIN</code> (CSV stream) in an explicit transaction — 5–10x faster than INSERT, with immediate rollback on failure.<br /><strong>MySQL / MSSQL</strong>: Uses <code>DataFrame.to_sql(method="multi")</code> within <code>engine.begin()</code>.<br />Upsert strategy (<code>upsert</code> / <code>upsert_ignore</code>): COPY into a temp table → <code>INSERT ... ON CONFLICT</code>.'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step">
                <div class="etl-step-num">6</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">💿 Save Checkpoint</div>
                  <p class="etl-step-desc">
                    {t(
                      'หลังแต่ละ batch บันทึก checkpoint ด้วย <code>os.replace()</code> (atomic rename) ป้องกัน file corrupt ถ้า process crash กลางทาง. ถ้า migration ถูก interrupt สามารถ resume ได้จาก batch ล่าสุดโดยอัตโนมัติ.',
                      'After each batch, a checkpoint is saved using <code>os.replace()</code> (atomic rename) to prevent file corruption if the process crashes mid-write. If the migration is interrupted, it can automatically resume from the last batch.'
                    )}
                  </p>
                </div>
              </div>

              <div class="etl-step etl-step--success">
                <div class="etl-step-num etl-step-num--success">✓</div>
                <div class="etl-step-body">
                  <div class="etl-step-title">✅ Verify & Complete</div>
                  <p class="etl-step-desc">
                    {t(
                      'นับ rows ใน target ก่อนและหลัง migration เพื่อ verify. ลบ checkpoint file. คืนค่า <code>MigrationResult</code> พร้อม rows_processed, batch_count, duration.',
                      'Counts rows in the target before and after migration for verification. Deletes the checkpoint file. Returns a <code>MigrationResult</code> with rows_processed, batch_count, and duration.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div class="etl-flow-types">
              <div class="etl-flow-type etl-flow-type--std">
                <div class="etl-flow-type-badge">std</div>
                <p>
                  {t(
                    'ใช้ steps 1–6 ครบทุกขั้นตอน',
                    'Runs all steps 1–6 in full'
                  )}
                </p>
              </div>
              <div class="etl-flow-type etl-flow-type--custom">
                <div class="etl-flow-type-badge">custom</div>
                <p>
                  {t(
                    'รัน SQL script โดยตรงบน target DB (ไม่มี pagination / transformer)',
                    'Runs SQL scripts directly on the target DB (no pagination / transformers)'
                  )}
                </p>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'sql'}
          <div class="sql-guide-section">
            <div class="etl-section-title">
              {t(
                'การสร้าง SELECT Query จาก Field Mappings',
                'Building SELECT Queries from Field Mappings'
              )}
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                📋 {t(
                  'Case 1: ไม่มี generate_sql (Standard Mode)',
                  'Case 1: No generate_sql (Standard Mode)'
                )}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    '<code>build_select_query()</code> วนลูป mappings ที่ไม่ ignore และสร้าง SELECT statement อัตโนมัติ:',
                    '<code>build_select_query()</code> iterates over non-ignored mappings and generates a SELECT statement automatically:'
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `-- Config mappings: Code→code, Name→name_th (ignore=false)
-- ItemID (ignore=true) → ถูก skip

SELECT "Code", "Name"
FROM dbHealthRight

-- MSSQL + TRIM transformer:
SELECT TRIM("Code") AS "Code", "Name"
FROM dbo.dbHealthRight`,
                        `-- Config mappings: Code→code, Name→name_th (ignore=false)
-- ItemID (ignore=true) → skipped

SELECT "Code", "Name"
FROM dbHealthRight

-- MSSQL + TRIM transformer:
SELECT TRIM("Code") AS "Code", "Name"
FROM dbo.dbHealthRight`
                      )}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                📝 {t(
                  'Case 2: มี generate_sql (Custom SELECT)',
                  'Case 2: With generate_sql (Custom SELECT)'
                )}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'ใช้ SQL ที่ user เขียนเองโดยตรง จากนั้น remap column names ให้ตรงกับ target:',
                    'Uses the user-written SQL directly, then remaps column names to match the target:'
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `-- generate_sql ที่ user เขียน:
SELECT Code AS code, Name AS name_th
FROM dbSpecialClinic
WHERE IsActive = 1

-- ระบบ remap mappings: source name → target name
-- (เพราะ column ใน result ของ generate_sql ใช้ชื่อ target แล้ว)
-- mapping: {source: "code", target: "code"}  ← ชื่อเดิม`,
                        `-- User-written generate_sql:
SELECT Code AS code, Name AS name_th
FROM dbSpecialClinic
WHERE IsActive = 1

-- System remaps mappings: source name → target name
-- (columns in the generate_sql result already use target names)
-- mapping: {source: "code", target: "code"}  ← unchanged`
                      )}</code
                    ></pre>
                </div>
                <div class="etl-alert etl-alert--warning">
                  <strong>{t('⚠️ สำคัญ:', '⚠️ Important:')}</strong>
                  {t(
                    'ถ้าใช้ generate_sql และต้องการ Cursor Pagination ต้องระบุ <code>pk_columns</code> ใน Field Mapping ด้วย เพราะ system ไม่สามารถ auto-detect PK ที่อยู่ใน subquery ได้. ถ้าไม่ระบุจะ fallback เป็น OFFSET pagination.',
                    'When using generate_sql and wanting Cursor Pagination, you must specify <code>pk_columns</code> in the Field Mapping because the system cannot auto-detect PKs inside subqueries. Without it, pagination will fall back to OFFSET-based.'
                  )}
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">🔢 Schema Validation</div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'ก่อน batch แรก ระบบ validate schema compatibility:',
                    'Before the first batch, the system validates schema compatibility:'
                  )}
                </p>
                <ul class="etl-list">
                  <li>
                    {t(
                      'เปรียบเทียบ column types ระหว่าง source และ target',
                      'Compares column types between source and target'
                    )}
                  </li>
                  <li>
                    {t(
                      'แจ้งเตือนถ้า source column ใหญ่กว่า target limit (เช่น VARCHAR(500) → VARCHAR(100))',
                      'Warns if source column is larger than target limit (e.g., VARCHAR(500) → VARCHAR(100))'
                    )}
                  </li>
                  <li>
                    {t(
                      'ถ้าเกิด truncation จริงใน batch → report ว่า column ไหน, overflow กี่ rows, ค่าตัวอย่าง',
                      'If truncation actually occurs in a batch → reports which column, how many rows overflowed, and sample values'
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'pagination'}
          <div class="sql-guide-section">
            <div class="etl-section-title">
              {t('Pagination Strategies', 'Pagination Strategies')}
            </div>

            <div class="etl-compare">
              <div class="etl-compare-card etl-compare-card--good">
                <div class="etl-compare-header">
                  <span class="etl-compare-badge etl-compare-badge--good"
                    >✅ {t('Cursor-Based', 'Cursor-Based')}</span
                  >
                  <span class="etl-compare-subtitle"
                    >{t('ต้องมี pk_columns', 'Requires pk_columns')}</span
                  >
                </div>
                <ul class="etl-list">
                  <li>
                    {t(
                      'Performance คงที่ O(1) ต่อ batch ไม่ว่าจะ batch ที่เท่าไหร่',
                      'Constant O(1) performance per batch regardless of batch number'
                    )}
                  </li>
                  <li>
                    {t(
                      'Resume ได้หลัง crash โดยไม่ซ้ำ row',
                      'Can resume after crash without duplicate rows'
                    )}
                  </li>
                  <li>
                    {t(
                      'ใช้ <code>WHERE (pk) &gt; last_seen_pk ORDER BY pk LIMIT n</code>',
                      'Uses <code>WHERE (pk) &gt; last_seen_pk ORDER BY pk LIMIT n</code>'
                    )}
                  </li>
                </ul>
              </div>
              <div class="etl-compare-card etl-compare-card--bad">
                <div class="etl-compare-header">
                  <span class="etl-compare-badge etl-compare-badge--bad"
                    >⚠️ {t('OFFSET-Based', 'OFFSET-Based')}</span
                  >
                  <span class="etl-compare-subtitle"
                    >{t('fallback เมื่อไม่มี PK', 'Fallback when no PK')}</span
                  >
                </div>
                <ul class="etl-list">
                  <li>
                    {t(
                      'Performance ช้าลงเรื่อยๆ O(N) — DB ต้อง scan ทุก row ก่อน offset',
                      'Performance degrades at O(N) — DB must scan all rows before the offset'
                    )}
                  </li>
                  <li>
                    {t(
                      'Resume ไม่แม่นยำ (rows อาจเปลี่ยนระหว่าง run)',
                      'Inaccurate resume (rows may change between runs)'
                    )}
                  </li>
                  <li>
                    {t(
                      'ใช้ <code>LIMIT n OFFSET m</code> หรือ ROW_NUMBER() สำหรับ MSSQL',
                      'Uses <code>LIMIT n OFFSET m</code> or ROW_NUMBER() for MSSQL'
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <div class="etl-section-title" style="margin-top: 24px;">
              {t('SQL ที่ถูก Generate ตาม Dialect', 'Generated SQL by Dialect')}
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                🐘 PostgreSQL — {t(
                  'Row-Value Comparison',
                  'Row-Value Comparison'
                )}
              </div>
              <div class="etl-card-body">
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `-- Batch แรก (ยังไม่มี last_seen_pk):
SELECT * FROM (SELECT "Code", "Name" FROM dbHealthRight) AS _paginated_src
ORDER BY "Code"
LIMIT 1000

-- Batch ถัดไป (last_seen_pk = ('A001',)):
SELECT * FROM (...) AS _paginated_src
WHERE ("Code") > ('A001')
ORDER BY "Code"
LIMIT 1000`,
                        `-- First batch (no last_seen_pk yet):
SELECT * FROM (SELECT "Code", "Name" FROM dbHealthRight) AS _paginated_src
ORDER BY "Code"
LIMIT 1000

-- Next batch (last_seen_pk = ('A001',)):
SELECT * FROM (...) AS _paginated_src
WHERE ("Code") > ('A001')
ORDER BY "Code"
LIMIT 1000`
                      )}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                🪟 MSSQL — {t('FETCH NEXT Syntax', 'FETCH NEXT Syntax')}
              </div>
              <div class="etl-card-body">
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `-- MSSQL ไม่รองรับ LIMIT → ใช้ FETCH NEXT แทน:
SELECT * FROM (...) AS _paginated_src
WHERE "ItemID" > :pk_0
ORDER BY "ItemID"
OFFSET 0 ROWS FETCH NEXT 1000 ROWS ONLY

-- OFFSET fallback สำหรับ MSSQL (ไม่มี PK):
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT 0)) AS _surrogate_row_num
  FROM (...) AS _offset_src
) AS _offset_paged
WHERE _surrogate_row_num > :offset
AND _surrogate_row_num <= :offset + :batch_size
ORDER BY _surrogate_row_num`,
                        `-- MSSQL doesn't support LIMIT → uses FETCH NEXT instead:
SELECT * FROM (...) AS _paginated_src
WHERE "ItemID" > :pk_0
ORDER BY "ItemID"
OFFSET 0 ROWS FETCH NEXT 1000 ROWS ONLY

-- OFFSET fallback for MSSQL (no PK):
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT 0)) AS _surrogate_row_num
  FROM (...) AS _offset_src
) AS _offset_paged
WHERE _surrogate_row_num > :offset
AND _surrogate_row_num <= :offset + :batch_size
ORDER BY _surrogate_row_num`
                      )}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                🔑 {t('การตั้งค่า pk_columns', 'Setting pk_columns')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'ระบบเลือก pk_columns ตามลำดับความสำคัญนี้:',
                    'The system selects pk_columns in this priority order:'
                  )}
                </p>
                <div class="etl-priority-list">
                  <div class="etl-priority-item">
                    <span class="etl-priority-num">1</span>
                    <div>
                      <strong
                        >{t(
                          'User กำหนด pk_columns ใน Field Mapping',
                          'User specifies pk_columns in Field Mapping'
                        )}</strong
                      >
                      <p>
                        {t(
                          'ใช้ทันที — รองรับทั้ง standard SELECT และ generate_sql',
                          'Used immediately — supports both standard SELECT and generate_sql'
                        )}
                      </p>
                    </div>
                  </div>
                  <div class="etl-priority-item">
                    <span class="etl-priority-num">2</span>
                    <div>
                      <strong
                        >{t(
                          'Auto-detect จาก source schema',
                          'Auto-detect from source schema'
                        )}</strong
                      >
                      <p>
                        {t(
                          'ใช้เมื่อไม่มี pk_columns และไม่มี generate_sql — inspect PK constraint จาก DB',
                          'Used when no pk_columns and no generate_sql — inspects PK constraint from the DB'
                        )}
                      </p>
                    </div>
                  </div>
                  <div class="etl-priority-item etl-priority-item--fallback">
                    <span class="etl-priority-num">3</span>
                    <div>
                      <strong
                        >{t(
                          'Fallback: OFFSET pagination',
                          'Fallback: OFFSET pagination'
                        )}</strong
                      >
                      <p>
                        {t(
                          'ใช้เมื่อไม่มี PK เลย หรือมี generate_sql แต่ไม่มี pk_columns',
                          'Used when there is no PK at all, or when using generate_sql without pk_columns'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="etl-alert etl-alert--info">
                  <strong>{t('💡 Best Practice:', '💡 Best Practice:')}</strong>
                  {t(
                    'เปิด checkbox <strong>PK</strong> ใน Field Mapping table สำหรับ column ที่เป็น Primary Key ของ source table เพื่อให้ migration ใช้ Cursor Pagination เสมอ (เร็วกว่าและ resume ได้หลัง crash)',
                    "Enable the <strong>PK</strong> checkbox in the Field Mapping table for columns that are the source table's Primary Key to ensure migration always uses Cursor Pagination (faster and supports crash recovery)"
                  )}
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'transformers'}
          <div class="sql-guide-section">
            <div class="etl-section-title">
              {t('วิธีการทำงานของ Transformers', 'How Transformers Work')}
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                ⚙️ {t('Transformer Pipeline', 'Transformer Pipeline')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'Transformers รันเป็นลำดับ (chain) บน Pandas Series — vectorized operations ทำงานบนทุก row พร้อมกัน ไม่ใช่ row-by-row loop:',
                    'Transformers run in sequence (chain) on Pandas Series — vectorized operations process all rows simultaneously, not row-by-row loops:'
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `-- Config: transformers = ["FIX_THAI_ENCODING_CP874", "TRIM"]
-- ระบบทำ:
series = df["Name"]                          # ← Series ทั้ง column
series = fix_thai_encoding(series)           # ← vectorized
series = series.str.strip()                  # ← vectorized
df["Name"] = series                          # ← assign กลับ

-- ถ้า source != target จะ rename หลังจาก transform ครบ:
df["name_th"] = df["Name"]
df.drop("Name")                              # ← ลบ source column ออก`,
                        `-- Config: transformers = ["FIX_THAI_ENCODING_CP874", "TRIM"]
-- System does:
series = df["Name"]                          # ← entire column as Series
series = fix_thai_encoding(series)           # ← vectorized
series = series.str.strip()                  # ← vectorized
df["Name"] = series                          # ← assign back

-- If source != target, rename after all transforms:
df["name_th"] = df["Name"]
df.drop("Name")                              # ← remove source column`
                      )}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-section-title" style="margin-top: 24px;">
              {t('Transformer Categories', 'Transformer Categories')}
            </div>

            <div class="etl-transformer-grid">
              <div class="etl-transformer-group">
                <div
                  class="etl-transformer-group-title etl-transformer-group-title--text"
                >
                  📝 Text
                </div>
                <ul class="etl-transformer-list">
                  <li>
                    <code>TRIM</code> — {t(
                      'ตัด whitespace',
                      'Strip whitespace'
                    )}
                  </li>
                  <li>
                    <code>FIX_THAI_ENCODING_CP874</code>
                    — {t('แก้ encoding ภาษาไทย', 'Fix Thai encoding')}
                  </li>
                  <li>
                    <code>TRUNCATE_TO</code>
                    — {t('ตัดความยาว String', 'Truncate string length')}
                  </li>
                  <li>
                    <code>UPPER</code> / <code>LOWER</code>
                    — case conversion
                  </li>
                </ul>
              </div>
              <div class="etl-transformer-group">
                <div
                  class="etl-transformer-group-title etl-transformer-group-title--date"
                >
                  📅 Dates
                </div>
                <ul class="etl-transformer-list">
                  <li>
                    <code>BUDDHIST_TO_ISO</code>
                    — {t(
                      'พ.ศ. → ค.ศ. (ISO 8601)',
                      'Buddhist Era → CE (ISO 8601)'
                    )}
                  </li>
                  <li>
                    <code>DATE_FORMAT</code>
                    — {t('reformat date string', 'Reformat date string')}
                  </li>
                </ul>
              </div>
              <div class="etl-transformer-group">
                <div
                  class="etl-transformer-group-title etl-transformer-group-title--data"
                >
                  🔢 Data Type
                </div>
                <ul class="etl-transformer-list">
                  <li>
                    <code>BIT_CAST</code>
                    — {t('แปลง bool/int → "0"/"1"', 'Cast bool/int → "0"/"1"')}
                  </li>
                  <li>
                    <code>DEFAULT_VALUE</code>
                    — {t(
                      'ใส่ค่า default ถ้า null',
                      'Set default value if null'
                    )}
                  </li>
                  <li>
                    <code>VALUE_MAP</code>
                    — {t(
                      'map ค่าตาม rules table',
                      'Map values per rules table'
                    )}
                  </li>
                </ul>
              </div>
              <div class="etl-transformer-group">
                <div
                  class="etl-transformer-group-title etl-transformer-group-title--lookup"
                >
                  🔗 Lookup
                </div>
                <ul class="etl-transformer-list">
                  <li>
                    <code>GENERATE_HN</code>
                    — {t(
                      'generate HN sequential ใหม่',
                      'Generate new sequential HN'
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <div class="etl-card" style="margin-top: 20px;">
              <div class="etl-card-header">
                🗺️ VALUE_MAP — {t('ตัวอย่าง', 'Example')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'VALUE_MAP แปลงค่าตาม rules ที่กำหนด เช่น แปลง gender code จาก HIS:',
                    'VALUE_MAP transforms values based on defined rules, e.g., converting gender codes from HIS:'
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{`-- ${t('Rules config:', 'Rules config:')}
{
  "rules": [
    {"when": {"Sex": "1"}, "then": "male"},
    {"when": {"Sex": "2"}, "then": "female"}
  ],
  "default": "unknown"
}

-- ${t('Input:', 'Input:')}  Sex = ["1", "2", "9", null]
-- ${t('Output:', 'Output:')} gender = ["male", "female", "unknown", "unknown"]`}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card" style="margin-top: 16px;">
              <div class="etl-card-header">✅ Validators</div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'Validators รันหลัง transformers — ไม่ block migration แต่ collect warnings:',
                    "Validators run after transformers — they don't block migration but collect warnings:"
                  )}
                </p>
                <ul class="etl-list">
                  <li>
                    <code>VALID_DATE</code>
                    — {t(
                      'ตรวจสอบว่าเป็น date format ที่ valid',
                      'Check if value is a valid date format'
                    )}
                  </li>
                  <li>
                    <code>NOT_NULL</code>
                    — {t(
                      'แจ้งเตือนถ้ามี null values',
                      'Warn if null values exist'
                    )}
                  </li>
                  <li>
                    {t(
                      'Warning จะแสดงในผลลัพธ์: <em>"[column] VALIDATOR: X invalid rows"</em>',
                      'Warnings appear in results: <em>"[column] VALIDATOR: X invalid rows"</em>'
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'checkpoint'}
          <div class="sql-guide-section">
            <div class="etl-section-title">
              {t('Checkpoint & Resume System', 'Checkpoint & Resume System')}
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                💿 {t('Checkpoint File Structure', 'Checkpoint File Structure')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    "หลังทุก batch ระบบบันทึก checkpoint ที่ <code>migration_checkpoints/checkpoint_{'{config_name}'}.json</code>:",
                    "After every batch, the system saves a checkpoint at <code>migration_checkpoints/checkpoint_{'{config_name}'}.json</code>:"
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{`{
  "config_name": "dbHealthRight_health_rights_config",
  "last_batch": 42,
  "last_seen_pk": ["A500"],       // ← ${t('cursor position สำหรับ resume', 'cursor position for resume')}
  "rows_processed": 42000,
  "timestamp": "2026-04-28T14:30:00"
}`}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                ⚛️ {t('Atomic Write (os.replace)', 'Atomic Write (os.replace)')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'การเขียน checkpoint ใช้ <strong>atomic rename pattern</strong> เพื่อป้องกัน file corrupt ถ้า process crash กลางการเขียน:',
                    'Checkpoint writing uses the <strong>atomic rename pattern</strong> to prevent file corruption if the process crashes mid-write:'
                  )}
                </p>
                <div class="sql-guide-code-block">
                  <pre class="sql-guide-code"><code
                      >{t(
                        `# 1. เขียนลง temp file ก่อน
with open("checkpoint.json.tmp", "w") as f:
    json.dump(data, f)

# 2. Atomic swap (POSIX rename syscall — single kernel op)
os.replace("checkpoint.json.tmp", "checkpoint.json")

# ถ้า crash ก่อน os.replace → ไฟล์เก่ายังอยู่ครบถ้วน
# ถ้า crash หลัง os.replace → ไฟล์ใหม่ครบถ้วน
# ไม่มีสถานะ "กึ่งกลาง" ที่ corrupt`,
                        `# 1. Write to temp file first
with open("checkpoint.json.tmp", "w") as f:
    json.dump(data, f)

# 2. Atomic swap (POSIX rename syscall — single kernel op)
os.replace("checkpoint.json.tmp", "checkpoint.json")

# If crash before os.replace → old file is still intact
# If crash after os.replace → new file is intact
# No "halfway" corrupt state`
                      )}</code
                    ></pre>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                🔄 {t('Resume Flow', 'Resume Flow')}
              </div>
              <div class="etl-card-body">
                <p class="etl-card-desc">
                  {t(
                    'เมื่อ migration ถูก run ซ้ำ (เช่น หลัง crash):',
                    'When a migration is run again (e.g., after a crash):'
                  )}
                </p>
                <div class="etl-resume-flow">
                  <div class="etl-resume-step">
                    <span class="etl-resume-icon">📂</span>
                    <span
                      >{t(
                        'Load checkpoint file (ถ้ามี)',
                        'Load checkpoint file (if exists)'
                      )}</span
                    >
                  </div>
                  <div class="etl-resume-arrow">↓</div>
                  <div class="etl-resume-step">
                    <span class="etl-resume-icon">🔑</span>
                    <span>
                      {t(
                        'อ่าน <code>last_seen_pk</code> จาก checkpoint',
                        'Read <code>last_seen_pk</code> from checkpoint'
                      )}
                    </span>
                  </div>
                  <div class="etl-resume-arrow">↓</div>
                  <div class="etl-resume-step">
                    <span class="etl-resume-icon">📄</span>
                    <span>
                      {t(
                        'เริ่ม cursor pagination ต่อจาก <code>last_seen_pk</code><br /><em>(ข้าม rows ที่ insert ไปแล้วทั้งหมด — ไม่ซ้ำ)</em>',
                        'Resume cursor pagination from <code>last_seen_pk</code><br /><em>(Skips all previously inserted rows — no duplicates)</em>'
                      )}
                    </span>
                  </div>
                  <div class="etl-resume-arrow">↓</div>
                  <div class="etl-resume-step etl-resume-step--success">
                    <span class="etl-resume-icon">✅</span>
                    <span>
                      {t(
                        'เมื่อ migration สำเร็จ ลบ checkpoint file ทิ้ง',
                        'When migration completes successfully, delete the checkpoint file'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="etl-card">
              <div class="etl-card-header">
                🧠 {t('Memory Guard', 'Memory Guard')}
              </div>
              <div class="etl-card-body">
                <ul class="etl-list">
                  <li>
                    <strong
                      >{t(
                        'Adaptive batch sizing:',
                        'Adaptive batch sizing:'
                      )}</strong
                    >
                    {t(
                      'batch แรกวัด memory usage ของ DataFrame — ถ้าเกิน 200MB จะลด batch_size อัตโนมัติ',
                      'The first batch measures DataFrame memory usage — if it exceeds 200MB, batch_size is automatically reduced'
                    )}
                  </li>
                  <li>
                    <strong
                      >{t('Memory threshold:', 'Memory threshold:')}</strong
                    >
                    &gt;85% → {t('รัน GC', 'run GC')}, &gt;95% → {t(
                      'abort เพื่อป้องกัน OOM kill',
                      'abort to prevent OOM kill'
                    )}
                  </li>
                  <li>
                    <strong>{t('Quarantine mode:', 'Quarantine mode:')}</strong>
                    {t(
                      'ถ้า batch insert fail และ config ตั้งค่า <code>error_handling: skip_bad_rows</code> → ลองแบ่ง batch ย่อยและ row-by-row เพื่อแยก bad rows ออก',
                      'If batch insert fails and config has <code>error_handling: skip_bad_rows</code> → tries splitting into smaller batches and row-by-row to isolate bad rows'
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
