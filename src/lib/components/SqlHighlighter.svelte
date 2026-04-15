<script lang="ts">
  interface Props {
    value: string;
    oninput: (event: Event) => void;
    placeholder?: string;
    readonly?: boolean;
    class?: string;
    style?: string;
  }

  let {
    value,
    oninput,
    placeholder = '',
    readonly = false,
    class: className = '',
    style = '',
  }: Props = $props();

  let textareaEl = $state<HTMLTextAreaElement>();

  // Simple SQL syntax highlighting using basic text replacement
  function applySimpleHighlighting(sql: string): string {
    if (!sql) return '';
    return sql
      .replace(
        /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IS|IN|BETWEEN|LIKE|ORDER BY|GROUP BY|HAVING|DISTINCT|LIMIT|OFFSET|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|ASC|DESC|VALUES|SET|INTO|TABLE|INDEX|VIEW|FUNCTION|PROCEDURE|TRIGGER|GRANT|REVOKE|COMMIT|ROLLBACK|TRANSACTION|BEGIN)\b/gi,
        '<span style="color: #ff6b6b; font-weight: 600;">$1</span>'
      )
      .replace(
        /\b(INT|INTEGER|VARCHAR|CHAR|TEXT|BOOLEAN|DATE|TIME|TIMESTAMP|DATETIME|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|SERIAL|BIGINT|SMALLINT|TINYINT|BLOB|JSON|UUID|ARRAY)\b/gi,
        '<span style="color: #4ecdc4;">$1</span>'
      )
      .replace(
        /\b(COUNT|SUM|AVG|MIN|MAX|COALESCE|NULLIF|CAST|CONVERT|CONCAT|SUBSTRING|UPPER|LOWER|TRIM|LENGTH|NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)\b/gi,
        '<span style="color: #ffe66d;">$1</span>'
      )
      .replace(/'([^']*)'/g, '<span style="color: #95e1d3;">\'$1\'</span>')
      .replace(/\b(\d+)\b/g, '<span style="color: #f38181;">$1</span>')
      .replace(
        /--.*$/gm,
        '<span style="color: #a8a8a8; font-style: italic;">$&</span>'
      );
  }

  const highlightedHtml = $derived(applySimpleHighlighting(value));

  function handleInput(event: Event) {
    oninput(event);
  }
</script>

<div class="sql-highlighter-wrapper {className}" {style}>
  <div class="sql-highlighter-content">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html highlightedHtml}
  </div>
  <textarea
    bind:this={textareaEl}
    class="sql-textarea-overlay"
    {placeholder}
    {readonly}
    {value}
    oninput={handleInput}
    spellcheck="false"
  ></textarea>
</div>

<style>
  .sql-highlighter-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 120px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
  }

  .sql-highlighter-content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
    pointer-events: none;
    color: var(--text-primary);
  }

  .sql-textarea-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 12px;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: transparent;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
    caret-color: var(--text-primary);
  }

  .sql-textarea-overlay::selection {
    background-color: rgba(59, 130, 246, 0.3);
    color: transparent;
  }
</style>
