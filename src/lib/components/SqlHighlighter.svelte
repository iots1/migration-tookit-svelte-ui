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
</script>

<textarea
  class="sql-textarea {className}"
  {style}
  {placeholder}
  {readonly}
  {value}
  {oninput}
  spellcheck="false"
></textarea>

<style>
  .sql-textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    resize: vertical;
    outline: none;

    &:focus {
      border-color: var(--accent);
    }

    &::placeholder {
      color: var(--text-muted);
    }
  }
</style>
