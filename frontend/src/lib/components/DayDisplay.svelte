<script lang="ts">
  import { now } from '$lib/stores/clock';

  export let timezone = 'America/Sao_Paulo';

  $: dia = $now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    timeZone: timezone
  });
</script>

<div class="text-white/50 text-xs font-medium capitalize tracking-wide select-none">
  {dia}
</div>
