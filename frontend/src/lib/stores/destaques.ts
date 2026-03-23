import { writable } from 'svelte/store';
import { pb, type DestaqueItem } from '$lib/pocketbase';

export const destaqueItems = writable<DestaqueItem[]>([]);

async function load() {
  try {
    const records = await pb.collection('Destaque').getList<DestaqueItem>(1, 50, {
      filter: 'ativo = true && (publica_em = "" || publica_em <= @now) && (expira_em = "" || expira_em > @now)',
    });
    destaqueItems.set(records.items);
  } catch (e) {
    console.error('Erro ao carregar destaques:', e);
  }
}

export function subscribeToDestaques(): () => void {
  load();
  pb.collection('Destaque').subscribe('*', () => load());
  const timer = setInterval(load, 60_000);
  return () => { clearInterval(timer); pb.collection('Destaque').unsubscribe('*'); };
}
