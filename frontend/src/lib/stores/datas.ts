import { writable } from 'svelte/store';
import { pb } from '$lib/pocketbase';

export interface DataComemorativa {
  id: string;
  titulo: string;
  data: string;       // ISO date string from PocketBase
  descricao?: string;
  ativo: boolean;
  antecedencia_dias: number;
  cor?: string;
}

/** Datas cujo período de notificação já começou (hoje está dentro da antecedência) */
export const datasProximas = writable<DataComemorativa[]>([]);

function calcularProximas(records: DataComemorativa[]): DataComemorativa[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return records.filter(r => {
    const data = new Date(r.data);
    data.setHours(0, 0, 0, 0);
    const diff = Math.ceil((data.getTime() - today.getTime()) / 86_400_000);
    const ante = r.antecedencia_dias ?? 7;
    // Mostra se a data está no futuro (ou hoje) dentro da janela de antecedência
    return diff >= 0 && diff <= ante;
  });
}

export function subscribeToDatasComemorativas(): () => void {
  async function load() {
    try {
      const records = await pb.collection('DatasComemorativas').getFullList<DataComemorativa>({
        filter: 'ativo = true',
        sort:   'data',
      });
      datasProximas.set(calcularProximas(records));
    } catch (_) { /* coleção ainda não existe */ }
  }

  load();

  pb.collection('DatasComemorativas').subscribe('*', () => load()).catch(() => {});

  // Re-checa a cada 60s — uma data pode entrar na janela de antecedência com o passar do tempo
  const timer = setInterval(load, 60_000);

  return () => {
    clearInterval(timer);
    try { pb.collection('DatasComemorativas').unsubscribe('*'); } catch (_) {}
  };
}
