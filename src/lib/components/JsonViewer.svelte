<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  import { json } from '@codemirror/lang-json';
  import { EditorState } from '@codemirror/state';
  import { basicSetup, EditorView } from 'codemirror';

  interface Props {
    value: string;
    onValueChange?: (value: string) => void;
  }

  let { value, onValueChange }: Props = $props();

  let containerEl: HTMLDivElement;
  let editorView: EditorView | undefined;

  function prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  onMount(() => {
    if (!browser || !containerEl) return;

    const readonly = onValueChange === undefined;

    editorView = new EditorView({
      state: EditorState.create({
        doc: prettyJson(value),
        extensions: [
          basicSetup,
          json(),
          EditorState.readOnly.of(readonly),
          EditorView.updateListener.of((update) => {
            if (!readonly && update.docChanged && onValueChange) {
              onValueChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              fontSize: '13px',
              backgroundColor: 'transparent',
            },
            '.cm-content': {
              fontFamily:
                "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
              padding: '12px 16px',
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-gutters': {
              borderRight: '1px solid var(--border-light)',
              backgroundColor: 'transparent',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'transparent',
            },
            '.cm-activeLine': {
              backgroundColor: readonly ? 'transparent' : null,
            },
            '.cm-cursor': {
              display: readonly ? 'none' : null,
            },
          }),
        ],
      }),
      parent: containerEl,
    });

    return () => {
      editorView?.destroy();
    };
  });

  $effect(() => {
    if (editorView) {
      const pretty = prettyJson(value);
      const current = editorView.state.doc.toString();
      if (pretty !== current) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: pretty,
          },
        });
      }
    }
  });
</script>

<div class="json-viewer">
  <div class="json-viewer__container" bind:this={containerEl}></div>
</div>
