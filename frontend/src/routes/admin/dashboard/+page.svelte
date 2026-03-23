<script lang="ts">
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
  import GenericTable from './GenericTable.svelte';
  import Modal from './Modal.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import CalendarGrid from './CalendarGrid.svelte';

  const PB_URL = PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

  type Section = 'dashboard' | 'usuarios' | 'boletins' | 'campanha' | 'configuracoes' | 'destaque' | 'calendario';
  let section: Section = 'dashboard';

  // dados
  let usuarios:  any[] = [];
  let boletins:  any[] = [];
  let campanhas: any[] = [];
  let destaques: any[] = [];
  let datas:     any[] = [];
  let config:    any   = null;
  let loading = false;

  // confirm dialog
  let confirmOpen = false;
  let confirmMessage = '';
  let confirmAction: (() => Promise<void>) | null = null;

  function askConfirm(message: string, action: () => Promise<void>) {
    confirmMessage = message;
    confirmAction = action;
    confirmOpen = true;
  }

  async function onConfirmed() {
    confirmOpen = false;
    if (confirmAction) await confirmAction();
    confirmAction = null;
  }

  function onCancelled() {
    confirmOpen = false;
    confirmAction = null;
  }

  // modal
  let modalOpen = false;
  let modalTitle = '';
  let editingId: string | null = null;
  let saving = false;
  let formError = '';

  // forms
  let fBoletim   = { titulo: '', ordem: 0, ativo: true };
  let fCampanha  = { titulo: '', ativo: true, imagem: null as File | null, imagemAtual: '', imagemErro: '', publica_em: '', expira_em: '', previewUrl: '', collectionId: '', recordId: '' };
  let fDestaque  = { titulo: '', ativo: true, expira_em: '', publica_em: '' };
  let fUsuario   = { name: '', email: '', password: '' };
  let fData = { titulo: '', data: '', descricao: '', ativo: true, antecedencia_dias: 7, cor: '#7b0000' };

  let fConfig    = {
    nome_empresa: '', cidade: '', pais: '', fuso_horario: '',
    weather_api_key: '', google_api_key: '', google_calendar_id: '',
    modo_manutencao: false, mensagem_manutencao: '',
    ticker_ativo: false, ticker_texto: ''
  };

  // selects de configurações
  const cidades = ["Alagoinhas","Americana","Anapolis","Aracaju","Arapiraca","Araraquara","Araras","Araucaria","Belem","Belo Horizonte","Boa Vista","Botucatu","Brasilia","Cachoeiro de Itapemirim","Campina Grande","Campinas","Campo Grande","Campo Largo","Caruaru","Cascavel","Caucaia","Caxias do Sul","Contagem","Criciuma","Cuiaba","Curitiba","Diadema","Duque de Caxias","Eunapolis","Feira de Santana","Florianopolis","Fortaleza","Foz do Iguacu","Franca","Goiania","Governador Valadares","Guarulhos","Ilheus","Imperatriz","Itabuna","Itajai","Itapetininga","Itaquaquecetuba","Joao Pessoa","Joinville","Juazeiro do Norte","Juiz de Fora","Jundiai","Londrina","Luziania","Macapa","Maceio","Manaus","Marilia","Maringa","Maua","Montes Claros","Mossoro","Natal","Niteroi","Nova Friburgo","Nova Iguacu","Novo Hamburgo","Olinda","Osasco","Palmas","Parauapebas","Passo Fundo","Paulista","Petropolis","Piracicaba","Porto Alegre","Porto Velho","Presidente Prudente","Recife","Ribeirao Preto","Rio Branco","Rio de Janeiro","Rondonopolis","Salvador","Santa Maria","Santarem","Santo Andre","Santos","Sao Bernardo do Campo","Sao Carlos","Sao Goncalo","Sao Jose do Rio Preto","Sao Jose dos Campos","Sao Luis","Sao Paulo","Sao Vicente","Sorocaba","Sumare","Taubate","Teresina","Uberaba","Uberlandia","Varzea Grande","Vitoria","Vitoria da Conquista","Amsterdam","Ankara","Athens","Auckland","Bangkok","Barcelona","Beijing","Berlin","Bogota","Brussels","Budapest","Buenos Aires","Cairo","Cape Town","Caracas","Chicago","Copenhagen","Delhi","Denver","Dubai","Dublin","Frankfurt","Guayaquil","Helsinki","Hong Kong","Houston","Istanbul","Jakarta","Jerusalem","Johannesburg","Kuala Lumpur","La Paz","Lagos","Lima","Lisbon","London","Los Angeles","Madrid","Manila","Melbourne","Mexico City","Miami","Milan","Montreal","Moscow","Mumbai","Munich","Nairobi","New York","Oslo","Ottawa","Panama City","Paramaribo","Paris","Prague","Quito","Rome","Santiago","Seattle","Seoul","Singapore","Stockholm","Sydney","Taipei","Tehran","Tel Aviv","Tokyo","Toronto","Vancouver","Vienna","Warsaw","Wellington","Zurich"];
  const paises = ["BR","AE","AR","AT","AU","BE","BO","CA","CH","CL","CN","CO","CZ","DE","DK","DZ","EC","EG","ES","FI","FR","GB","GR","GY","HU","ID","IL","IN","IT","JP","KR","MA","MX","MY","NG","NL","NO","NZ","PA","PE","PH","PL","PT","PY","RO","RU","SA","SE","SG","SR","TH","TR","TW","US","UY","VE","VN","ZA"];
  const fusos = ["America/Sao_Paulo","America/Araguaina","America/Bahia","America/Belem","America/Boa_Vista","America/Campo_Grande","America/Cuiaba","America/Fortaleza","America/Maceio","America/Manaus","America/Noronha","America/Porto_Velho","America/Recife","America/Rio_Branco","America/Santarem","America/Argentina/Buenos_Aires","America/Asuncion","America/Bogota","America/Caracas","America/Guayaquil","America/La_Paz","America/Lima","America/Montevideo","America/Paramaribo","America/Santiago","America/Anchorage","America/Chicago","America/Denver","America/Halifax","America/Los_Angeles","America/Mexico_City","America/Montreal","America/New_York","America/Phoenix","America/Toronto","America/Vancouver","Pacific/Honolulu","Europe/Amsterdam","Europe/Athens","Europe/Berlin","Europe/Brussels","Europe/Budapest","Europe/Copenhagen","Europe/Dublin","Europe/Helsinki","Europe/Istanbul","Europe/Lisbon","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Oslo","Europe/Paris","Europe/Prague","Europe/Rome","Europe/Stockholm","Europe/Vienna","Europe/Warsaw","Europe/Zurich","Asia/Bangkok","Asia/Delhi","Asia/Dubai","Asia/Hong_Kong","Asia/Jakarta","Asia/Jerusalem","Asia/Kolkata","Asia/Kuala_Lumpur","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Taipei","Asia/Tehran","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Pacific/Auckland","Africa/Cairo","Africa/Johannesburg","Africa/Lagos","Africa/Nairobi","UTC"];

  onMount(async () => {
    if (!pb.authStore.isValid) { goto('/admin'); return; }
    await loadAll();
  });

  async function ensureDatasComemorativas() {
    try {
      await pb.collections.getOne('DatasComemorativas');
    } catch (_) {
      // Cria a collection se não existir
      await pb.collections.create({
        name: 'DatasComemorativas',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { type: 'text',   name: 'titulo',           required: true,  min: 1, max: 200 },
          { type: 'date',   name: 'data',             required: true  },
          { type: 'text',   name: 'descricao',        required: false, max: 500 },
          { type: 'bool',   name: 'ativo',            required: false },
          { type: 'number', name: 'antecedencia_dias',required: false, min: 0, max: 365, onlyInt: true },
          { type: 'text',   name: 'cor',              required: false, max: 20 },
        ],
      });
    }
  }

  async function loadAll() {
    loading = true;
    try {
      await ensureDatasComemorativas();
      const [rUsers, rBol, rCamp, rDest, rDatas, rCfg] = await Promise.all([
        pb.collection('Usuarios').getList(1, 100, { sort: 'name' }).catch(() => ({ items: [] })),
        pb.collection('Boletins').getList(1, 100, { sort: 'ordem' }).catch(() => ({ items: [] })),
        pb.collection('Campanha').getList(1, 100, { sort: 'titulo' }).catch((e) => { console.error('campanha:', e); return { items: [] }; }),
        pb.collection('Destaque').getList(1, 100, { sort: 'titulo' }).catch((e) => { console.error('destaque:', e); return { items: [] }; }),
        pb.collection('DatasComemorativas').getFullList({ sort: 'data' }).catch(() => []),
        pb.collection('Configuracoes').getList(1, 1).catch(() => ({ items: [] })),
      ]);
      usuarios  = rUsers.items;
      boletins  = rBol.items;
      campanhas = rCamp.items;
      destaques = rDest.items;
      datas     = rDatas as any[];
      config    = rCfg.items[0] ?? null;
    } finally {
      loading = false;
    }
  }

  // ── helpers modal ──────────────────────────────────────────
  function openNew(sec: Section) {
    editingId = null;
    formError = '';
    if (sec === 'boletins')     fBoletim  = { titulo: '', ordem: boletins.length + 1, ativo: true };
    if (sec === 'campanha')     fCampanha = { titulo: '', ativo: true, imagem: null, imagemAtual: '', imagemErro: '', publica_em: '', expira_em: '', previewUrl: '', collectionId: '', recordId: '' };
    if (sec === 'destaque')     fDestaque = { titulo: '', ativo: true, expira_em: '', publica_em: '' };
    if (sec === 'calendario')   fData     = { titulo: '', data: '', descricao: '', ativo: true, antecedencia_dias: 7, cor: '#7b0000' };
    if (sec === 'usuarios')     fUsuario  = { name: '', email: '', password: '' };
    if (sec === 'configuracoes' && config) loadConfigForm();
    modalTitle = `Novo — ${menu.find(m=>m.id===sec)?.label}`;
    modalOpen = true;
  }

  function openEdit(sec: Section, item: any) {
    editingId = item.id;
    formError = '';
    if (sec === 'boletins')     fBoletim  = { titulo: item.titulo, ordem: item.ordem ?? 0, ativo: item.ativo };
    if (sec === 'campanha') {
      const filename = item.imagem_1568x876px ?? '';
      const colId    = item.collectionId ?? '';
      const recId    = item.id ?? '';
      const preview  = filename ? `${PB_URL}/api/files/${colId}/${recId}/${filename}` : '';
      fCampanha = { titulo: item.titulo, ativo: item.ativo, imagem: null, imagemAtual: filename, imagemErro: '', publica_em: item.publica_em ? item.publica_em.slice(0,16) : '', expira_em: item.expira_em ? item.expira_em.slice(0,16) : '', previewUrl: preview, collectionId: colId, recordId: recId };
    }
    if (sec === 'destaque')     fDestaque = { titulo: item.titulo, ativo: item.ativo, expira_em: item.expira_em ? item.expira_em.slice(0,16) : '', publica_em: item.publica_em ? item.publica_em.slice(0,16) : '' };
    if (sec === 'calendario')   fData     = { titulo: item.titulo, data: item.data ? item.data.slice(0,10) : '', descricao: item.descricao ?? '', ativo: item.ativo, antecedencia_dias: item.antecedencia_dias ?? 7, cor: item.cor || '#7b0000' };
    if (sec === 'usuarios')     fUsuario  = { name: item.name, email: item.email, password: '' };
    if (sec === 'configuracoes') loadConfigForm();
    modalTitle = `Editar — ${menu.find(m=>m.id===sec)?.label}`;
    modalOpen = true;
  }

  function loadConfigForm() {
    if (!config) return;
    fConfig = {
      nome_empresa: config.nome_empresa ?? '',
      cidade: config.cidade ?? '',
      pais: config.pais ?? '',
      fuso_horario: config.fuso_horario ?? '',
      weather_api_key: config.weather_api_key ?? '',
      google_api_key: config.google_api_key ?? '',
      google_calendar_id: config.google_calendar_id ?? '',
      modo_manutencao: config.modo_manutencao ?? false,
      mensagem_manutencao: config.mensagem_manutencao ?? '',
      ticker_ativo: config.ticker_ativo ?? false,
      ticker_texto: config.ticker_texto ?? '',
    };
    editingId = config.id;
  }

  function closeModal() { modalOpen = false; }

  function validarImagemCampanha(file: File): Promise<string> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth === 1568 && img.naturalHeight === 876) {
          resolve('');
        } else {
          resolve(`Dimensões incorretas: ${img.naturalWidth}×${img.naturalHeight}px. A imagem deve ter exatamente 1568×876px.`);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve('Não foi possível ler a imagem.'); };
      img.src = url;
    });
  }

  async function onImagemCampanhaChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    fCampanha.imagem = null;
    fCampanha.imagemErro = '';
    if (!file) return;
    const erro = await validarImagemCampanha(file);
    if (erro) {
      fCampanha.imagemErro = erro;
      (e.target as HTMLInputElement).value = '';
    } else {
      fCampanha.imagem = file;
    }
  }

  // ── save ──────────────────────────────────────────────────
  async function save(sec: Section) {
    saving = true;
    formError = '';
    try {
      if (sec === 'boletins') {
        const data = { titulo: fBoletim.titulo, ordem: Number(fBoletim.ordem), ativo: fBoletim.ativo };
        editingId ? await pb.collection('Boletins').update(editingId, data)
                  : await pb.collection('Boletins').create(data);
      }

      else if (sec === 'campanha') {
        if (fCampanha.imagemErro) { formError = fCampanha.imagemErro; saving = false; return; }
        if (!fCampanha.titulo.trim()) { formError = 'Título é obrigatório.'; saving = false; return; }

        if (fCampanha.imagem) {
          // com arquivo: usa FormData
          const fd = new FormData();
          fd.append('titulo', fCampanha.titulo);
          fd.append('ativo', fCampanha.ativo ? 'true' : 'false');
          if (fCampanha.publica_em) fd.append('publica_em', fCampanha.publica_em);
          if (fCampanha.expira_em)  fd.append('expira_em',  fCampanha.expira_em);
          fd.append('imagem_1568x876px', fCampanha.imagem);
          editingId ? await pb.collection('Campanha').update(editingId, fd)
                    : await pb.collection('Campanha').create(fd);
        } else {
          // sem arquivo: usa objeto simples (booleanos nativos)
          const data: any = {
            titulo: fCampanha.titulo,
            ativo: fCampanha.ativo,
          };
          if (fCampanha.publica_em) data.publica_em = fCampanha.publica_em;
          if (fCampanha.expira_em)  data.expira_em  = fCampanha.expira_em;
          editingId ? await pb.collection('Campanha').update(editingId, data)
                    : await pb.collection('Campanha').create(data);
        }
      }

      else if (sec === 'destaque') {
        const data: any = { titulo: fDestaque.titulo, ativo: fDestaque.ativo };
        if (fDestaque.expira_em)  data.expira_em  = fDestaque.expira_em;
        if (fDestaque.publica_em) data.publica_em = fDestaque.publica_em;
        editingId ? await pb.collection('Destaque').update(editingId, data)
                  : await pb.collection('Destaque').create(data);
      }

      else if (sec === 'usuarios') {
        if (editingId) {
          const data: any = { name: fUsuario.name, email: fUsuario.email };
          if (fUsuario.password) { data.password = fUsuario.password; data.passwordConfirm = fUsuario.password; }
          await pb.collection('Usuarios').update(editingId, data);
        } else {
          if (!fUsuario.password) { formError = 'Senha obrigatória.'; saving = false; return; }
          await pb.collection('Usuarios').create({ ...fUsuario, passwordConfirm: fUsuario.password });
        }
      }

      else if (sec === 'calendario') {
        if (!fData.titulo.trim()) { formError = 'Título é obrigatório.'; saving = false; return; }
        if (!fData.data) { formError = 'Data é obrigatória.'; saving = false; return; }
        const data = {
          titulo: fData.titulo,
          data: fData.data,
          descricao: fData.descricao,
          ativo: fData.ativo,
          antecedencia_dias: Number(fData.antecedencia_dias),
          cor: fData.cor,
        };
        editingId ? await pb.collection('DatasComemorativas').update(editingId, data)
                  : await pb.collection('DatasComemorativas').create(data);
      }

      else if (sec === 'configuracoes') {
        const data = { ...fConfig };
        editingId ? await pb.collection('Configuracoes').update(editingId, data)
                  : await pb.collection('Configuracoes').create(data);
      }

      modalOpen = false;
      await loadAll();
    } catch (e: any) {
      formError = e?.message ?? 'Erro ao salvar.';
    } finally {
      saving = false;
    }
  }

  // ── toggle / delete ───────────────────────────────────────
  async function handleToggle(collection: string, e: CustomEvent) {
    const { id, field, current } = e.detail;
    await pb.collection(collection).update(id, { [field]: !current });
    await loadAll();
  }

  function handleDelete(collection: string, e: CustomEvent) {
    const { id, nome } = e.detail;
    askConfirm(
      `Deseja excluir o registro "${nome}"? Esta ação não pode ser desfeita.`,
      async () => { await pb.collection(collection).delete(id); await loadAll(); }
    );
  }

  function handleBulkDelete(collection: string, e: CustomEvent) {
    const { ids } = e.detail as { ids: string[] };
    if (!ids.length) return;
    askConfirm(
      `Deseja excluir ${ids.length} registro(s) selecionado(s)? Esta ação não pode ser desfeita.`,
      async () => { await Promise.all(ids.map(id => pb.collection(collection).delete(id))); await loadAll(); }
    );
  }

  function logout() { pb.authStore.clear(); goto('/admin'); }

  const icons: Record<string, string> = {
    dashboard:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    campanha:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>`,
    boletins:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
    destaque:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    usuarios:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    configuracoes:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    calendario:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="8" y1="18" x2="8.01" y2="18"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    logout:       `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  };

  const menu: { id: Section; label: string }[] = [
    { id: 'dashboard',    label: 'Dashboard'    },
    { id: 'campanha',     label: 'Campanhas'    },
    { id: 'boletins',     label: 'Boletins'     },
    { id: 'destaque',     label: 'Destaque'     },
    { id: 'calendario',   label: 'Calendário'   },
    { id: 'usuarios',     label: 'Usuários'     },
    { id: 'configuracoes',label: 'Configurações'},
  ];

  // ── estilos de input reutilizáveis ────────────────────────
  const inp = 'display:block;width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;color:#111;margin-bottom:14px;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;';
  const btn = 'padding:9px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none;';
</script>

<svelte:head><title>TV Corporativa — Painel</title></svelte:head>

<div style="display:flex;min-height:100vh;font-family:sans-serif;">

  <!-- SIDEBAR -->
  <aside style="width:220px;background:#7b0000;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;">
    <div style="padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <img src="/bitsafe-branco.png" alt="Bitsafe" style="height:36px;object-fit:contain;" />
      <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:6px 0 0;">TV Corporativa</p>
    </div>
    <nav style="flex:1;padding:12px 0;overflow-y:auto;">
      {#each menu as item}
        <button
          on:click={() => section = item.id}
          style="display:flex;align-items:center;gap:12px;width:100%;padding:10px 20px;border:none;cursor:pointer;
            background:{section===item.id?'rgba(255,255,255,0.15)':'transparent'};
            color:#fff;
            font-size:13px;font-weight:{section===item.id?'600':'400'};
            border-left:{section===item.id?'3px solid #fff':'3px solid transparent'};
            text-align:left;box-sizing:border-box;"
        >
          <span style="display:flex;align-items:center;width:18px;flex-shrink:0;opacity:{section===item.id?1:0.65};">
            {@html icons[item.id]}
          </span>
          <span style="opacity:{section===item.id?1:0.7};">{item.label}</span>
        </button>
      {/each}
    </nav>
    <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);">
      <button on:click={logout}
        style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:8px;background:rgba(255,255,255,0.1);border:none;border-radius:4px;color:rgba(255,255,255,0.8);font-size:12px;cursor:pointer;">
        {@html icons.logout} Sair
      </button>
    </div>
  </aside>

  <!-- CONTEÚDO -->
  <main style="flex:1;background:#f4f4f5;overflow:auto;">
    <div style="background:#fff;border-bottom:1px solid #e5e7eb;padding:14px 28px;position:sticky;top:0;z-index:10;">
      <h1 style="font-size:15px;font-weight:600;color:#111827;margin:0;">
        {menu.find(m=>m.id===section)?.label}
      </h1>
    </div>

    <div style="padding:28px;">

      <!-- DASHBOARD -->
      {#if section === 'dashboard'}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
          {#each [
            {label:'Usuários',  value:usuarios.length,  color:'#7b0000'},
            {label:'Boletins',  value:boletins.length,  color:'#0369a1'},
            {label:'Campanhas', value:campanhas.length, color:'#7c3aed'},
            {label:'Destaques', value:destaques.length, color:'#f97316'},
          ] as card}
            <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:20px;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 6px;">{card.label}</p>
              <p style="font-size:28px;font-weight:700;color:{card.color};margin:0;">{card.value}</p>
            </div>
          {/each}
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:20px;">
          {#each [{label:'Últimas campanhas',items:campanhas},{label:'Últimos destaques',items:destaques},{label:'Últimos boletins',items:boletins}] as bloco}
            <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
              <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#374151;">{bloco.label}</div>
              <!-- cabeçalho colunas -->
              <div style="display:grid;grid-template-columns:1fr 140px 140px 80px;padding:8px 20px;background:#f9fafb;border-bottom:1px solid #f3f4f6;">
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Título</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Postagem</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Expiração</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Status</span>
              </div>
              {#each bloco.items.slice(0,5) as it}
                <div style="display:grid;grid-template-columns:1fr 140px 140px 80px;align-items:center;padding:11px 20px;border-bottom:1px solid #f9fafb;">
                  <span style="font-size:13px;font-weight:500;color:#1f2937;">{it.titulo}</span>
                  <span style="font-size:12px;color:#6b7280;">
                    {it.created ? it.created.slice(0,10) : '—'}
                  </span>
                  <span style="font-size:12px;color:{it.expira_em ? '#ef4444' : '#9ca3af'};">
                    {it.expira_em ? it.expira_em.slice(0,10) : 'Sem expiração'}
                  </span>
                  <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;display:inline-block;
                    background:{it.ativo?'#dcfce7':'#f1f5f9'};color:{it.ativo?'#16a34a':'#94a3b8'};">
                    {it.ativo?'Ativo':'Inativo'}
                  </span>
                </div>
              {:else}
                <p style="padding:20px;color:#9ca3af;font-size:13px;margin:0;">Nenhum registro.</p>
              {/each}
            </div>
          {/each}
        </div>

      <!-- BOLETINS -->
      {:else if section === 'boletins'}
        <GenericTable {loading} items={boletins}
          cols={[{key:'titulo',label:'Título'},{key:'ordem',label:'Ordem'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('boletins')}
          on:edit={(e) => openEdit('boletins', e.detail)}
          on:toggle={(e) => handleToggle('Boletins', e)}
          on:delete={(e) => handleDelete('Boletins', e)}
          on:bulkDelete={(e) => handleBulkDelete('Boletins', e)}
        />

      <!-- CAMPANHA -->
      {:else if section === 'campanha'}
        <GenericTable {loading} items={campanhas}
          cols={[{key:'titulo',label:'Título'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('campanha')}
          on:edit={(e) => openEdit('campanha', e.detail)}
          on:toggle={(e) => handleToggle('Campanha', e)}
          on:delete={(e) => handleDelete('Campanha', e)}
          on:bulkDelete={(e) => handleBulkDelete('Campanha', e)}
        />

      <!-- DESTAQUE -->
      {:else if section === 'destaque'}
        <GenericTable {loading} items={destaques}
          cols={[{key:'titulo',label:'Título'},{key:'expira_em',label:'Expira em'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('destaque')}
          on:edit={(e) => openEdit('destaque', e.detail)}
          on:toggle={(e) => handleToggle('Destaque', e)}
          on:delete={(e) => handleDelete('Destaque', e)}
          on:bulkDelete={(e) => handleBulkDelete('Destaque', e)}
        />

      <!-- CALENDÁRIO -->
      {:else if section === 'calendario'}
        <div style="display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;">
          <!-- Calendário visual -->
          <CalendarGrid {datas} />

          <!-- Lista -->
          <GenericTable {loading} items={datas}
            cols={[{key:'titulo',label:'Título'},{key:'data',label:'Data'},{key:'antecedencia_dias',label:'Antecedência (dias)'},{key:'ativo',label:'Status',toggle:true}]}
            on:new={() => openNew('calendario')}
            on:edit={(e) => openEdit('calendario', e.detail)}
            on:toggle={(e) => handleToggle('DatasComemorativas', e)}
            on:delete={(e) => handleDelete('DatasComemorativas', e)}
            on:bulkDelete={(e) => handleBulkDelete('DatasComemorativas', e)}
          />
        </div>

      <!-- USUÁRIOS -->
      {:else if section === 'usuarios'}
        <GenericTable {loading} items={usuarios}
          cols={[{key:'name',label:'Nome'},{key:'email',label:'E-mail'}]}
          on:new={() => openNew('usuarios')}
          on:edit={(e) => openEdit('usuarios', e.detail)}
          on:toggle={(e) => handleToggle('Usuarios', e)}
          on:delete={(e) => handleDelete('Usuarios', e)}
        />

      <!-- CONFIGURAÇÕES -->
      {:else if section === 'configuracoes'}
        <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:600;color:#374151;">Configurações da empresa</span>
            <button on:click={() => openEdit('configuracoes', config ?? {})}
              style="font-size:12px;background:#7b0000;color:#fff;padding:6px 14px;border-radius:4px;border:none;cursor:pointer;">
              {config ? 'Editar' : 'Criar'}
            </button>
          </div>
          {#if config}
            {#each Object.entries(config).filter(([k])=>!['id','collectionId','collectionName','created','updated'].includes(k)) as [key, value]}
              <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
                <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">{key}</span>
                <span style="font-size:13px;color:#1f2937;word-break:break-all;">{String(value)}</span>
              </div>
            {/each}
          {:else}
            <p style="padding:24px 20px;color:#9ca3af;font-size:13px;margin:0;">Nenhuma configuração cadastrada.</p>
          {/if}
        </div>
      {/if}

    </div>
  </main>
</div>

<!-- ── CONFIRM DIALOG ──────────────────────────────────────── -->
<ConfirmDialog
  open={confirmOpen}
  message={confirmMessage}
  on:confirm={onConfirmed}
  on:cancel={onCancelled}
/>

<!-- ── MODAIS ───────────────────────────────────────────────── -->

<!-- Boletim -->
<Modal title={modalTitle} open={modalOpen && section==='boletins'} on:close={closeModal}>
  <label style={lbl}>Título *</label>
  <input bind:value={fBoletim.titulo} style={inp} placeholder="Título do boletim" />
  <label style={lbl}>Ordem</label>
  <input type="number" bind:value={fBoletim.ordem} style={inp} />
  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fBoletim.ativo} style="accent-color:#7b0000;" /> Ativo
  </label>
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('boletins')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Campanha -->
<Modal title={modalTitle} open={modalOpen && section==='campanha'} on:close={closeModal}>
  <label style={lbl}>Título *</label>
  <input bind:value={fCampanha.titulo} style={inp} placeholder="Título da campanha" />
  <label style={lbl}>Publica em</label>
  <input type="datetime-local" bind:value={fCampanha.publica_em} style={inp} />
  <label style={lbl}>Expira em</label>
  <input type="datetime-local" bind:value={fCampanha.expira_em} style={inp} />
  <label style={lbl}>Imagem (1568×876px)</label>

  <!-- Thumbnail imagem atual -->
  {#if fCampanha.previewUrl && !fCampanha.imagem}
    <div style="margin-bottom:12px;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;">
      <img src={fCampanha.previewUrl} alt="Preview atual" style="width:100%;height:140px;object-fit:cover;display:block;" />
      <p style="font-size:11px;color:#9ca3af;padding:5px 8px;margin:0;background:#f9fafb;">Imagem atual — selecione outra para substituir</p>
    </div>
  {/if}

  <!-- Preview nova imagem selecionada -->
  {#if fCampanha.imagem}
    <div style="margin-bottom:12px;border-radius:6px;overflow:hidden;border:2px solid #7b0000;">
      <img src={URL.createObjectURL(fCampanha.imagem)} alt="Nova imagem" style="width:100%;height:140px;object-fit:cover;display:block;" />
      <p style="font-size:11px;color:#7b0000;padding:5px 8px;margin:0;background:#fff5f5;font-weight:600;">Nova imagem selecionada</p>
    </div>
  {/if}

  <input type="file" accept="image/*" on:change={onImagemCampanhaChange}
    style="display:block;margin-bottom:6px;font-size:13px;" />
  {#if fCampanha.imagemErro}
    <p style="font-size:12px;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;margin-bottom:14px;">
      ⚠️ {fCampanha.imagemErro}
    </p>
  {:else}
    <div style="margin-bottom:14px;"></div>
  {/if}
  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fCampanha.ativo} style="accent-color:#7b0000;" /> Ativo
  </label>
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('campanha')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Destaque -->
<Modal title={modalTitle} open={modalOpen && section==='destaque'} on:close={closeModal}>
  <label style={lbl}>Título *</label>
  <input bind:value={fDestaque.titulo} style={inp} placeholder="Título do destaque" />
  <label style={lbl}>Publica em</label>
  <input type="datetime-local" bind:value={fDestaque.publica_em} style={inp} />
  <label style={lbl}>Expira em</label>
  <input type="datetime-local" bind:value={fDestaque.expira_em} style={inp} />
  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fDestaque.ativo} style="accent-color:#7b0000;" /> Ativo
  </label>
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('destaque')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Data Comemorativa -->
<Modal title={modalTitle} open={modalOpen && section==='calendario'} on:close={closeModal}>
  <label style={lbl}>Título *</label>
  <input bind:value={fData.titulo} style={inp} placeholder="Ex: Dia das Mães" />

  <label style={lbl}>Data *</label>
  <input type="date" bind:value={fData.data} style={inp} />

  <label style={lbl}>Descrição (opcional)</label>
  <textarea bind:value={fData.descricao}
    style="{inp}height:80px;resize:vertical;font-family:inherit;"
    placeholder="Mensagem exibida na notificação da TV…"></textarea>

  <label style={lbl}>Antecedência (dias antes para notificar)</label>
  <input type="number" min="0" max="365" bind:value={fData.antecedencia_dias} style={inp} />

  <label style={lbl}>Cor de destaque</label>
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
    <input type="color" bind:value={fData.cor}
      style="width:44px;height:36px;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;padding:2px;" />
    <span style="font-size:13px;color:#6b7280;">{fData.cor}</span>
  </div>

  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fData.ativo} style="accent-color:#7b0000;" /> Ativo
  </label>
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('calendario')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Usuário -->
<Modal title={modalTitle} open={modalOpen && section==='usuarios'} on:close={closeModal}>
  <label style={lbl}>Nome</label>
  <input bind:value={fUsuario.name} style={inp} placeholder="Nome completo" />
  <label style={lbl}>E-mail *</label>
  <input type="email" bind:value={fUsuario.email} style={inp} placeholder="email@exemplo.com" />
  <label style={lbl}>{editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
  <input type="password" bind:value={fUsuario.password} style={inp} placeholder="••••••••" />
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('usuarios')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Configurações -->
<Modal title={modalTitle} open={modalOpen && section==='configuracoes'} on:close={closeModal}>
  <label style={lbl}>Nome da empresa *</label>
  <input bind:value={fConfig.nome_empresa} style={inp} />

  <label style={lbl}>Cidade</label>
  <select bind:value={fConfig.cidade} style={inp}>
    <option value="">Selecione...</option>
    {#each cidades as c}<option value={c}>{c}</option>{/each}
  </select>

  <label style={lbl}>País</label>
  <select bind:value={fConfig.pais} style={inp}>
    <option value="">Selecione...</option>
    {#each paises as p}<option value={p}>{p}</option>{/each}
  </select>

  <label style={lbl}>Fuso horário</label>
  <select bind:value={fConfig.fuso_horario} style={inp}>
    <option value="">Selecione...</option>
    {#each fusos as f}<option value={f}>{f}</option>{/each}
  </select>

  <label style={lbl}>Weather API Key</label>
  <input bind:value={fConfig.weather_api_key} style={inp} placeholder="OpenWeatherMap key" />

  <label style={lbl}>Google API Key</label>
  <input bind:value={fConfig.google_api_key} style={inp} />

  <label style={lbl}>Google Calendar ID</label>
  <input bind:value={fConfig.google_calendar_id} style={inp} />

  <label style={lbl}>Mensagem de manutenção</label>
  <input bind:value={fConfig.mensagem_manutencao} style={inp} placeholder="Mensagem exibida em modo manutenção" />

  <label style={lbl}>Texto do ticker</label>
  <input bind:value={fConfig.ticker_texto} style={inp} placeholder="Texto exibido no rodapé" />

  <div style="display:flex;gap:20px;margin-bottom:20px;">
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;">
      <input type="checkbox" bind:checked={fConfig.modo_manutencao} style="accent-color:#7b0000;" /> Modo manutenção
    </label>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;">
      <input type="checkbox" bind:checked={fConfig.ticker_ativo} style="accent-color:#7b0000;" /> Ticker ativo
    </label>
  </div>

  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#f3f4f6;color:#374151;">Cancelar</button>
    <button on:click={() => save('configuracoes')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>
