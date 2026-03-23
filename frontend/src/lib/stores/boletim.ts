import { writable } from 'svelte/store';
import { pb, type BoletimItem } from '$lib/pocketbase';

export const boletimItems = writable<BoletimItem[]>([]);

async function load() {
  try {
    const records = await pb.collection('Boletins').getList<BoletimItem>(1, 50, {
      filter: 'ativo = true',
      sort: '+ordem'
    });
    boletimItems.set(records.items);
  } catch (e) {
    console.error('Erro ao carregar boletim:', e);
  }
}

export function subscribeToBoletim(): () => void {
  load();
  pb.collection('Boletins').subscribe('*', () => load());
  return () => pb.collection('Boletins').unsubscribe('*');
}
