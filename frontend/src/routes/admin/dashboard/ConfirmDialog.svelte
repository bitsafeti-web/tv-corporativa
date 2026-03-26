<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let message = 'Tem certeza?';
  export let confirmLabel = 'Excluir';
  export let cancelLabel = 'Cancelar';

  const dispatch = createEventDispatcher();

  function confirm() { dispatch('confirm'); }
  function cancel()  { dispatch('cancel');  open = false; }

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter')  confirm();
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
  <!-- overlay -->
  <div
    on:click={cancel}
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;"
  >
    <!-- card -->
    <div
      on:click|stopPropagation
      style="background:#fff;border-radius:12px;width:100%;max-width:400px;box-shadow:0 24px 64px rgba(0,0,0,0.22);overflow:hidden;"
    >
      <!-- topo vermelho -->
      <div style="background:#7b0000;padding:20px 24px;display:flex;align-items:center;gap:12px;">
        <!-- ícone aviso -->
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style="margin:0;font-size:15px;font-weight:600;color:#fff;">Confirmar exclusão</h2>
      </div>

      <!-- corpo -->
      <div style="padding:24px;">
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">{message}</p>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button
            on:click={cancel}
            style="font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;border:none;background:rgba(107,114,128,0.08);color:#374151;cursor:pointer;"
          >
            {cancelLabel}
          </button>
          <button
            on:click={confirm}
            style="font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;border:none;background:rgba(123,0,0,0.08);color:#7b0000;cursor:pointer;"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
