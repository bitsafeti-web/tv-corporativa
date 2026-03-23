<script lang="ts">
  import { posts, postsLoading, TIPO_CONFIG } from '$lib/stores/posts';
  import { pb } from '$lib/pocketbase';
  import type { Post } from '$lib/pocketbase';

  let currentIndex = 0;
  let intervalId: ReturnType<typeof setInterval>;

  $: activePosts = $posts;

  $: {
    if (activePosts.length > 0) {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % activePosts.length;
      }, 8000);
    }
  }

  function getImageUrl(post: Post): string | null {
    if (!post.imagem) return null;
    return pb.files.getUrl(post, post.imagem);
  }

  $: currentPost = activePosts[currentIndex] ?? null;
  $: config = currentPost ? TIPO_CONFIG[currentPost.tipo] : null;
</script>

<div class="flex flex-col h-full">
  {#if $postsLoading}
    <div class="flex items-center justify-center h-full">
      <div class="text-white/30 text-sm animate-pulse">Carregando...</div>
    </div>
  {:else if activePosts.length === 0}
    <div class="flex flex-col items-center justify-center h-full gap-3 text-white/20">
      <span class="text-4xl">📋</span>
      <span class="text-sm">Nenhum comunicado ativo</span>
    </div>
  {:else if currentPost}
    {#key currentPost.id}
      <div class="flex flex-col h-full animate-slide-up">
        <!-- Badge tipo -->
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-semibold border {config?.bg} {config?.color}">
            {config?.label}
          </span>
          {#if currentPost.destaque}
            <span class="text-yellow-400 text-xs">⭐ Destaque</span>
          {/if}
          <!-- Indicador de posts -->
          <div class="ml-auto flex gap-1">
            {#each activePosts as _, i}
              <div class="w-1.5 h-1.5 rounded-full transition-all {i === currentIndex ? 'bg-white' : 'bg-white/20'}"></div>
            {/each}
          </div>
        </div>

        <!-- Imagem (se houver) -->
        {#if currentPost.imagem}
          <div class="mb-4 rounded-xl overflow-hidden max-h-48">
            <img
              src={getImageUrl(currentPost)}
              alt={currentPost.titulo}
              class="w-full h-full object-cover"
            />
          </div>
        {/if}

        <!-- Título -->
        <h2 class="text-2xl font-bold text-white mb-3 leading-tight">
          {currentPost.titulo}
        </h2>

        <!-- Conteúdo -->
        <div class="text-white/70 text-base leading-relaxed overflow-y-auto posts-scroll flex-1">
          {currentPost.conteudo}
        </div>

        <!-- Footer com data -->
        <div class="mt-3 pt-3 border-t border-white/10 text-white/30 text-xs">
          Publicado em {new Date(currentPost.created).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </div>
    {/key}
  {/if}
</div>
