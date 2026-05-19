<script lang="ts">
  import { boletimItems } from '$lib/stores/boletim';

  let containerEl: HTMLDivElement;
  let trackEl: HTMLDivElement;
  let containerWidth = 0;
  let trackWidth = 0;

  $: totalChars = $boletimItems.reduce((s, p) => s + p.titulo.length, 0);
  $: duracao = Math.max(30, totalChars * 0.25);

  // Recalcula larguras quando os itens mudam
  $: if ($boletimItems && containerEl && trackEl) {
    containerWidth = containerEl.offsetWidth;
    trackWidth = trackEl.offsetWidth;
  }

  $: startX = containerWidth;
  $: endX = -trackWidth;
  $: totalDistance = startX - endX;
  $: speed = totalDistance / (duracao * 60); // px por frame (referência)
</script>

<div class="flex flex-col h-full overflow-hidden rounded-xl">

  <!-- Label: BOLETIM DIGITAL + pequena barra branca -->
  <div class="flex-shrink-0 flex" style="min-height: 36px;">
    <span class="flex items-center px-4 text-white font-bold text-sm tracking-widest uppercase flex-shrink-0" style="background-color: #7a0000;">
      Boletim Digital
    </span>
    <div class="bg-white flex-shrink-0" style="width: 5px; border-radius: 0 12px 0 0;"></div>
  </div>

  <!-- Ticker rolando (abaixo do label) -->
  <div
    bind:this={containerEl}
    class="flex-1 flex items-center overflow-hidden bg-white"
  >
    {#if $boletimItems.length > 0}
      <div
        bind:this={trackEl}
        class="ticker-track whitespace-nowrap"
        style="animation-duration: {duracao}s; --start: {startX}px; --end: {endX}px;"
      >
        {#each $boletimItems as item, i}
          <span class="text-black text-5xl font-bold" style="padding: 0 5rem;">{item.titulo}</span>
          <span class="text-black/25 text-5xl font-light">•</span>
        {/each}
      </div>
    {:else}
      <span class="text-black/30 text-sm px-4">Nenhum conteúdo configurado.</span>
    {/if}
  </div>

</div>

<style>
  .ticker-track {
    display: inline-block;
    animation: ticker-move linear infinite;
    will-change: transform;
  }

  @keyframes ticker-move {
    0%   { transform: translateX(var(--start)); }
    100% { transform: translateX(var(--end)); }
  }
</style>
