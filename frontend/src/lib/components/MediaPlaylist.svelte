<script lang="ts">
  import { midiaItems, getMidiaUrl } from '$lib/stores/midia';

  let currentIndex = 0;
  let intervalId: ReturnType<typeof setTimeout>;

  $: items = $midiaItems;

  $: currentItem = items[currentIndex] ?? null;

  function avancar() {
    currentIndex = (currentIndex + 1) % items.length;
    agendar();
  }

  function agendar() {
    clearTimeout(intervalId);
    if (items.length > 1) {
      const duracao = (currentItem?.duracao ?? 10) * 1000;
      intervalId = setTimeout(avancar, duracao);
    }
  }

  $: if (items.length > 0) {
    currentIndex = 0;
    agendar();
  }
</script>

{#if items.length > 0 && currentItem}
  <div class="relative w-full h-full overflow-hidden rounded-xl">
    {#key currentItem.id}
      {#if currentItem.tipo === 'video'}
        <video
          src={getMidiaUrl(currentItem)}
          autoplay
          muted
          loop={items.length === 1}
          class="w-full h-full object-contain"
          on:ended={avancar}
        ></video>
      {:else}
        <img
          src={getMidiaUrl(currentItem)}
          alt={currentItem.titulo}
          class="w-full h-full object-contain animate-fade-in"
        />
      {/if}
    {/key}

    <!-- Título da mídia -->
    {#if currentItem.titulo}
      <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <p class="text-white/80 text-sm">{currentItem.titulo}</p>
      </div>
    {/if}

    <!-- Indicador de itens -->
    {#if items.length > 1}
      <div class="absolute top-3 right-3 flex gap-1">
        {#each items as _, i}
          <div class="w-1.5 h-1.5 rounded-full transition-all {i === currentIndex ? 'bg-white' : 'bg-white/20'}"></div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
