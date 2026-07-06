<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import Campanha from '$lib/components/Campanha.svelte';
  import Maintenance from '$lib/components/Maintenance.svelte';
  import { subscribeToConfig, configEfetiva } from '$lib/stores/config';
  import { subscribeToCampanha } from '$lib/stores/campanha';

  let stopConfig: () => void;
  let stopCampanha: () => void;

  onMount(() => {
    if (!pb.authStore.isValid) { goto('/'); return; }
    stopConfig   = subscribeToConfig();
    stopCampanha = subscribeToCampanha();
  });

  onDestroy(() => {
    stopConfig?.();
    stopCampanha?.();
  });

  $: empresa      = $configEfetiva?.nome_empresa || 'Bitsafe';
  $: emManutencao = $configEfetiva?.modo_manutencao ?? false;
</script>

<svelte:head>
  <title>TV Corporativa | {empresa}</title>
</svelte:head>

{#if emManutencao}
  <Maintenance mensagem={$configEfetiva?.mensagem_manutencao} {empresa} />
{:else}
  <div class="relative w-screen h-screen overflow-hidden" style="background: #000;">
    <Campanha />
  </div>
{/if}
