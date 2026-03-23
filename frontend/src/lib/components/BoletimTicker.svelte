<script lang="ts">
  import { boletimItems } from '$lib/stores/boletim';

  $: texto = $boletimItems.map(p => p.titulo).join('     •     ');
  $: duracao = Math.max(20, texto.length * 0.18);
  $: conteudo = texto + '     •     ' + texto;
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
  <div class="flex-1 flex items-center overflow-hidden bg-white">
    {#if texto}
      <div class="ticker-track whitespace-nowrap" style="animation-duration: {duracao}s;">
        <span class="text-black text-3xl font-bold px-4">
          {conteudo}
        </span>
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
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
</style>
