<script lang="ts">
  import { destaqueItems } from '$lib/stores/destaques';
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-2 mb-3">
    <div class="w-1 h-4 bg-amber-400 rounded-full"></div>
    <span class="text-white/60 text-xs font-bold tracking-widest uppercase">Destaques</span>
  </div>

  {#if $destaqueItems.length === 0}
    <div class="text-white/20 text-xs">Nenhum destaque no momento</div>
  {:else}
    <ul class="space-y-2 flex-1 overflow-hidden">
      {#each $destaqueItems as post}
        <li class="flex items-start gap-2">
          <span class="text-amber-400/60 mt-0.5 text-xs flex-shrink-0">•</span>
          <span class="text-white/70 text-sm leading-snug line-clamp-2">{post.titulo}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
