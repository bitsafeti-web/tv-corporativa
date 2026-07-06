<script lang="ts">
  import { campanhaItems } from '$lib/stores/campanha';
  import type { CampanhaItem } from '$lib/pocketbase';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

  let currentIndex = 0;
  let intervalId: ReturnType<typeof setInterval>;
  let videoEl: HTMLVideoElement;

  $: campanhas = $campanhaItems;
  $: current = campanhas[currentIndex] ?? null;
  $: isVideo = !!(current?.video);

  // Força o play a cada troca de item, já que o atributo autoplay sozinho
  // nem sempre dispara na transição imagem → vídeo dentro do kiosk.
  $: if (videoEl) {
    videoEl.play().catch(() => {});
  }

  // Timer só para imagens; vídeos avançam via evento `ended`
  $: {
    clearInterval(intervalId);
    if (!isVideo && campanhas.length > 1) {
      intervalId = setInterval(advance, 15000);
    }
  }

  function advance() {
    currentIndex = (currentIndex + 1) % campanhas.length;
  }

  function getImageUrl(item: CampanhaItem): string | null {
    if (!item.imagem_1568x876px) return null;
    return `${PUBLIC_POCKETBASE_URL}/api/files/${item.collectionId}/${item.id}/${item.imagem_1568x876px}`;
  }

  function getVideoUrl(item: CampanhaItem): string | null {
    if (!item.video) return null;
    return `${PUBLIC_POCKETBASE_URL}/api/files/${item.collectionId}/${item.id}/${item.video}`;
  }
</script>

<div style="position: absolute; inset: 0;">

  {#if campanhas.length === 0}
    <div class="flex items-center justify-center h-full" style="background: #0d1117;">
      <div class="text-center text-white/70">
        <div class="text-9xl mb-6">📢</div>
        <div class="text-4xl font-semibold">Nenhuma campanha ativa</div>
      </div>
    </div>

  {:else if current}
    {#key current.id}
      <div class="campaign-enter" style="position: absolute; inset: 0;">

        {#if current.video}
          <!-- Fundo escuro para vídeo -->
          <div style="position: absolute; inset: 0; background: #000;"></div>
          <!-- Vídeo centralizado sem corte; loop quando único item -->
          <video
            bind:this={videoEl}
            src={getVideoUrl(current)}
            autoplay
            muted
            playsinline
            loop={campanhas.length <= 1}
            on:ended={advance}
            style="position: absolute; inset: 0; width: 100%; height: 100%;
                   object-fit: contain;"
          >
            <track kind="captions" />
          </video>

        {:else if current.imagem_1568x876px}
          <!-- Preenche toda a área da tela sem cortar: a imagem deve vir exatamente em 1920x1080px -->
          <img
            src={getImageUrl(current)}
            alt={current.titulo}
            style="position: absolute; inset: 0; width: 100%; height: 100%;
                   object-fit: fill;"
          />

        {:else}
          <div style="position: absolute; inset: 0; background: #1a0808;"></div>
        {/if}

        <!-- Indicadores de slides -->
        {#if campanhas.length > 1}
          <div class="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
            {#each campanhas as item, i}
              <button
                type="button"
                class="rounded-full transition-all duration-500 border-0 p-0 cursor-pointer"
                style="width: {i === currentIndex ? '24px' : '8px'}; height: 8px;
                       background: {i === currentIndex ? 'white' : 'rgba(255,255,255,0.3)'};"
                aria-label="Slide {i + 1}: {item.titulo}"
                on:click={() => { currentIndex = i; }}
              ></button>
            {/each}
          </div>
        {/if}

      </div>
    {/key}
  {/if}

</div>

<style>
  .campaign-enter {
    animation: fadeIn 0.8s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
</style>
