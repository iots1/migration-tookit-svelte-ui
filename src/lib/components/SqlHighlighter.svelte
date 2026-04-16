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
