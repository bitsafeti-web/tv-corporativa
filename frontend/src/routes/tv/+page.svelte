<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import ClockCard from '$lib/components/ClockCard.svelte';
  import Weather from '$lib/components/Weather.svelte';
  import Campanha from '$lib/components/Campanha.svelte';
  import Destaques from '$lib/components/Destaques.svelte';
  import BoletimTicker from '$lib/components/BoletimTicker.svelte';
  import Maintenance from '$lib/components/Maintenance.svelte';
  import DateNotification from '$lib/components/DateNotification.svelte';
  import { startWeatherUpdates } from '$lib/stores/weather';
  import { subscribeToConfig, configEfetiva } from '$lib/stores/config';
  import { subscribeToDatasComemorativas, datasProximas } from '$lib/stores/datas';
  import { startCalendarUpdates } from '$lib/stores/gcal';
  import { subscribeToCampanha } from '$lib/stores/campanha';
  import { subscribeToDestaques } from '$lib/stores/destaques';
  import { subscribeToBoletim } from '$lib/stores/boletim';

  let stopWeather: () => void;
  let stopConfig: () => void;
  let stopCalendar: () => void;
  let stopCampanha: () => void;
  let stopDestaques: () => void;
  let stopBoletim: () => void;
  let stopDatas: () => void;

  onMount(() => {
    if (!pb.authStore.isValid) { goto('/'); return; }
    stopConfig   = subscribeToConfig();
    stopWeather  = startWeatherUpdates();
    stopCampanha = subscribeToCampanha();
    stopDestaques = subscribeToDestaques();
    stopBoletim  = subscribeToBoletim();
    stopDatas    = subscribeToDatasComemorativas();
  });

  let calendarStarted = false;
  $: if ($configEfetiva?.google_calendar_id && $configEfetiva?.google_api_key && !calendarStarted) {
    calendarStarted = true;
    stopCalendar = startCalendarUpdates($configEfetiva.google_calendar_id, $configEfetiva.google_api_key);
  }

  onDestroy(() => {
    stopWeather?.();
    stopConfig?.();
    stopCalendar?.();
    stopCampanha?.();
    stopDestaques?.();
    stopBoletim?.();
    stopDatas?.();
  });

  $: empresa      = $configEfetiva?.nome_empresa || 'Bitsafe';
  $: timezone     = $configEfetiva?.fuso_horario || 'America/Sao_Paulo';
  $: emManutencao = $configEfetiva?.modo_manutencao ?? false;
</script>

<svelte:head>
  <title>TV Corporativa | {empresa}</title>
</svelte:head>

{#if emManutencao}
  <Maintenance mensagem={$configEfetiva?.mensagem_manutencao} {empresa} />
{:else}
  <DateNotification datas={$datasProximas} />
  <div class="w-screen h-screen flex flex-col overflow-hidden relative" style="background-color: #240b0b;">

    <!-- Fundo -->
    <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at top left, #7a000022 0%, transparent 60%), radial-gradient(ellipse at bottom right, #7a000015 0%, transparent 60%);"></div>

    <div class="relative z-10 flex flex-col h-full p-6 gap-4">

      <!-- ÁREA PRINCIPAL: painel esquerdo + campanha -->
      <div class="flex flex-1 gap-4 min-h-0">

        <!-- PAINEL ESQUERDO: relógio + clima + destaques -->
        <div class="w-72 flex-shrink-0 flex flex-col gap-3">

          <!-- Clima + Previsão -->
          <div class="glass rounded-2xl p-4 overflow-hidden min-h-0" style="flex: 0 0 70%;">
            <Weather />
          </div>

          <!-- Destaques -->
          <div class="glass-dark rounded-2xl p-4 min-h-0 overflow-hidden" style="flex: 0 0 30%;">
            <Destaques />
          </div>

        </div>

        <!-- COLUNA DIREITA: Campanha + Ticker -->
        <div class="flex-1 min-w-0 flex flex-col gap-3">

          <!-- Campanha -->
          <div class="flex-1 rounded-2xl overflow-hidden min-h-0" style="display: flex;">
            <Campanha />
          </div>

          <!-- Relógio + Ticker na base da campanha -->
          <div class="flex-shrink-0 flex items-stretch gap-3 h-36">

            <!-- Card do relógio -->
            <div class="flex-shrink-0 h-full" style="width: 200px;">
              <ClockCard {timezone} />
            </div>

            <!-- Boletim Ticker -->
            <div class="flex-1 overflow-hidden rounded-xl">
              <BoletimTicker />
            </div>

          </div>

        </div>

      </div>

    </div>
  </div>
{/if}
