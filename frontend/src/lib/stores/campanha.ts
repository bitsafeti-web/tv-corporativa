import { writable } from 'svelte/store';
import { pb, type CampanhaItem } from '$lib/pocketbase';

export const campanhaItems = writable<CampanhaItem[]>([]);

async function load() {
  try {
    const records = await pb.collection('Campanha').getList<CampanhaItem>(1, 50, {
      filter: 'ativo = true && (publica_em = "" || publica_em <= @now) && (expira_em = "" || expira_em > @now)',
    });
    campanhaItems.set(records.items);
  } catch (e) {
    console.error('Erro ao carregar campanha:', e);
  }
}

export function subscribeToCampanha(): () => void {
  load();
  pb.collection('Campanha').subscribe('*', () => load());
  const timer = setInterval(load, 60_000);
  return () => { clearInterval(timer); pb.collection('Campanha').unsubscribe('*'); };
}
