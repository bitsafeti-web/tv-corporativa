<script lang="ts">
  import { posts } from '$lib/stores/posts';

  const TIPO_ICONS: Record<string, string> = {
    aviso:      '🔔',
    comunicado: '📋',
    evento:     '📅',
    urgente:    '🚨',
    campanha:   '📢',
    destaque:   '⭐',
  };

  function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `Há ${Math.max(1, mins)}min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Há ${h}h`;
    return `Há ${Math.floor(h / 24)}d`;
  }

  $: visiblePosts = $posts.slice(0, 6);
</script>

<div class="h-full flex flex-col rounded-2xl p-4 overflow-hidden"
  style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">

  <div class="flex items-center gap-2 mb-4 flex-shrink-0">
    <div class="w-1 h-4 rounded-full flex-shrink-0" style="background: #7a0000;"></div>
    <span class="text-white/60 text-xs font-bold tracking-widest uppercase">Comunicados</span>
  </div>

  {#if visiblePosts.length === 0}
    <div class="flex flex-col items-center justify-center flex-1 gap-3 text-white/20">
      <span class="text-4xl">📋</span>
      <span class="text-xs">Nenhum comunicado ativo</span>
    </div>
  {:else}
    <ul class="flex flex-col gap-2 flex-1 overflow-hidden">
      {#each visiblePosts as post}
        <li class="flex items-start gap-3 p-2.5 rounded-xl flex-shrink-0"
          style="background: rgba(255,255,255,0.04);">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style="background: rgba(122,0,0,0.3);">
            {TIPO_ICONS[post.tipo] ?? '📋'}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-semibold leading-tight line-clamp-1">{post.titulo}</p>
            {#if post.conteudo}
              <p class="text-white/45 text-xs leading-snug mt-0.5 line-clamp-2">{post.conteudo}</p>
            {/if}
          </div>
          <span class="text-xs flex-shrink-0 mt-0.5" style="color: #b87333;">{timeAgo(post.created)}</span>
        </li>
      {/each}
    </ul>

    <div class="flex-shrink-0 mt-3 pt-3 border-t text-center"
      style="border-color: rgba(255,255,255,0.06);">
      <span class="text-white/25 text-xs">Ver todos</span>
    </div>
  {/if}

</div>
