<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let items: any[] = [];
  export let cols: { key: string; label: string; badge?: boolean; toggle?: boolean; image?: boolean }[] = [];
  export let loading = false;
  export let dropdownActions = false;
  export let pageSize = 20;
  export let pbUrl = '';

  const dispatch = createEventDispatcher();

  let selected: Set<string> = new Set();
  let openDropdownId: string | null = null;
  let search = '';
  let page = 1;

  function toggleDropdown(id: string) {
    openDropdownId = openDropdownId === id ? null : id;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  $: filtered = search.trim()
    ? items.filter(i =>
        cols.some(c => String(i[c.key] ?? '').toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  $: totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  $: paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  $: allSelected = paginated.length > 0 && paginated.every(i => selected.has(i.id));

  // Reset page when search changes
  $: if (search) page = 1;

  function toggleAll() {
    if (allSelected) {
      const s = new Set(selected);
      paginated.forEach(i => s.delete(i.id));
      selected = s;
    } else {
      const s = new Set(selected);
      paginated.forEach(i => s.add(i.id));
      selected = s;
    }
  }

  function toggleOne(id: string) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    selected = s;
  }

  $: if (items) { selected = new Set(); page = 1; }

  const tipoBadgeColor: Record<string, string> = {
    aviso:      '#f59e0b',
    comunicado: '#3b82f6',
    evento:     '#22c55e',
    urgente:    '#ef4444',
    campanha:   '#a855f7',
    destaque:   '#f97316',
    boletim:    '#64748b',
    imagem:     '#0369a1',
    video:      '#7c3aed',
  };

  function imgUrl(item: any, col: any): string {
    const filename = item[col.key];
    if (!filename) return '';
    return `${pbUrl}/api/files/${item.collectionId}/${item.id}/${filename}`;
  }
</script>

<svelte:window on:click={closeDropdown} />

<div class="gt-wrap">
  <!-- Header: contagem + busca + novo -->
  <div style="padding:14px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
      <span style="font-size:13px;font-weight:600;color:#374151;white-space:nowrap;">
        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        {#if filtered.length !== items.length}<span style="color:#9ca3af;font-weight:400;"> de {items.length}</span>{/if}
      </span>
      {#if selected.size > 0}
        <button
          on:click={() => { dispatch('bulkDelete', { ids: [...selected] }); selected = new Set(); }}
          style="font-size:12px;background:rgba(239,68,68,0.08);color:#ef4444;padding:5px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:600;white-space:nowrap;"
        >
          Excluir selecionados ({selected.size})
        </button>
      {/if}
    </div>

    <!-- busca -->
    <div style="position:relative;flex:1;min-width:160px;max-width:260px;">
      <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);pointer-events:none;color:#9ca3af;"
        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input
        bind:value={search}
        placeholder="Buscar..."
        style="width:100%;box-sizing:border-box;padding:6px 10px 6px 30px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;color:#374151;outline:none;"
      />
    </div>

    <button
      on:click={() => dispatch('new')}
      style="font-size:12px;background:rgba(123,0,0,0.08);color:#7b0000;padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-weight:600;white-space:nowrap;"
    >
      + Novo
    </button>
  </div>

  {#if loading}
    <p style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Carregando...</p>
  {:else if filtered.length === 0}
    <p style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">
      {search ? 'Nenhum resultado para "' + search + '".' : 'Nenhum registro.'}
    </p>
  {:else}
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 20px;width:36px;border-right:1px solid #e5e7eb;">
            <input type="checkbox" checked={allSelected} on:change={toggleAll}
              style="cursor:pointer;width:15px;height:15px;accent-color:#7b0000;" />
          </th>
          {#each cols as col, i}
            <th style="{i === 0 ? 'text-align:left;' : 'text-align:center;'}padding:10px 16px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-right:1px solid #e5e7eb;">
              {col.label}
            </th>
          {/each}
          <th style="text-align:center;width:60px;padding:10px 16px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each paginated as item}
          <tr style="border-top:1px solid #f3f4f6;{selected.has(item.id) ? 'background:#fff7f7;' : ''}">
            <td style="padding:12px 20px;border-right:1px solid #f3f4f6;text-align:center;">
              <input type="checkbox" checked={selected.has(item.id)} on:change={() => toggleOne(item.id)}
                style="cursor:pointer;width:15px;height:15px;accent-color:#7b0000;" />
            </td>
            {#each cols as col, i}
              <td style="padding:10px 16px;color:#1f2937;border-right:1px solid #f3f4f6;{i === 0 ? '' : 'text-align:center;'}">
                {#if col.image}
                  {@const url = imgUrl(item, col)}
                  {#if url}
                    <img src={url} alt="" style="height:40px;width:72px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;display:inline-block;" />
                  {:else}
                    <span style="font-size:12px;color:#9ca3af;">—</span>
                  {/if}
                {:else if col.toggle}
                  <button
                    on:click={() => dispatch('toggle', { id: item.id, field: col.key, current: item[col.key] })}
                    style="font-size:11px;font-weight:600;padding:2px 10px;border-radius:99px;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;
                      background:{item[col.key] ? '#dcfce7' : '#f1f5f9'};
                      color:{item[col.key] ? '#16a34a' : '#94a3b8'};"
                  >
                    {item[col.key] ? 'Ativo' : 'Inativo'}
                  </button>
                {:else if col.badge}
                  <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;
                    background:{tipoBadgeColor[item[col.key]] ?? '#e5e7eb'}22;
                    color:{tipoBadgeColor[item[col.key]] ?? '#6b7280'};">
                    {item[col.key]}
                  </span>
                {:else if col.key === 'data'}
                  {#if item[col.key]}
                    <span style="font-size:12px;color:#374151;">
                      {new Date(String(item[col.key]).replace(' ', 'T')).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'})}
                    </span>
                  {:else}
                    <span style="font-size:12px;color:#9ca3af;">—</span>
                  {/if}
                {:else if col.key.endsWith('_em')}
                  {#if item[col.key]}
                    <span style="font-size:12px;color:#374151;">
                      {new Date(String(item[col.key]).replace(' ', 'T')).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </span>
                  {:else}
                    <span style="font-size:12px;color:#9ca3af;">—</span>
                  {/if}
                {:else if i === 0}
                  <span style="display:block;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    {item[col.key] ?? '—'}
                  </span>
                {:else}
                  <span>{item[col.key] ?? '—'}</span>
                {/if}
              </td>
            {/each}
            <td style="padding:10px 16px;text-align:center;">
              {#if dropdownActions}
                <div style="position:relative;display:inline-block;">
                  <button
                    on:click|stopPropagation={() => toggleDropdown(item.id)}
                    style="font-size:18px;line-height:1;color:#6b7280;background:rgba(107,114,128,0.08);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;"
                  >⋮</button>
                  {#if openDropdownId === item.id}
                    <div style="position:absolute;right:0;top:34px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);min-width:130px;z-index:50;overflow:hidden;">
                      <button
                        on:click={() => { closeDropdown(); dispatch('edit', item); }}
                        style="display:block;width:100%;text-align:left;padding:9px 14px;font-size:13px;color:#1f2937;background:none;border:none;cursor:pointer;"
                        on:mouseenter={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                        on:mouseleave={(e) => { e.currentTarget.style.background='none'; }}
                      >Editar</button>
                      <button
                        on:click={() => { closeDropdown(); dispatch('delete', { id: item.id, nome: item.titulo ?? item.nome ?? item.name ?? item.id }); }}
                        style="display:block;width:100%;text-align:left;padding:9px 14px;font-size:13px;color:#ef4444;background:none;border:none;cursor:pointer;border-top:1px solid #f3f4f6;"
                        on:mouseenter={(e) => { e.currentTarget.style.background='#fef2f2'; }}
                        on:mouseleave={(e) => { e.currentTarget.style.background='none'; }}
                      >Excluir</button>
                    </div>
                  {/if}
                </div>
              {:else}
                <button
                  on:click={() => dispatch('edit', item)}
                  style="font-size:12px;color:#7b0000;background:rgba(123,0,0,0.08);border:none;border-radius:8px;cursor:pointer;margin-right:8px;font-weight:600;padding:5px 12px;"
                >Editar</button>
                <button
                  on:click={() => dispatch('delete', { id: item.id, nome: item.titulo ?? item.nome ?? item.name ?? item.id })}
                  style="font-size:12px;color:#ef4444;background:rgba(239,68,68,0.08);border:none;border-radius:8px;cursor:pointer;font-weight:600;padding:5px 12px;"
                >Excluir</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Paginação -->
    {#if totalPages > 1}
      <div style="padding:12px 20px;border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:12px;color:#6b7280;">
          {(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)} de {filtered.length}
        </span>
        <div style="display:flex;gap:4px;">
          <button
            on:click={() => page = Math.max(1, page-1)} disabled={page===1}
            style="padding:4px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;background:#fff;color:{page===1?'#d1d5db':'#374151'};cursor:{page===1?'default':'pointer'};"
          >← Anterior</button>
          {#each Array.from({length: totalPages}, (_,i)=>i+1) as p}
            {#if totalPages <= 7 || p===1 || p===totalPages || Math.abs(p-page)<=1}
              <button
                on:click={() => page = p}
                style="padding:4px 10px;border:1px solid {p===page?'#7b0000':'#e5e7eb'};border-radius:6px;font-size:12px;
                  background:{p===page?'#7b0000':'#fff'};color:{p===page?'#fff':'#374151'};cursor:pointer;font-weight:{p===page?'600':'400'};"
              >{p}</button>
            {:else if Math.abs(p-page)===2}
              <span style="padding:4px 6px;font-size:12px;color:#9ca3af;">…</span>
            {/if}
          {/each}
          <button
            on:click={() => page = Math.min(totalPages, page+1)} disabled={page===totalPages}
            style="padding:4px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;background:#fff;color:{page===totalPages?'#d1d5db':'#374151'};cursor:{page===totalPages?'default':'pointer'};"
          >Próximo →</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .gt-wrap {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: visible;
    position: relative;
  }
  .gt-wrap :global(thead tr th:first-child) { border-radius: 8px 0 0 0; }
  .gt-wrap :global(thead tr th:last-child)  { border-radius: 0 8px 0 0; }
  .gt-wrap :global(tbody tr:last-child td:first-child) { border-radius: 0 0 0 8px; }
  .gt-wrap :global(tbody tr:last-child td:last-child)  { border-radius: 0 0 8px 0; }
</style>
