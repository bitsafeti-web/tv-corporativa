<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let title = '';
  export let open = false;
  const dispatch = createEventDispatcher();
  function close() { dispatch('close'); }
</script>

{#if open}
  <!-- overlay -->
  <div
    on:click={close}
    style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;"
  >
    <!-- card -->
    <div
      on:click|stopPropagation
      style="background:#fff;border-radius:10px;width:100%;max-width:720px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);"
    >
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
        <h2 style="margin:0;font-size:15px;font-weight:600;color:#111;">{title}</h2>
        <button on:click={close} style="background:rgba(107,114,128,0.08);border:none;border-radius:8px;font-size:20px;cursor:pointer;color:#9ca3af;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">×</button>
      </div>
      <div style="padding:24px;">
        <slot />
      </div>
    </div>
  </div>
{/if}
