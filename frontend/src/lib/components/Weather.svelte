<script lang="ts">
  import { weather, weatherError, forecastItems } from '$lib/stores/weather';
</script>

{#if $weatherError}
  <div class="text-white/30 text-xs">{$weatherError}</div>
{:else if $weather}
  <div class="flex flex-col h-full">

    <!-- Clima atual -->
    <div class="flex items-center gap-5 flex-shrink-0 mb-4">

      <!-- Ícone animado -->
      <div class="relative flex-shrink-0">
        <div class="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"
          style="background: radial-gradient(circle, #fbbf24, transparent);"></div>
        <span class="relative text-7xl weather-icon">{$weather.icone}</span>
      </div>

      <div class="flex flex-col">
        <!-- Temperatura com brilho -->
        <div class="flex items-baseline gap-1.5">
          <span class="text-7xl font-black text-white leading-none temp-glow">{$weather.temp}°</span>
          <span class="text-white/60 text-2xl font-bold">C</span>
        </div>
        <div class="text-white/80 text-base capitalize mt-1">{$weather.descricao}</div>

        <!-- Umidade e vento com ícones animados -->
        <div class="flex gap-4 mt-2">
          <div class="flex items-center gap-1.5 text-blue-300 text-sm font-medium">
            <span class="drop-animate text-base">💧</span>
            <span>{$weather.umidade}%</span>
          </div>
          <div class="flex items-center gap-1.5 text-white/70 text-sm font-medium">
            <span class="wind-animate text-base">💨</span>
            <span>{$weather.vento} km/h</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Divisor animado -->
    <div class="divider-glow mb-4 flex-shrink-0"></div>

    <!-- Previsão horária -->
    {#if $forecastItems.length > 0}
      <div class="flex flex-col flex-1 min-h-0 justify-between items-center">
        {#each $forecastItems.slice(0, 7) as item, i}
          <div class="flex items-center text-sm forecast-row gap-5 w-full"
            style="animation-delay: {i * 60}ms;">
            <span class="text-white/60 font-medium" style="width: 3.2rem;">{item.hora}</span>
            <span class="text-4xl forecast-icon" style="width: 2.8rem; text-align: center;">{item.icone}</span>
            <div class="flex gap-1.5 items-baseline">
              <span class="text-white/90 font-bold text-base">{item.temp}°</span>
              <span class="text-white/40">/</span>
              <span class="text-white/50 text-sm">{item.tempMin}°</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  </div>
{:else}
  <div class="flex flex-col items-center justify-center h-full gap-2 text-white/20">
    <span class="text-3xl animate-spin" style="animation-duration: 3s;">🌡️</span>
    <span class="text-xs">Carregando clima...</span>
  </div>
{/if}

<style>
  .weather-icon {
    display: inline-block;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }

  .temp-glow {
    text-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
  }

  .drop-animate {
    display: inline-block;
    animation: drip 2s ease-in-out infinite;
  }

  @keyframes drip {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(2px); }
  }

  .wind-animate {
    display: inline-block;
    animation: blow 1.5s ease-in-out infinite;
  }

  @keyframes blow {
    0%, 100% { transform: translateX(0); }
    50%       { transform: translateX(4px); }
  }

  .divider-glow {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(251,191,36,0.4), transparent);
    animation: shimmer 2s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 1; }
  }

  .forecast-row {
    animation: fadeIn 0.4s ease-out both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .forecast-icon {
    display: inline-block;
    animation: pulse-icon 2s ease-in-out infinite;
  }

  .forecast-icon:nth-child(odd) {
    animation-delay: 0.3s;
  }

  @keyframes pulse-icon {
    0%, 100% { transform: scale(1) rotate(0deg); }
    30%       { transform: scale(1.2) rotate(-5deg); }
    60%       { transform: scale(1.1) rotate(5deg); }
  }
</style>
