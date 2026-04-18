<script lang="ts">
  import { tick } from 'svelte';
  import { browser } from '$app/environment';

  export interface ContextMenuItem {
    readonly label: string;
    readonly action: () => void;
    readonly disabled?: boolean;
    readonly separator?: boolean;
  }

  interface Props {
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    onclose: () => void;
  }

  let { visible, x, y, items, onclose }: Props = $props();

  let menuEl = $state<HTMLDivElement | undefined>(undefined);
  // Local state for adjusted position — never mutate props directly
  // Initialise to 0; the $effect sets correct values when visible becomes true
  let adjustedX = $state(0);
  let adjustedY = $state(0);

  async function adjustPosition(): Promise<void> {
    if (!browser || !menuEl) return;
    await tick();
    if (!menuEl) return;
    const rect = menuEl.getBoundingClientRect();
    adjustedX =
      rect.right > window.innerWidth ? Math.max(0, x - rect.width) : x;
    adjustedY =
      rect.bottom > window.innerHeight ? Math.max(0, y - rect.height) : y;
  }

  function handleClickOutside(e: MouseEvent) {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      onclose();
    }
  }

  $effect(() => {
    if (visible) {
      // Reset to click position before adjusting
      adjustedX = x;
      adjustedY = y;
      void adjustPosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', onclose);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', onclose);
      };
    }
  });
</script>

{#if visible}
  <div
    class="tab-context-menu"
    bind:this={menuEl}
    style="left: {adjustedX}px; top: {adjustedY}px;"
  >
    <!-- Use index as key — label is not unique (separators share empty string) -->
    {#each items as item, i (i)}
      {#if item.separator}
        <div class="tab-context-menu__separator"></div>
      {:else}
        <button
          class="tab-context-menu__item"
          type="button"
          disabled={item.disabled}
          onclick={() => {
            item.action();
            onclose();
          }}
        >
          {item.label}
        </button>
      {/if}
    {/each}
  </div>
{/if}
