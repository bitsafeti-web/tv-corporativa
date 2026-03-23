<script lang="ts">
  import { postsBoletim } from '$lib/stores/posts';

  let currentIndex = 0;
  let intervalId: ReturnType<typeof setInterval>;

  $: boletins = $postsBoletim;
  $: current = boletins[currentIndex] ?? null;

  $: {
    clearInterval(intervalId);
    if (boletins.length > 1) {
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % boletins.length;
      }, 12000);
    }
  }

  $: diaNum = current
    ? new Date(current.created).getDate()
    : new Date().getDate();
</script>

<div class="flex flex-col h-full overflow-hidden rounded-xl">

  <!-- Header: BOLETIM DIGITAL — sempre visível -->
  <div class="flex items-center px-4 flex-shrink-0" style="background-color: #7a0000; min-height: 38px;">
    <span class="text-white font-bold text-sm tracking-widest uppercase">Boletim Digital</span>
    {#if boletins.length > 1}
      <div class="ml-auto flex gap-1">
        {#each boletins as _, i}
          <div class="w-1.5 h-1.5 rounded-full {i === currentIndex ? 'bg-white' : 'bg-white/30'}"></div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Conteúdo -->
  <div class="flex items-center gap-4 px-4 py-2 flex-1 min-h-0" style="background-color: #1a0808;">
    {#if current}
      <!-- Número do dia -->
      <div class="flex-shrink-0 text-white font-black leading-none" style="font-size: 3rem;">
        {diaNum}
      </div>

      <!-- Título + Descrição -->
      <div class="flex flex-col justify-center min-w-0">
        <h3 class="text-white font-bold text-base leading-tight truncate">
          {current.titulo}
        </h3>
        <p class="text-white/50 text-sm leading-snug line-clamp-2 mt-0.5">
          {current.conteudo}
        </p>
      </div>
    {:else}
      <p class="text-white/20 text-sm">Nenhum boletim cadastrado.</p>
    {/if}
  </div>

</div>
