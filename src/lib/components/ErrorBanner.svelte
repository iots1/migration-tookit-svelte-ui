<script lang="ts">
  interface Props {
    message: string;
    onDismiss: () => void;
  }

  let { message, onDismiss }: Props = $props();
</script>

<div class="error-banner">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" />
    <path
      d="M8 5v3.5M8 10.5v.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
  <span>{message}</span>
  <button
    class="error-banner-close"
    onclick={onDismiss}
    aria-label="Dismiss error"
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
