<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let datas: any[] = [];

  const dispatch = createEventDispatcher();

  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth(); // 0-indexed

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  function prevMes() { if (mes === 0) { mes = 11; ano--; } else mes--; }
  function nextMes() { if (mes === 11) { mes = 0; ano++; } else mes++; }

  function pad2(n: number) { return String(n).padStart(2, '0'); }

  // Mapa "YYYY-MM-DD" → registros — reativo a datas
  $: mapa = (() => {
    const m: Record<string, any[]> = {};
    for (const d of datas) {
      if (!d.data) continue;
      const key = d.data.slice(0, 10);
      if (!m[key]) m[key] = [];
      m[key].push(d);
    }
    return m;
  })();

  // Células do mês — reativo a ano, mes E mapa (para atualizar ao salvar)
  $: diasNoMes        = new Date(ano, mes + 1, 0).getDate();
  $: primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  $: prefixoMes       = `${ano}-${pad2(mes + 1)}`;

  $: celulas = (() => {
    // Lê mapa aqui para que Svelte rastreie a dependência
    const _ = mapa;
    return Array.from({ length: diasNoMes }, (__, i) => {
      const dia     = i + 1;
      const chave   = `${prefixoMes}-${pad2(dia)}`;
      const eventos = mapa[chave] ?? [];
      const eHoje   = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate();
      return { dia, eventos, eHoje };
    });
  })();

  $: datasDoMes = Object.entries(mapa)
    .filter(([k]) => k.startsWith(prefixoMes))
    .flatMap(([, v]) => v)
    .sort((a: any, b: any) => a.data.localeCompare(b.data));

  function clickDia(dia: number, eventos: any[]) {
    if (eventos.length) dispatch('selectDay', { dia, datas: eventos });
  }
</script>

<div style="background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">

  <!-- cabeçalho do mês -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f3f4f6;">
    <button on:click={prevMes}
      style="background:none;border:1px solid #e5e7eb;border-radius:6px;width:30px;height:30px;cursor:pointer;color:#6b7280;font-size:16px;">
      ‹
    </button>
    <span style="font-size:14px;font-weight:600;color:#111;">{MESES[mes]} {ano}</span>
    <button on:click={nextMes}
      style="background:none;border:1px solid #e5e7eb;border-radius:6px;width:30px;height:30px;cursor:pointer;color:#6b7280;font-size:16px;">
      ›
    </button>
  </div>

  <!-- grade -->
  <div style="padding:16px;">
    <!-- cabeçalho dias da semana -->
    <div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:8px;">
      {#each DIAS_SEMANA as d}
        <div style="text-align:center;font-size:11px;font-weight:600;color:#9ca3af;padding:4px 0;">{d}</div>
      {/each}
    </div>

    <!-- células -->
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">

      <!-- espaços vazios antes do dia 1 -->
      {#each Array(primeiroDiaSemana) as _}
        <div></div>
      {/each}

      <!-- dias -->
      {#each celulas as { dia, eventos, eHoje }}
        <button
          on:click={() => clickDia(dia, eventos)}
          style="
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            padding:6px 2px;border-radius:8px;border:none;min-height:44px;
            background:{eHoje ? '#7b0000' : eventos.length > 0 ? '#fff7f7' : 'transparent'};
            color:{eHoje ? '#fff' : '#1f2937'};
            cursor:{eventos.length > 0 ? 'pointer' : 'default'};
            transition:background .15s;
          "
          title={eventos.map((e: any) => e.titulo).join(', ')}
        >
          <span style="font-size:13px;font-weight:{eHoje ? 700 : eventos.length > 0 ? 600 : 400};">
            {dia}
          </span>
          {#if eventos.length > 0}
            <div style="display:flex;gap:2px;margin-top:3px;flex-wrap:wrap;justify-content:center;max-width:32px;">
              {#each eventos.slice(0, 3) as ev}
                <span style="width:6px;height:6px;border-radius:50%;background:{ev.cor || '#7b0000'};flex-shrink:0;"></span>
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- legenda: datas do mês -->
  {#if datasDoMes.length > 0}
    <div style="border-top:1px solid #f3f4f6;padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
      {#each datasDoMes as ev}
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:50%;background:{ev.cor || '#7b0000'};flex-shrink:0;"></span>
          <span style="font-size:12px;font-weight:700;color:{ev.cor || '#7b0000'};">{ev.data.slice(8,10)}</span>
          <span style="font-size:12px;font-weight:600;color:#374151;">{ev.titulo}</span>
          {#if ev.descricao}
            <span style="font-size:11px;color:#9ca3af;">— {ev.descricao}</span>
          {/if}
          {#if !ev.ativo}
            <span style="font-size:10px;background:#f1f5f9;color:#94a3b8;padding:1px 6px;border-radius:99px;margin-left:auto;">inativo</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

</div>
