<script lang="ts">
  import { calendarEvents } from '$lib/stores/gcal';

  function formatarData(date: Date, diaInteiro: boolean): string {
    if (diaInteiro) {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short',
        timeZone: 'America/Sao_Paulo'
      });
    }
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  }

  function isHoje(date: Date): boolean {
    const hoje = new Date();
    return date.toDateString() === hoje.toDateString();
  }
</script>

{#if $calendarEvents.length > 0}
  <div class="glass rounded-2xl p-4">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-green-400 text-sm">📅</span>
      <span class="text-white/50 text-xs font-semibold uppercase tracking-wider">Próximos Eventos</span>
    </div>

    <div class="space-y-2">
      {#each $calendarEvents.slice(0, 4) as evento}
        <div class="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
          <div class="text-center min-w-10">
            <div class="text-xs text-white/30">
              {evento.inicio.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })}
            </div>
            <div class="text-lg font-bold {isHoje(evento.inicio) ? 'text-green-400' : 'text-white/70'} leading-none">
              {evento.inicio.getDate()}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white/80 text-sm font-medium truncate">{evento.titulo}</div>
            {#if !evento.diaInteiro}
              <div class="text-white/30 text-xs">
                {evento.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                {#if evento.local}· {evento.local}{/if}
              </div>
            {:else if evento.local}
              <div class="text-white/30 text-xs truncate">{evento.local}</div>
            {/if}
          </div>
          {#if isHoje(evento.inicio)}
            <span class="text-xs text-green-400 font-semibold">Hoje</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
