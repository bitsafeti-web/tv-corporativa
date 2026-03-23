import { writable, derived } from 'svelte/store';
import { pb, type Configuracao } from '$lib/pocketbase';

export const config = writable<Configuracao | null>(null);

const DEFAULT_CONFIG: Partial<Configuracao> = {
  nome_empresa: 'Bitsafe',
  fuso_horario: 'America/Sao_Paulo',
  cidade: '',
  pais: 'BR',
  modo_manutencao: false,
  mensagem_manutencao: 'Sistema em manutenção. Voltamos em breve.',
  ticker_ativo: false,
  ticker_texto: ''
};

// Store com fallback para defaults quando configuração não está carregada
export const configEfetiva = derived(config, ($config) =>
  $config ? { ...DEFAULT_CONFIG, ...$config } : DEFAULT_CONFIG as Configuracao
);

export async function loadConfig(): Promise<void> {
  try {
    const records = await pb.collection('Configuracoes').getList<Configuracao>(1, 1);
    if (records.items.length > 0) {
      config.set(records.items[0]);
    }
  } catch (e) {
    // coleção ainda não criada ou sem registros — usa defaults
  }
}

export function subscribeToConfig(): () => void {
  loadConfig();

  pb.collection('Configuracoes').subscribe('*', () => {
    loadConfig();
  });

  return () => {
    pb.collection('Configuracoes').unsubscribe('*');
  };
}
