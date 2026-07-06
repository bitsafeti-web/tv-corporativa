<script lang="ts">
  import { destaqueItems } from '$lib/stores/destaques';

  const ICONS = ['🏆', '💡', '🎯', '📌', '✨', '💼'];

  function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `Há ${Math.max(1, mins)}min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Há ${h}h`;
    return `Há ${Math.floor(h / 24)}d`;
  }
</script>

<div class="h-full flex flex-col rounded-2xl p-4 overflow-hidden"
  style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">

  <div class="flex items-center gap-2 mb-4 flex-shrink-0">
    <div class="w-1 h-4 rounded-full flex-shrink-0 bg-amber-400"></div>
    <span class="text-white/60 text-xs font-bold tracking-widest uppercase">Destaques</span>
  </div>

  {#if $destaqueItems.length === 0}
    <div class="flex flex-col items-center justify-center flex-1 gap-3 text-white/20">
      <span class="text-4xl">⭐</span>
      <span class="text-xs">Nenhum destaque ativo</span>
    </div>
  {:else}
    <ul class="flex flex-col gap-2 flex-1 overflow-hidden">
      {#each $destaqueItems.slice(0, 6) as item, i}
        <li class="flex items-start gap-3 p-2.5 rounded-xl flex-shrink-0"
          style="background: rgba(255,255,255,0.04);">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-500/20">
            {ICONS[i % ICONS.length]}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-semibold leading-tight line-clamp-2">{item.titulo}</p>
          </div>
          <span class="text-xs flex-shrink-0 mt-0.5 text-amber-400/60">{timeAgo(item.created)}</span>
        </li>
      {/each}
    </ul>

    <div class="flex-shrink-0 mt-3 pt-3 border-t text-center"
      style="border-color: rgba(255,255,255,0.06);">
      <span class="text-white/25 text-xs">Ver todos</span>
    </div>
  {/if}

</div>
