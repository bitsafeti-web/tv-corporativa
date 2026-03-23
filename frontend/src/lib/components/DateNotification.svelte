<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { DataComemorativa } from '$lib/stores/datas';

  export let datas: DataComemorativa[] = [];

  let visible = false;
  let current = 0;
  let timer: ReturnType<typeof setTimeout>;
  let progressTimer: ReturnType<typeof setInterval>;
  let progress = 0;
  const DURACAO = 9000; // ms por notificação

  // IDs já exibidos nesta sessão
  let shown: Set<string> = new Set();

  $: pending = datas.filter(d => !shown.has(d.id));

  $: if (pending.length > 0 && !visible) show();

  function show() {
    if (pending.length === 0) return;
    current = 0;
    visible = true;
    progress = 0;
    scheduleClose();
  }

  function scheduleClose() {
    clearTimeout(timer);
    clearInterval(progressTimer);
    progress = 0;

    const step = 50;
    progressTimer = setInterval(() => {
      progress = Math.min(100, progress + (step / DURACAO) * 100);
    }, step);

    timer = setTimeout(() => {
      if (current < pending.length - 1) {
        current++;
        progress = 0;
        clearInterval(progressTimer);
        progressTimer = setInterval(() => {
          progress = Math.min(100, progress + (step / DURACAO) * 100);
        }, step);
        scheduleClose();
      } else {
        dismiss();
      }
    }, DURACAO);
  }

  function dismiss() {
    clearTimeout(timer);
    clearInterval(progressTimer);
    // marca todas como exibidas
    pending.forEach(d => shown.add(d.id));
    shown = new Set(shown); // trigger reactivity
    visible = false;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function daysUntil(iso: string): number {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(iso); d.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
  }

  onDestroy(() => { clearTimeout(timer); clearInterval(progressTimer); });
</script>

{#if visible && pending.length > 0}
  {@const item = pending[current]}
  {@const dias = daysUntil(item.data)}
  {@const cor = item.cor || '#7b0000'}

  <!-- overlay suave -->
  <div
    style="position:fixed;inset:0;z-index:300;pointer-events:none;background:rgba(0,0,0,0.35);"
  ></div>

  <!-- card de notificação -->
  <div style="
    position:fixed;z-index:301;
    bottom:48px;right:48px;
    width:420px;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 32px 80px rgba(0,0,0,0.5);
    font-family:'Inter',sans-serif;
    animation: slideIn .4s cubic-bezier(0.16,1,0.3,1);
  ">
    <!-- topo colorido -->
    <div style="background:{cor};padding:20px 24px 16px;display:flex;align-items:flex-start;gap:14px;">
      <!-- ícone calendário -->
      <div style="width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,0.15);
        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div style="flex:1;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.65);
          text-transform:uppercase;letter-spacing:.08em;">
          {dias === 0 ? 'Hoje é dia de...' : dias === 1 ? 'Amanhã é...' : `Em ${dias} dias`}
        </p>
        <h2 style="margin:0;font-size:20px;font-weight:700;color:#fff;line-height:1.25;">
          {item.titulo}
        </h2>
      </div>
      <!-- fechar -->
      <button
        on:click={dismiss}
        style="background:rgba(255,255,255,0.15);border:none;border-radius:6px;
          width:28px;height:28px;display:flex;align-items:center;justify-content:center;
          cursor:pointer;flex-shrink:0;color:#fff;font-size:16px;line-height:1;"
      >×</button>
    </div>

    <!-- corpo -->
    <div style="background:#1a1a1a;padding:16px 24px 20px;">
      <p style="margin:0 0 10px;font-size:13px;color:rgba(255,255,255,0.5);">
        📅 {formatDate(item.data)}
      </p>
      {#if item.descricao}
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">
          {item.descricao}
        </p>
      {/if}

      <!-- indicador de múltiplas datas -->
      {#if pending.length > 1}
        <div style="display:flex;gap:5px;margin-top:14px;align-items:center;">
          {#each pending as _, i}
            <span style="width:{i === current ? 20 : 6}px;height:6px;border-radius:99px;
              transition:width .3s;
              background:{i === current ? cor : 'rgba(255,255,255,0.2)'};">
            </span>
          {/each}
          <span style="margin-left:4px;font-size:11px;color:rgba(255,255,255,0.35);">
            {current+1}/{pending.length}
          </span>
        </div>
      {/if}

      <!-- barra de progresso -->
      <div style="margin-top:14px;height:3px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;">
        <div style="height:100%;border-radius:99px;background:{cor};
          width:{progress}%;transition:width 50ms linear;"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slideIn {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
</style>
