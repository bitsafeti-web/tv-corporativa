import { writable } from 'svelte/store';
import { pb, type Post } from '$lib/pocketbase';

export const posts        = writable<Post[]>([]);
export const postsLoading = writable(true);

// Stores separados por seção
export const postsCampanha  = writable<Post[]>([]);
export const postsBoletim   = writable<Post[]>([]);
export const postsDestaque  = writable<Post[]>([]);

function buildFilter(extra = ''): string {
  return `ativo = true`
    + ` && (expira_em = "" || expira_em > @now)`
    + ` && (publica_em = "" || publica_em <= @now)`
    + (extra ? ` && ${extra}` : '');
}

async function fetchSection(filter: string, sort = '-destaque,-created'): Promise<Post[]> {
  const records = await pb.collection('posts').getList<Post>(1, 50, { filter, sort });
  return records.items;
}

export async function loadPosts(telaSlug?: string, filtroTipo?: string[]): Promise<void> {
  try {
    let extra = '';
    if (telaSlug) extra += `(somente_telas = "" || somente_telas ~ "${telaSlug}")`;
    if (filtroTipo?.length) {
      const tiposFilter = filtroTipo.map(t => `tipo = "${t}"`).join(' || ');
      extra += (extra ? ' && ' : '') + `(${tiposFilter})`;
    }

    const [campanha, boletim, destaque, outros] = await Promise.all([
      fetchSection(buildFilter(`tipo = "campanha"`)),
      fetchSection(buildFilter(`tipo = "boletim"`), 'created'),
      fetchSection(buildFilter(`tipo = "destaque"`)),
      fetchSection(buildFilter(`tipo != "campanha" && tipo != "boletim" && tipo != "destaque"` + (extra ? ` && ${extra}` : '')))
    ]);

    postsCampanha.set(campanha);
    postsBoletim.set(boletim);
    postsDestaque.set(destaque);
    posts.set(outros);
  } catch (e) {
    console.error('Erro ao carregar posts:', e);
  } finally {
    postsLoading.set(false);
  }
}

export function subscribeToPosts(telaSlug?: string, filtroTipo?: string[]): () => void {
  loadPosts(telaSlug, filtroTipo);

  pb.collection('posts').subscribe('*', () => {
    loadPosts(telaSlug, filtroTipo);
  });

  return () => pb.collection('posts').unsubscribe('*');
}

export const TIPO_CONFIG: Record<Post['tipo'], { label: string; color: string; bg: string }> = {
  aviso:       { label: 'Aviso',       color: 'text-amber-300',  bg: 'bg-amber-500/20 border-amber-500/40' },
  comunicado:  { label: 'Comunicado',  color: 'text-blue-300',   bg: 'bg-blue-500/20 border-blue-500/40' },
  evento:      { label: 'Evento',      color: 'text-green-300',  bg: 'bg-green-500/20 border-green-500/40' },
  urgente:     { label: 'URGENTE',     color: 'text-red-300',    bg: 'bg-red-500/20 border-red-500/40' },
  campanha:    { label: 'Campanha',    color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/40' },
  destaque:    { label: 'Destaque',   color: 'text-amber-300',  bg: 'bg-amber-500/20 border-amber-500/40' },
  boletim:     { label: 'Boletim',    color: 'text-cyan-300',   bg: 'bg-cyan-500/20 border-cyan-500/40' }
};
