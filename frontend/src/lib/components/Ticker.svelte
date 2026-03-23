<script lang="ts">
  export let texto: string = '';

  // Duplica o texto para criar loop contínuo seamless
  $: conteudo = texto + '   •   ' + texto + '   •   ';

  // Velocidade: ~80px/s, mínimo 15s
  $: duracao = Math.max(15, texto.length * 0.22);
</script>

{#if texto}
  <div class="ticker-outer h-full flex items-center overflow-hidden">
    <div class="ticker-track" style="animation-duration: {duracao}s;">
      <span class="ticker-content text-white/70 text-sm font-medium tracking-wide whitespace-nowrap">
        {conteudo}{conteudo}
      </span>
    </div>
  </div>
{/if}

<style>
  .ticker-outer {
    width: 100%;
  }

  .ticker-track {
    display: inline-flex;
    white-space: nowrap;
    animation: ticker-move linear infinite;
    will-change: transform;
  }

  @keyframes ticker-move {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
</style>
