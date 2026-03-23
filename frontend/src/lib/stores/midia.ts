import { writable } from 'svelte/store';
import { pb, type Midia } from '$lib/pocketbase';

export const midiaItems = writable<Midia[]>([]);

export async function loadMidia(): Promise<void> {
  try {
    const records = await pb.collection('midia').getList<Midia>(1, 50, {
      filter: 'ativo = true',
      sort: 'ordem,created'
    });
    midiaItems.set(records.items);
  } catch (e) {
    // coleção ainda não criada — sem mídia
    midiaItems.set([]);
  }
}

export function subscribeToMidia(): () => void {
  loadMidia();

  pb.collection('midia').subscribe('*', () => {
    loadMidia();
  });

  return () => {
    pb.collection('midia').unsubscribe('*');
  };
}

export function getMidiaUrl(item: Midia): string {
  return pb.files.getUrl(item as Parameters<typeof pb.files.getUrl>[0], item.arquivo);
}
