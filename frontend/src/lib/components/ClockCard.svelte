<script lang="ts">
  import { now, formatTime } from '$lib/stores/clock';

  export let timezone = 'America/Sao_Paulo';

  $: dia = $now.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: timezone });
  $: mes = $now.toLocaleDateString('pt-BR', { month: 'short', timeZone: timezone })
              .replace('.', '').toUpperCase();
  $: hora = formatTime($now, timezone);
</script>

<div class="flex h-full overflow-hidden rounded-2xl select-none">

  <!-- Barra branca lateral esquerda -->
  <div class="bg-white flex-shrink-0" style="width: 5px;"></div>

  <!-- Conteúdo -->
  <div class="flex flex-col flex-1 min-w-0" style="background-color: #1a0808;">

    <!-- Dia + Mês -->
    <div class="flex flex-1 items-center justify-center relative px-4 py-2 min-h-0">
      <span class="font-black text-white leading-none" style="font-size: clamp(3rem, 8vw, 6rem);">
        {dia}
      </span>
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <span class="text-white/60 font-bold tracking-widest text-xs"
          style="writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.15em;">
          {mes}
        </span>
      </div>
    </div>

    <!-- Faixa do horário -->
    <div class="flex items-center justify-center py-2 flex-shrink-0" style="background-color: #7a0000;">
      <span class="font-mono font-bold text-white tracking-widest" style="font-size: clamp(0.85rem, 1.5vw, 1.1rem);">
        {hora}
      </span>
    </div>

  </div>
</div>
