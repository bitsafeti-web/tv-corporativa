import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

export type Post = {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: 'aviso' | 'comunicado' | 'evento' | 'urgente' | 'campanha' | 'destaque' | 'boletim';
  imagem?: string;
  ativo: boolean;
  destaque: boolean;
  expira_em?: string;
  publica_em?: string;
  somente_telas?: string;
  created: string;
  updated: string;
};

export type Configuracao = {
  id: string;
  nome_empresa: string;
  cidade: string;
  pais: string;
  fuso_horario: string;
  weather_api_key: string;
  google_api_key: string;
  google_calendar_id: string;
  modo_manutencao: boolean;
  mensagem_manutencao: string;
  ticker_ativo: boolean;
  ticker_texto: string;
};

export type CampanhaItem = {
  id: string;
  collectionId: string;
  collectionName: string;
  titulo: string;
  imagem_1568x876px?: string;
  ativo: boolean;
  created: string;
  updated: string;
};

export type DestaqueItem = {
  id: string;
  titulo: string;
  ativo: boolean;
  expira_em?: string;
  publica_em?: string;
  created: string;
  updated: string;
};

export type BoletimItem = {
  id: string;
  titulo: string;
  ativo: boolean;
  ordem: number;
  created: string;
  updated: string;
};

export type Tela = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  ativa: boolean;
  filtro_tipo: string[];
};

export type Midia = {
  id: string;
  titulo: string;
  arquivo: string;
  tipo: 'imagem' | 'video';
  duracao: number;
  ativo: boolean;
  ordem: number;
};

export function getImageUrl(record: Post | Midia, filename: string): string {
  return pb.files.getUrl(record as Parameters<typeof pb.files.getUrl>[0], filename);
}
