<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { pb, type Tela } from '$lib/pocketbase';
  import Clock from '$lib/components/Clock.svelte';
  import DateDisplay from '$lib/components/DateDisplay.svelte';
  import Weather from '$lib/components/Weather.svelte';
  import PostsFeed from '$lib/components/PostsFeed.svelte';
  import Ticker from '$lib/components/Ticker.svelte';
  import Maintenance from '$lib/components/Maintenance.svelte';
  import MediaPlaylist from '$lib/components/MediaPlaylist.svelte';
  import CalendarEvents from '$lib/components/CalendarEvents.svelte';
  import { startWeatherUpdates } from '$lib/stores/weather';
  import { subscribeToPosts, posts } from '$lib/stores/posts';
  import { subscribeToMidia } from '$lib/stores/midia';
  import { subscribeToConfig, configEfetiva } from '$lib/stores/config';
  import { startCalendarUpdates } from '$lib/stores/gcal';

  $: slug = $page.params.slug;

  let tela: Tela | null = null;
  let telaErro = false;

  let stopWeather: () => void;
  let stopPosts: () => void;
  let stopMidia: () => void;
  let stopConfig: () => void;
  let stopCalendar: () => void;

  onMount(async () => {
    // Carrega dados da tela pelo slug
    try {
      const records = await pb.collection('telas').getList<Tela>(1, 1, {
        filter: `slug = "${slug}" && ativa = true`
      });
      if (records.items.length > 0) {
        tela = records.items[0];
      } else {
        telaErro = true;
      }
    } catch {
      telaErro = true;
    }

    stopConfig  = subscribeToConfig();
    stopWeather = startWeatherUpdates();
    stopMidia   = subscribeToMidia();

    if (tela) {
      stopPosts = subscribeToPosts(slug, tela.filtro_tipo?.length ? tela.filtro_tipo : undefined);
    } else if (!telaErro) {
      stopPosts = subscribeToPosts();
    }
  });

  // Inicia Google Calendar quando config carregar
  let calendarStarted = false;
  $: if ($configEfetiva?.google_calendar_id && $configEfetiva?.google_api_key && !calendarStarted) {
    calendarStarted = true;
    stopCalendar = startCalendarUpdates($configEfetiva.google_calendar_id, $configEfetiva.google_api_key);
  }

  onDestroy(() => {
    stopWeather?.();
    stopPosts?.();
    stopMidia?.();
    stopConfig?.();
    stopCalendar?.();
  });

  $: empresa   = $configEfetiva?.nome_empresa || 'Bitsafe';
  $: timezone  = $configEfetiva?.fuso_horario || 'America/Sao_Paulo';
  $: emManutencao = $configEfetiva?.modo_manutencao ?? false;
  $: semPosts = $posts.length === 0;
</script>

<svelte:head>
  <title>{tela?.nome ?? slug} | {empresa}</title>
</svelte:head>

{#if emManutencao}
  <Maintenance
    mensagem={$configEfetiva?.mensagem_manutencao}
    empresa={empresa}
  />
{:else if telaErro}
  <div class="w-screen h-screen bg-slate-950 flex items-center justify-center">
    <div class="text-center">
      <div class="text-5xl mb-4">📺</div>
      <div class="text-white/40">Tela "{slug}" não encontrada ou inativa</div>
    </div>
  </div>
{:else}
  <div class="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden relative">
    <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/30 pointer-events-none"></div>
    <div class="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col h-full p-8">

      <!-- TOPO -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="glass rounded-2xl px-5 py-3">
            <span class="text-xl font-bold text-white tracking-wide">{empresa}</span>
            <div class="text-white/30 text-xs">{tela?.nome ?? 'TV Corporativa'}</div>
          </div>
        </div>

        <div class="flex flex-col items-center">
          <Clock {timezone} />
          <DateDisplay {timezone} />
        </div>

        <div class="glass rounded-2xl p-5 min-w-48">
          <Weather />
        </div>
      </div>

      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

      <!-- ÁREA PRINCIPAL -->
      <div class="flex-1 overflow-hidden flex gap-6">

        <!-- Feed de posts ou playlist -->
        <div class="flex-1 overflow-hidden">
          <div class="glass-dark rounded-2xl p-6 h-full">
            {#if semPosts}
              <MediaPlaylist />
            {:else}
              <PostsFeed />
            {/if}
          </div>
        </div>

        <!-- Sidebar: Google Calendar (se configurado) -->
        <div class="w-72 flex flex-col gap-4 overflow-hidden">
          <CalendarEvents />
        </div>

      </div>

      <!-- TICKER -->
      {#if $configEfetiva?.ticker_ativo && $configEfetiva?.ticker_texto}
        <div class="mt-3 glass rounded-xl overflow-hidden">
          <Ticker texto={$configEfetiva.ticker_texto} />
        </div>
      {/if}

      <!-- RODAPÉ -->
      <div class="mt-3 flex items-center justify-between text-white/20 text-xs">
        <span>© {new Date().getFullYear()} {empresa} — {tela?.nome ?? 'Comunicação Interna'}</span>
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span>Ao vivo</span>
        </div>
      </div>

    </div>
  </div>
{/if}
