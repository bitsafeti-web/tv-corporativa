<script lang="ts">
  import { campanhaItems } from '$lib/stores/campanha';
  import type { CampanhaItem } from '$lib/pocketbase';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

  let currentIndex = 0;
  let intervalId: ReturnType<typeof setInterval>;

  $: campanhas = $campanhaItems;
  $: current = campanhas[currentIndex] ?? null;

  $: {
    clearInterval(intervalId);
    if (campanhas.length > 1) {
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % campanhas.length;
      }, 15000);
    }
  }

  function getImageUrl(post: CampanhaItem): string | null {
    if (!post.imagem_1568x876px) return null;
    return `${PUBLIC_POCKETBASE_URL}/api/files/${post.collectionId}/${post.id}/${post.imagem_1568x876px}`;
  }
</script>

<div style="flex: 1; min-height: 0; position: relative;">
{#if campanhas.length === 0}
  <div class="flex items-center justify-center h-full text-white/10">
    <div class="text-center">
      <div class="text-6xl mb-3">📢</div>
      <div class="text-sm">Nenhuma campanha ativa</div>
    </div>
  </div>
{:else if current}
  {#key current.id}
    <div class="campaign-enter" style="position: absolute; inset: 0; overflow: hidden; border-radius: 1rem;">

      <!-- Imagem como fundo completo -->
      {#if current.imagem_1568x876px}
        <img
          src={getImageUrl(current)}
          alt={current.titulo}
          style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
        />
      {:else}
        <!-- Sem imagem: fundo sólido -->
        <div class="absolute inset-0" style="background-color: #1a0808;"></div>
      {/if}

      {#if campanhas.length > 1}
        <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {#each campanhas as _, i}
            <div class="w-2 h-2 rounded-full transition-all {i === currentIndex ? 'bg-white' : 'bg-white/30'}"></div>
          {/each}
        </div>
      {/if}

    </div>
  {/key}
{/if}
</div>

<style>
  .campaign-enter {
    animation: fadeIn 0.6s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(1.02); }
    to   { opacity: 1; transform: scale(1); }
  }
</style>
