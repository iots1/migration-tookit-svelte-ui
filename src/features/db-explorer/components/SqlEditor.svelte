<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  import type { Completion } from '@codemirror/autocomplete';
  import { sql } from '@codemirror/lang-sql';
  import { Compartment, EditorState, Prec } from '@codemirror/state';
  import { keymap } from '@codemirror/view';
  import { basicSetup, EditorView } from 'codemirror';
  import { format, type SqlLanguage } from 'sql-formatter';

  export interface SqlEditorSchemaTable {
    readonly name: string;
    readonly columns: ReadonlyArray<{
      readonly name: string;
      readonly type?: string;
    }>;
  }

  interface Props {
    value: string;
    onchange?: (value: string) => void;
    schema?: SqlEditorSchemaTable[];
    dialect?: SqlLanguage;
    onrun?: () => void;
  }

  let {
    value,
    onchange,
    schema = [],
    dialect = 'sql',
    onrun,
  }: Props = $props();

  let containerEl: HTMLDivElement;
  let editorView: EditorView | undefined;
  const schemaCompartment = new Compartment();

  function buildSchemaConfig():
    | {
        [name: string]: Completion[];
      }
    | undefined {
    if (schema.length === 0) return undefined;
    const result: { [name: string]: Completion[] } = {};
    for (const table of schema) {
      result[table.name] = table.columns.map((col) => ({
        label: col.name,
        type: col.type ?? 'property',
        detail: col.type,
      }));
    }
    return result;
  }

  onMount(() => {
    if (!browser || !containerEl) return;

    editorView = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          schemaCompartment.of(sql()),
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  onrun?.();
                  return true;
                },
              },
            ])
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onchange?.(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              fontSize: '14px',
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
              backgroundColor: 'var(--accent-bg)',
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
      const current = editorView.state.doc.toString();
      if (value !== current) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: value,
          },
        });
      }
    }
  });

  $effect(() => {
    if (editorView) {
      const schemaConfig = buildSchemaConfig();
      editorView.dispatch({
        effects: schemaCompartment.reconfigure(sql({ schema: schemaConfig })),
      });
    }
  });

  function handleFormat() {
    if (!editorView) return;
    try {
      const formatted = format(editorView.state.doc.toString(), {
        language: dialect,
      });
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: formatted,
        },
      });
      onchange?.(formatted);
    } catch {
      // invalid SQL, ignore
    }
  }
</script>

<div class="sql-editor">
  <div class="sql-editor__toolbar">
    <button class="sql-editor__format-btn" onclick={handleFormat} type="button">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M8 1v14M1 8h14" />
      </svg>
      Format
    </button>
  </div>
  <div class="sql-editor__container" bind:this={containerEl}></div>
</div>
