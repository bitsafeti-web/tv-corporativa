<script lang="ts">
  import { now, formatDate } from '$lib/stores/clock';

  export let timezone = 'America/Sao_Paulo';

  $: date = formatDate($now, timezone);
</script>

<div class="flex flex-col select-none">
  <span class="text-white/60 text-lg font-medium capitalize">{date.diaSemana}</span>
  <div class="flex items-baseline gap-2">
    <span class="text-white text-4xl font-bold">{date.dia}</span>
    <span class="text-white/70 text-2xl font-medium">de {date.mes}</span>
    <span class="text-white/40 text-xl">{date.ano}</span>
  </div>
</div>
