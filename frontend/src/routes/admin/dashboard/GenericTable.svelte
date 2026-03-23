<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let items: any[] = [];
  export let cols: { key: string; label: string; badge?: boolean; toggle?: boolean }[] = [];
  export let loading = false;

  const dispatch = createEventDispatcher();

  let selected: Set<string> = new Set();

  $: allSelected = items.length > 0 && items.every(i => selected.has(i.id));

  function toggleAll() {
    if (allSelected) {
      selected = new Set();
    } else {
      selected = new Set(items.map(i => i.id));
    }
  }

  function toggleOne(id: string) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    selected = s;
  }

  // Reset selection when items list changes
  $: if (items) selected = new Set();

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
</script>

<div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
  <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:13px;font-weight:600;color:#374151;">{items.length} registros</span>
      {#if selected.size > 0}
        <button
          on:click={() => { dispatch('bulkDelete', { ids: [...selected] }); selected = new Set(); }}
          style="font-size:12px;background:#fef2f2;color:#ef4444;padding:6px 14px;border-radius:4px;border:1px solid #fecaca;cursor:pointer;font-weight:600;"
        >
          Excluir selecionados ({selected.size})
        </button>
      {/if}
    </div>
    <button
      on:click={() => dispatch('new')}
      style="font-size:12px;background:#7b0000;color:#fff;padding:6px 14px;border-radius:4px;border:none;cursor:pointer;"
    >
      + Novo
    </button>
  </div>

  {#if loading}
    <p style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Carregando...</p>
  {:else if items.length === 0}
    <p style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Nenhum registro.</p>
  {:else}
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 20px;width:36px;">
            <input
              type="checkbox"
              checked={allSelected}
              on:change={toggleAll}
              style="cursor:pointer;width:15px;height:15px;accent-color:#7b0000;"
            />
          </th>
          {#each cols as col}
            <th style="text-align:left;padding:10px 20px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">
              {col.label}
            </th>
          {/each}
          <th style="text-align:right;padding:10px 20px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr style="border-top:1px solid #f3f4f6;{selected.has(item.id) ? 'background:#fff7f7;' : ''}">
            <td style="padding:12px 20px;">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                on:change={() => toggleOne(item.id)}
                style="cursor:pointer;width:15px;height:15px;accent-color:#7b0000;"
              />
            </td>
            {#each cols as col}
              <td style="padding:12px 20px;color:#1f2937;">
                {#if col.toggle}
                  <button
                    on:click={() => dispatch('toggle', { id: item.id, field: col.key, current: item[col.key] })}
                    style="font-size:11px;font-weight:600;padding:2px 10px;border-radius:99px;border:none;cursor:pointer;
                      background:{item[col.key] ? '#dcfce7' : '#f1f5f9'};
                      color:{item[col.key] ? '#16a34a' : '#94a3b8'};"
                  >
                    {item[col.key] ? 'Ativo' : 'Inativo'}
                  </button>
                {:else if col.badge}
                  <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;
                    background:{tipoBadgeColor[item[col.key]] ?? '#e5e7eb'}22;
                    color:{tipoBadgeColor[item[col.key]] ?? '#6b7280'};">
                    {item[col.key]}
                  </span>
                {:else}
                  {item[col.key] ?? '—'}
                {/if}
              </td>
            {/each}
            <td style="padding:12px 20px;text-align:right;">
              <button
                on:click={() => dispatch('edit', item)}
                style="font-size:12px;color:#7b0000;background:none;border:none;cursor:pointer;margin-right:12px;font-weight:500;"
              >
                Editar
              </button>
              <button
                on:click={() => dispatch('delete', { id: item.id, nome: item.titulo ?? item.nome ?? item.name ?? item.id })}
                style="font-size:12px;color:#ef4444;background:none;border:none;cursor:pointer;"
              >
                Excluir
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
