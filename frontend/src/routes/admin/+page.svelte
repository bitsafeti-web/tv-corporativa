<script lang="ts">
  export let params: Record<string, string> = {};
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
  let usuarios:     any[] = [];
  let superAdmins:  any[] = [];
  let boletins:  any[] = [];
  let campanhas: any[] = [];
  let destaques: any[] = [];
  let datas:     any[] = [];
  let config:    any   = null;
  let loading = false;
  let isSuperuser = false;

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
  let fBoletim   = { titulo: '', ordem: 0, ativo: true, publica_em: '', expira_em: '' };
  let fCampanha  = { titulo: '', ativo: true, imagem: null as File | null, imagemAtual: '', imagemErro: '', publica_em: '', expira_em: '', previewUrl: '', collectionId: '', recordId: '' };
  let fDestaque  = { titulo: '', ativo: true, expira_em: '', publica_em: '' };
  let fUsuario     = { name: '', email: '', password: '', verified: true, emailVisibility: false, avatar: null as File | null };
  let fSuperAdmin  = { email: '', password: '' };
  let editingSuperAdmin = false;
  let showPwdSuperAdmin = false;
  let showPwdUsuario    = false;
  let showPwdSmtp       = false;
  let showPwdS3         = false;
  let showPwdBackupS3   = false;
  let fData = { titulo: '', data: '', descricao: '', ativo: true, antecedencia_dias: 7, cor: '#7b0000' };

  let fConfig    = {
    nome_empresa: '', cidade: '', pais: '', fuso_horario: '',
    weather_api_key: '', google_api_key: '', google_calendar_id: '',
    modo_manutencao: false, mensagem_manutencao: '',
    ticker_ativo: false, ticker_texto: '',
  };

  let pbSettings: any = null;
  let fPbSettings = {
    // meta
    appName: '', appURL: '', senderName: '', senderAddress: '', hideControls: false,
    // smtp
    smtpEnabled: false, smtpHost: '', smtpPort: 587,
    smtpUsername: '', smtpPassword: '', smtpTls: true, smtpAuthMethod: 'LOGIN', smtpLocalName: '',
    // s3 (armazenamento de arquivos)
    s3Enabled: false, s3Bucket: '', s3Region: '', s3Endpoint: '',
    s3AccessKey: '', s3Secret: '', s3ForcePathStyle: false,
    // backups
    backupCron: '', backupCronMaxKeep: 3,
    backupS3Enabled: false, backupS3Bucket: '', backupS3Region: '', backupS3Endpoint: '',
    backupS3AccessKey: '', backupS3Secret: '', backupS3ForcePathStyle: false,
    // logs
    logsMaxDays: 7, logsMinLevel: 0, logsLogIP: true,
    // batch
    batchEnabled: true, batchMaxRequests: 50, batchTimeout: 3, batchMaxBodySize: 0,
    // rate limits
    rateLimitsEnabled: false,
  };

  // selects de configurações
  const cidades = ["Alagoinhas","Americana","Anapolis","Aracaju","Arapiraca","Araraquara","Araras","Araucaria","Belem","Belo Horizonte","Boa Vista","Botucatu","Brasilia","Cachoeiro de Itapemirim","Campina Grande","Campinas","Campo Grande","Campo Largo","Caruaru","Cascavel","Caucaia","Caxias do Sul","Contagem","Criciuma","Cuiaba","Curitiba","Diadema","Duque de Caxias","Eunapolis","Feira de Santana","Florianopolis","Fortaleza","Foz do Iguacu","Franca","Goiania","Governador Valadares","Guarulhos","Ilheus","Imperatriz","Itabuna","Itajai","Itapetininga","Itaquaquecetuba","Joao Pessoa","Joinville","Juazeiro do Norte","Juiz de Fora","Jundiai","Londrina","Luziania","Macapa","Maceio","Manaus","Marilia","Maringa","Maua","Montes Claros","Mossoro","Natal","Niteroi","Nova Friburgo","Nova Iguacu","Novo Hamburgo","Olinda","Osasco","Palmas","Parauapebas","Passo Fundo","Paulista","Petropolis","Piracicaba","Porto Alegre","Porto Velho","Presidente Prudente","Recife","Ribeirao Preto","Rio Branco","Rio de Janeiro","Rondonopolis","Salvador","Santa Maria","Santarem","Santo Andre","Santos","Sao Bernardo do Campo","Sao Carlos","Sao Goncalo","Sao Jose do Rio Preto","Sao Jose dos Campos","Sao Luis","Sao Paulo","Sao Vicente","Sorocaba","Sumare","Taubate","Teresina","Uberaba","Uberlandia","Varzea Grande","Vitoria","Vitoria da Conquista","Amsterdam","Ankara","Athens","Auckland","Bangkok","Barcelona","Beijing","Berlin","Bogota","Brussels","Budapest","Buenos Aires","Cairo","Cape Town","Caracas","Chicago","Copenhagen","Delhi","Denver","Dubai","Dublin","Frankfurt","Guayaquil","Helsinki","Hong Kong","Houston","Istanbul","Jakarta","Jerusalem","Johannesburg","Kuala Lumpur","La Paz","Lagos","Lima","Lisbon","London","Los Angeles","Madrid","Manila","Melbourne","Mexico City","Miami","Milan","Montreal","Moscow","Mumbai","Munich","Nairobi","New York","Oslo","Ottawa","Panama City","Paramaribo","Paris","Prague","Quito","Rome","Santiago","Seattle","Seoul","Singapore","Stockholm","Sydney","Taipei","Tehran","Tel Aviv","Tokyo","Toronto","Vancouver","Vienna","Warsaw","Wellington","Zurich"];
  const paises = ["BR","AE","AR","AT","AU","BE","BO","CA","CH","CL","CN","CO","CZ","DE","DK","DZ","EC","EG","ES","FI","FR","GB","GR","GY","HU","ID","IL","IN","IT","JP","KR","MA","MX","MY","NG","NL","NO","NZ","PA","PE","PH","PL","PT","PY","RO","RU","SA","SE","SG","SR","TH","TR","TW","US","UY","VE","VN","ZA"];
  const fusos = ["America/Sao_Paulo","America/Araguaina","America/Bahia","America/Belem","America/Boa_Vista","America/Campo_Grande","America/Cuiaba","America/Fortaleza","America/Maceio","America/Manaus","America/Noronha","America/Porto_Velho","America/Recife","America/Rio_Branco","America/Santarem","America/Argentina/Buenos_Aires","America/Asuncion","America/Bogota","America/Caracas","America/Guayaquil","America/La_Paz","America/Lima","America/Montevideo","America/Paramaribo","America/Santiago","America/Anchorage","America/Chicago","America/Denver","America/Halifax","America/Los_Angeles","America/Mexico_City","America/Montreal","America/New_York","America/Phoenix","America/Toronto","America/Vancouver","Pacific/Honolulu","Europe/Amsterdam","Europe/Athens","Europe/Berlin","Europe/Brussels","Europe/Budapest","Europe/Copenhagen","Europe/Dublin","Europe/Helsinki","Europe/Istanbul","Europe/Lisbon","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Oslo","Europe/Paris","Europe/Prague","Europe/Rome","Europe/Stockholm","Europe/Vienna","Europe/Warsaw","Europe/Zurich","Asia/Bangkok","Asia/Delhi","Asia/Dubai","Asia/Hong_Kong","Asia/Jakarta","Asia/Jerusalem","Asia/Kolkata","Asia/Kuala_Lumpur","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Taipei","Asia/Tehran","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Pacific/Auckland","Africa/Cairo","Africa/Johannesburg","Africa/Lagos","Africa/Nairobi","UTC"];

  onMount(async () => {
    if (!pb.authStore.isValid) { goto('/'); return; }
    isSuperuser = (pb.authStore.model as any)?.collectionName === '_superusers';
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
      await ensureDatasComemorativas().catch(() => {});
      const [rUsers, rSuperAdmins, rBol, rCamp, rDest, rDatas, rCfg, rPbSettings] = await Promise.all([
        pb.collection('Usuarios').getList(1, 100, { sort: 'name' }).catch(() => ({ items: [] })),
        pb.collection('_superusers').getList(1, 100, { sort: 'email' }).catch((e) => { console.error('_superusers:', e); return { items: [] }; }),
        pb.collection('Boletins').getList(1, 100, { sort: 'ordem' }).catch(() => ({ items: [] })),
        pb.collection('Campanha').getList(1, 100, { sort: 'titulo' }).catch((e) => { console.error('campanha:', e); return { items: [] }; }),
        pb.collection('Destaque').getList(1, 100, { sort: 'titulo' }).catch((e) => { console.error('destaque:', e); return { items: [] }; }),
        pb.collection('DatasComemorativas').getFullList({ sort: 'data' }).catch(() => []),
        pb.collection('Configuracoes').getList(1, 1).catch(() => ({ items: [] })),
        pb.send('/api/settings', { method: 'GET' }).catch(() => null),
      ]);
      usuarios    = rUsers.items;
      superAdmins = rSuperAdmins.items;
      boletins  = rBol.items;
      campanhas = rCamp.items;
      destaques = rDest.items;
      datas     = rDatas as any[];
      config    = rCfg.items[0] ?? null;
      pbSettings = rPbSettings;
    } finally {
      loading = false;
    }
  }

  // ── helpers modal ──────────────────────────────────────────
  function openNew(sec: Section) {
    editingId = null;
    editingSuperAdmin = false;
    formError = '';
    if (sec === 'boletins')     fBoletim  = { titulo: '', ordem: boletins.length + 1, ativo: true, publica_em: '', expira_em: '' };
    if (sec === 'campanha')     fCampanha = { titulo: '', ativo: true, imagem: null, imagemAtual: '', imagemErro: '', publica_em: '', expira_em: '', previewUrl: '', collectionId: '', recordId: '' };
    if (sec === 'destaque')     fDestaque = { titulo: '', ativo: true, expira_em: '', publica_em: '' };
    if (sec === 'calendario')   fData     = { titulo: '', data: '', descricao: '', ativo: true, antecedencia_dias: 7, cor: '#7b0000' };
    if (sec === 'usuarios')     fUsuario  = { name: '', email: '', password: '', verified: true, emailVisibility: false, avatar: null };
    if (sec === 'configuracoes') loadConfigForm();
    modalTitle = `Novo — ${menu.find(m=>m.id===sec)?.label}`;
    modalOpen = true;
  }

  function openEditSuperAdmin(item: any) {
    editingId = item.id;
    editingSuperAdmin = true;
    formError = '';
    fSuperAdmin = { email: item.email, password: '' };
    modalTitle = 'Editar Administrador';
    modalOpen = true;
  }

  function openNewSuperAdmin() {
    editingId = null;
    editingSuperAdmin = true;
    formError = '';
    fSuperAdmin = { email: '', password: '' };
    modalTitle = 'Novo Administrador';
    modalOpen = true;
  }

  function openEdit(sec: Section, item: any) {
    editingSuperAdmin = false;
    editingId = item.id;
    formError = '';
    if (sec === 'boletins')     fBoletim  = { titulo: item.titulo, ordem: item.ordem ?? 0, ativo: item.ativo, publica_em: item.publica_em ? item.publica_em.slice(0,16) : '', expira_em: item.expira_em ? item.expira_em.slice(0,16) : '' };
    if (sec === 'campanha') {
      const filename = item.imagem_1568x876px ?? '';
      const colId    = item.collectionId ?? '';
      const recId    = item.id ?? '';
      const preview  = filename ? `${PB_URL}/api/files/${colId}/${recId}/${filename}` : '';
      fCampanha = { titulo: item.titulo, ativo: item.ativo, imagem: null, imagemAtual: filename, imagemErro: '', publica_em: item.publica_em ? item.publica_em.slice(0,16) : '', expira_em: item.expira_em ? item.expira_em.slice(0,16) : '', previewUrl: preview, collectionId: colId, recordId: recId };
    }
    if (sec === 'destaque')     fDestaque = { titulo: item.titulo, ativo: item.ativo, expira_em: item.expira_em ? item.expira_em.slice(0,16) : '', publica_em: item.publica_em ? item.publica_em.slice(0,16) : '' };
    if (sec === 'calendario')   fData     = { titulo: item.titulo, data: item.data ? item.data.slice(0,10) : '', descricao: item.descricao ?? '', ativo: item.ativo, antecedencia_dias: item.antecedencia_dias ?? 7, cor: item.cor || '#7b0000' };
    if (sec === 'usuarios')     fUsuario  = { name: item.name, email: item.email, password: '', verified: item.verified ?? true, emailVisibility: item.emailVisibility ?? false, avatar: null };
    if (sec === 'configuracoes') loadConfigForm();
    modalTitle = `Editar — ${menu.find(m=>m.id===sec)?.label}`;
    modalOpen = true;
  }

  function loadConfigForm() {
    if (config) {
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
    if (pbSettings) {
      fPbSettings = {
        // meta
        appName: pbSettings.meta?.appName ?? '',
        appURL: pbSettings.meta?.appURL ?? '',
        senderName: pbSettings.meta?.senderName ?? '',
        senderAddress: pbSettings.meta?.senderAddress ?? '',
        hideControls: pbSettings.meta?.hideControls ?? false,
        // smtp
        smtpEnabled: pbSettings.smtp?.enabled ?? false,
        smtpHost: pbSettings.smtp?.host ?? '',
        smtpPort: pbSettings.smtp?.port ?? 587,
        smtpUsername: pbSettings.smtp?.username ?? '',
        smtpPassword: pbSettings.smtp?.password ?? '',
        smtpTls: pbSettings.smtp?.tls ?? true,
        smtpAuthMethod: pbSettings.smtp?.authMethod ?? 'LOGIN',
        smtpLocalName: pbSettings.smtp?.localName ?? '',
        // s3
        s3Enabled: pbSettings.s3?.enabled ?? false,
        s3Bucket: pbSettings.s3?.bucket ?? '',
        s3Region: pbSettings.s3?.region ?? '',
        s3Endpoint: pbSettings.s3?.endpoint ?? '',
        s3AccessKey: pbSettings.s3?.accessKey ?? '',
        s3Secret: pbSettings.s3?.secret ?? '',
        s3ForcePathStyle: pbSettings.s3?.forcePathStyle ?? false,
        // backups
        backupCron: pbSettings.backups?.cron ?? '',
        backupCronMaxKeep: pbSettings.backups?.cronMaxKeep ?? 3,
        backupS3Enabled: pbSettings.backups?.s3?.enabled ?? false,
        backupS3Bucket: pbSettings.backups?.s3?.bucket ?? '',
        backupS3Region: pbSettings.backups?.s3?.region ?? '',
        backupS3Endpoint: pbSettings.backups?.s3?.endpoint ?? '',
        backupS3AccessKey: pbSettings.backups?.s3?.accessKey ?? '',
        backupS3Secret: pbSettings.backups?.s3?.secret ?? '',
        backupS3ForcePathStyle: pbSettings.backups?.s3?.forcePathStyle ?? false,
        // logs
        logsMaxDays: pbSettings.logs?.maxDays ?? 7,
        logsMinLevel: pbSettings.logs?.minLevel ?? 0,
        logsLogIP: pbSettings.logs?.logIP ?? true,
        // batch
        batchEnabled: pbSettings.batch?.enabled ?? true,
        batchMaxRequests: pbSettings.batch?.maxRequests ?? 50,
        batchTimeout: pbSettings.batch?.timeout ?? 3,
        batchMaxBodySize: pbSettings.batch?.maxBodySize ?? 0,
        // rate limits
        rateLimitsEnabled: pbSettings.rateLimits?.enabled ?? false,
      };
    }
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

  // Converte "2026-03-25T17:30" (datetime-local) para "2026-03-25 17:30:00.000Z" (PocketBase)
  function toDbDate(v: string): string | null {
    if (!v) return null;
    // datetime-local retorna horário local sem fuso — new Date() interpreta como local e converte para UTC
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().replace('T', ' ');
  }

  // ── save ──────────────────────────────────────────────────
  async function save(sec: Section) {
    saving = true;
    formError = '';
    try {
      if (editingSuperAdmin) {
        if (!fSuperAdmin.email.trim()) { formError = 'E-mail obrigatório.'; saving = false; return; }
        if (editingId) {
          const data: any = { email: fSuperAdmin.email };
          if (fSuperAdmin.password) { data.password = fSuperAdmin.password; data.passwordConfirm = fSuperAdmin.password; }
          await pb.collection('_superusers').update(editingId, data);
        } else {
          if (!fSuperAdmin.password.trim()) { formError = 'Senha obrigatória.'; saving = false; return; }
          await pb.collection('_superusers').create({ email: fSuperAdmin.email, password: fSuperAdmin.password, passwordConfirm: fSuperAdmin.password });
        }
        modalOpen = false;
        await loadAll();
        saving = false;
        return;
      }

      if (sec === 'boletins') {
        const data: any = { titulo: fBoletim.titulo, ordem: Number(fBoletim.ordem), ativo: fBoletim.ativo, publica_em: toDbDate(fBoletim.publica_em), expira_em: toDbDate(fBoletim.expira_em) };
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
          if (fCampanha.publica_em) fd.append('publica_em', toDbDate(fCampanha.publica_em)!);
          if (fCampanha.expira_em)  fd.append('expira_em',  toDbDate(fCampanha.expira_em)!);
          fd.append('imagem_1568x876px', fCampanha.imagem);
          editingId ? await pb.collection('Campanha').update(editingId, fd)
                    : await pb.collection('Campanha').create(fd);
        } else {
          // sem arquivo: usa objeto simples (booleanos nativos)
          const data: any = {
            titulo: fCampanha.titulo,
            ativo: fCampanha.ativo,
          };
          if (fCampanha.publica_em) data.publica_em = toDbDate(fCampanha.publica_em);
          if (fCampanha.expira_em)  data.expira_em  = toDbDate(fCampanha.expira_em);
          editingId ? await pb.collection('Campanha').update(editingId, data)
                    : await pb.collection('Campanha').create(data);
        }
      }

      else if (sec === 'destaque') {
        const data: any = { titulo: fDestaque.titulo, ativo: fDestaque.ativo };
        if (fDestaque.expira_em)  data.expira_em  = toDbDate(fDestaque.expira_em);
        if (fDestaque.publica_em) data.publica_em = toDbDate(fDestaque.publica_em);
        editingId ? await pb.collection('Destaque').update(editingId, data)
                  : await pb.collection('Destaque').create(data);
      }

      else if (sec === 'usuarios') {
        const fd = new FormData();
        fd.append('name', fUsuario.name);
        fd.append('email', fUsuario.email);
        fd.append('emailVisibility', String(fUsuario.emailVisibility));
        fd.append('verified', String(fUsuario.verified));
        if (fUsuario.avatar) { fd.append('avatar', fUsuario.avatar); }
        if (editingId) {
          if (fUsuario.password) { fd.append('password', fUsuario.password); fd.append('passwordConfirm', fUsuario.password); }
          await pb.collection('Usuarios').update(editingId, fd);
        } else {
          if (!fUsuario.password) { formError = 'Senha obrigatória.'; saving = false; return; }
          fd.append('password', fUsuario.password);
          fd.append('passwordConfirm', fUsuario.password);
          await pb.collection('Usuarios').create(fd);
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
        if (editingId) {
          await pb.collection('Configuracoes').update(editingId, data);
        } else {
          await pb.collection('Configuracoes').create(data);
        }
        // salva configurações do sistema PocketBase (só superusers)
        if (isSuperuser && pbSettings) {
          const pbUpdate: any = {
            meta: {
              appName: fPbSettings.appName,
              appURL: fPbSettings.appURL,
              senderName: fPbSettings.senderName,
              senderAddress: fPbSettings.senderAddress,
              hideControls: fPbSettings.hideControls,
            },
            smtp: {
              enabled: fPbSettings.smtpEnabled,
              host: fPbSettings.smtpHost,
              port: Number(fPbSettings.smtpPort),
              username: fPbSettings.smtpUsername,
              tls: fPbSettings.smtpTls,
              authMethod: fPbSettings.smtpAuthMethod,
              localName: fPbSettings.smtpLocalName,
            },
            s3: {
              enabled: fPbSettings.s3Enabled,
              bucket: fPbSettings.s3Bucket,
              region: fPbSettings.s3Region,
              endpoint: fPbSettings.s3Endpoint,
              accessKey: fPbSettings.s3AccessKey,
              forcePathStyle: fPbSettings.s3ForcePathStyle,
            },
            backups: {
              cron: fPbSettings.backupCron,
              cronMaxKeep: Number(fPbSettings.backupCronMaxKeep),
              s3: {
                enabled: fPbSettings.backupS3Enabled,
                bucket: fPbSettings.backupS3Bucket,
                region: fPbSettings.backupS3Region,
                endpoint: fPbSettings.backupS3Endpoint,
                accessKey: fPbSettings.backupS3AccessKey,
                forcePathStyle: fPbSettings.backupS3ForcePathStyle,
              },
            },
            logs: {
              maxDays: Number(fPbSettings.logsMaxDays),
              minLevel: Number(fPbSettings.logsMinLevel),
              logIP: fPbSettings.logsLogIP,
            },
            batch: {
              enabled: fPbSettings.batchEnabled,
              maxRequests: Number(fPbSettings.batchMaxRequests),
              timeout: Number(fPbSettings.batchTimeout),
              maxBodySize: Number(fPbSettings.batchMaxBodySize),
            },
            rateLimits: {
              enabled: fPbSettings.rateLimitsEnabled,
            },
          };
          // só envia senha/secret se preenchidos (evita apagar valores existentes)
          if (fPbSettings.smtpPassword) pbUpdate.smtp.password = fPbSettings.smtpPassword;
          if (fPbSettings.s3Secret) pbUpdate.s3.secret = fPbSettings.s3Secret;
          if (fPbSettings.backupS3Secret) pbUpdate.backups.s3.secret = fPbSettings.backupS3Secret;
          await pb.send('/api/settings', { method: 'PATCH', body: pbUpdate });
        }
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

  function logout() { pb.authStore.clear(); goto('/'); }

  // ── perfil do usuário logado ───────────────────────────────
  $: authModel = pb.authStore.model as any;
  $: userDisplayName = authModel?.name || authModel?.email?.split('@')[0] || '';
  $: userInitial = userDisplayName?.[0]?.toUpperCase() ?? '?';
  $: userName = userDisplayName ? userDisplayName.charAt(0).toUpperCase() + userDisplayName.slice(1) : '';

  // ── avisos do calendário ──────────────────────────────────
  let avisoOpen = false;

  $: datasProximas = (() => {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    return datas.filter(d => {
      if (!d.ativo || !d.data) return false;
      const data = new Date(d.data); data.setHours(0,0,0,0);
      const diff = Math.ceil((data.getTime() - hoje.getTime()) / 86_400_000);
      return diff >= 0 && diff <= (d.antecedencia_dias ?? 7);
    }).sort((a: any, b: any) => a.data.localeCompare(b.data));
  })();

  function diasRestantes(iso: string): number {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const d = new Date(iso); d.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - hoje.getTime()) / 86_400_000);
  }

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

  const adminOnly: Section[] = ['usuarios', 'configuracoes'];
  $: visibleMenu = isSuperuser ? menu : menu.filter(m => !adminOnly.includes(m.id));
  $: if (!isSuperuser && adminOnly.includes(section)) section = 'dashboard';

  // ── estilos de input reutilizáveis ────────────────────────
  const inp = 'display:block;width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;color:#111;margin-bottom:14px;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;';
  const btn = 'padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;';
</script>

<svelte:head><title>TV Corporativa — Painel</title></svelte:head>

<div style="display:flex;min-height:100vh;font-family:sans-serif;">

  <!-- SIDEBAR -->
  <aside style="width:220px;background:#7b0000;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;">
    <div style="padding:12px 20px 12px 23px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:flex-start;">
      <img src="/bitsafe-branco.png" alt="Bitsafe" style="height:68px;object-fit:contain;" />
    </div>
    <nav style="flex:1;padding:12px 0;overflow-y:auto;display:flex;flex-direction:column;">
      {#each visibleMenu as item}
        <button
          on:click={() => section = item.id}
          class="menu-item"
          class:menu-item--active={section===item.id}
          style="font-weight:{section===item.id?'600':'400'};"
        >
          <span class="menu-icon" class:menu-icon--active={section===item.id}>
            {@html icons[item.id]}
          </span>
          <span class:menu-label--active={section===item.id}>{item.label}</span>
        </button>
      {/each}
      <div style="flex:1;"></div>
      <div style="padding:8px 12px;">
        <a href="/tv" target="_blank" rel="noreferrer"
          style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:8px;background:rgba(255,255,255,0.15);border:none;border-radius:4px;color:rgba(255,255,255,0.9);font-size:12px;cursor:pointer;text-decoration:none;box-sizing:border-box;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
          Ver TV
        </a>
      </div>
    </nav>
    <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;padding:6px 4px;">
        <span style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:#fff;font-weight:600;">
          {userInitial}
        </span>
        <div style="flex:1;min-width:0;">
          <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            {userName}
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);">
            {isSuperuser ? 'Administrador' : 'Operador'}
          </p>
        </div>
      </div>
      <button on:click={logout}
        style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:8px;background:rgba(255,255,255,0.1);border:none;border-radius:4px;color:rgba(255,255,255,0.8);font-size:12px;cursor:pointer;">
        {@html icons.logout} Sair
      </button>
    </div>
  </aside>

  <!-- CONTEÚDO -->
  <main style="flex:1;background:#f4f4f5;overflow:auto;">
    <div style="background:#fff;border-bottom:1px solid #e5e7eb;padding:14px 28px;position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;">
      <h1 style="font-size:15px;font-weight:600;color:#111827;margin:0;">
        {menu.find(m=>m.id===section)?.label}
      </h1>

      <!-- Ícone de avisos do calendário -->
      <div style="position:relative;">
        <button
          on:click={() => avisoOpen = !avisoOpen}
          style="position:relative;background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;
            background:{avisoOpen ? '#f9fafb' : 'none'};display:flex;align-items:center;"
          title="Avisos do calendário"
        >
          {#if datasProximas.length > 0}
            <!-- anel de ping externo -->
            <span style="position:absolute;inset:0;border-radius:8px;
              background:rgba(123,0,0,0.12);animation:bell-ping 1.8s ease-in-out infinite;"></span>
          {/if}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke={datasProximas.length > 0 ? '#7b0000' : '#9ca3af'}
            stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
            style={datasProximas.length > 0 ? 'animation:bell-shake 1.8s ease-in-out infinite;' : ''}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {#if datasProximas.length > 0}
            <span style="position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:50%;
              background:#7b0000;border:2px solid #fff;animation:bell-ping-dot 1.8s ease-in-out infinite;"></span>
          {/if}
        </button>

        <!-- Popover -->
        {#if avisoOpen}
          <!-- fechar ao clicar fora -->
          <div on:click={() => avisoOpen = false}
            style="position:fixed;inset:0;z-index:49;"></div>

          <div style="position:absolute;right:0;top:calc(100% + 8px);width:320px;
            background:#fff;border-radius:10px;border:1px solid #e5e7eb;
            box-shadow:0 12px 40px rgba(0,0,0,0.12);z-index:50;overflow:hidden;">

            <!-- cabeçalho -->
            <div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:600;color:#111;">Avisos do calendário</span>
              {#if datasProximas.length > 0}
                <span style="font-size:11px;font-weight:600;background:#fff0f0;color:#7b0000;
                  padding:2px 8px;border-radius:99px;">{datasProximas.length} próxima{datasProximas.length > 1 ? 's' : ''}</span>
              {/if}
            </div>

            <!-- lista -->
            {#if datasProximas.length === 0}
              <div style="padding:28px 16px;text-align:center;">
                <p style="font-size:13px;color:#9ca3af;margin:0;">Nenhuma data comemorativa próxima.</p>
              </div>
            {:else}
              <div style="max-height:320px;overflow-y:auto;">
                {#each datasProximas as d}
                  {@const dias = diasRestantes(d.data)}
                  <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid #f9fafb;">
                    <span style="width:10px;height:10px;border-radius:50%;background:{d.cor||'#7b0000'};flex-shrink:0;"></span>
                    <div style="flex:1;min-width:0;">
                      <p style="margin:0;font-size:13px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{d.titulo}</p>
                      <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">
                        {new Date(d.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}
                      </p>
                    </div>
                    <span style="font-size:11px;font-weight:700;white-space:nowrap;
                      color:{dias === 0 ? '#7b0000' : dias <= 3 ? '#f97316' : '#6b7280'};">
                      {dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`}
                    </span>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- rodapé -->
            <div style="padding:10px 16px;border-top:1px solid #f3f4f6;">
              <button on:click={() => { section = 'calendario'; avisoOpen = false; }}
                style="font-size:12px;color:#7b0000;background:none;border:none;cursor:pointer;font-weight:500;padding:0;">
                Ver todos no calendário →
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div style="padding:28px;">

      <!-- DASHBOARD -->
      {#if section === 'dashboard'}

        <!-- Cards de contagem -->
        <div style="display:grid;grid-template-columns:repeat({isSuperuser ? 4 : 3},1fr);gap:16px;margin-bottom:28px;">
          {#each [
            {label:'Campanhas', value:campanhas.length, color:'#7c3aed', sec:'campanha', adminOnly: false,
              icon:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>'},
            {label:'Boletins',  value:boletins.length,  color:'#0369a1', sec:'boletins', adminOnly: false,
              icon:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>'},
            {label:'Destaques', value:destaques.length, color:'#f97316', sec:'destaque', adminOnly: false,
              icon:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'},
            {label:'Usuários',  value:usuarios.length,  color:'#7b0000', sec:'usuarios', adminOnly: true,
              icon:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},
          ].filter(c => isSuperuser || !c.adminOnly) as card}
            <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:20px;display:flex;flex-direction:column;gap:10px;">
              <p style="font-size:12px;color:#6b7280;margin:0;">{card.label}</p>
              <div style="display:flex;align-items:center;gap:10px;">
                <p style="font-size:28px;font-weight:700;color:{card.color};margin:0;line-height:1;">{card.value}</p>
                <span style="color:{card.color};opacity:.7;flex-shrink:0;">{@html card.icon}</span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Card Calendário — segundo card -->
        <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:28px;">
          <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:600;color:#374151;">Calendário de datas comemorativas</span>
            <button on:click={() => section = 'calendario'}
              style="font-size:12px;color:#7b0000;background:rgba(123,0,0,0.08);border:none;cursor:pointer;font-weight:600;padding:5px 12px;border-radius:8px;">
              Gerenciar →
            </button>
          </div>
          <div style="display:grid;grid-template-columns:420px 1fr;min-height:320px;">
            <div style="border-right:1px solid #f3f4f6;">
              <CalendarGrid {datas} showLegend={false} />
            </div>
            <div style="display:flex;flex-direction:column;">
              <!-- cabeçalho colunas -->
              <div style="display:grid;grid-template-columns:1fr 140px 100px 80px;background:#f9fafb;border-bottom:1px solid #f3f4f6;">
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 20px;border-right:1px solid #e5e7eb;">Título</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;border-right:1px solid #e5e7eb;text-align:center;">Data</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;border-right:1px solid #e5e7eb;text-align:center;">Aviso</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;text-align:center;">Status</span>
              </div>
              {#if datas.length === 0}
                <p style="padding:40px;text-align:center;color:#9ca3af;font-size:13px;">Nenhuma data cadastrada.</p>
              {:else}
                {#each datas.sort((a,b) => a.data.localeCompare(b.data)) as d}
                  <div style="display:grid;grid-template-columns:1fr 140px 100px 80px;align-items:center;border-bottom:1px solid #f9fafb;">
                    <div style="display:flex;align-items:center;gap:8px;min-width:0;padding:11px 20px;border-right:1px solid #f3f4f6;">
                      <span style="width:8px;height:8px;border-radius:50%;background:{d.cor||'#7b0000'};flex-shrink:0;"></span>
                      <span style="font-size:13px;font-weight:500;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{d.titulo}</span>
                    </div>
                    <span style="font-size:12px;color:#6b7280;padding:11px 16px;border-right:1px solid #f3f4f6;text-align:center;">
                      {d.data ? new Date(d.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'}
                    </span>
                    <span style="font-size:12px;color:#6b7280;padding:11px 16px;border-right:1px solid #f3f4f6;text-align:center;">{d.antecedencia_dias ?? 7}d antes</span>
                    <div style="padding:11px 16px;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;
                        background:{d.ativo?'#dcfce7':'#f1f5f9'};color:{d.ativo?'#16a34a':'#94a3b8'};">
                        {d.ativo?'Ativo':'Inativo'}
                      </span>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr;gap:20px;">
          {#each [
            {label:'Últimas campanhas', items:campanhas, sec:'campanha'},
            {label:'Últimos boletins',  items:boletins,  sec:'boletins'},
            {label:'Últimos destaques', items:destaques, sec:'destaque'},
          ] as bloco}
            <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
              <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:13px;font-weight:600;color:#374151;">{bloco.label}</span>
                <button on:click={() => section = bloco.sec}
                  style="font-size:12px;color:#7b0000;background:rgba(123,0,0,0.08);border:none;cursor:pointer;font-weight:600;padding:5px 12px;border-radius:8px;">
                  Gerenciar →
                </button>
              </div>
              <!-- cabeçalho colunas -->
              <div style="display:grid;grid-template-columns:1fr 140px 140px 80px;background:#f9fafb;border-bottom:1px solid #f3f4f6;">
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 20px;border-right:1px solid #e5e7eb;">Título</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;border-right:1px solid #e5e7eb;text-align:center;">Postagem</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;border-right:1px solid #e5e7eb;text-align:center;">Expiração</span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;text-align:center;">Status</span>
              </div>
              {#each bloco.items.slice(0,5) as it}
                <div style="display:grid;grid-template-columns:1fr 140px 140px 80px;align-items:center;border-bottom:1px solid #f9fafb;">
                  <span style="font-size:13px;font-weight:500;color:#1f2937;padding:11px 20px;border-right:1px solid #f3f4f6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{it.titulo}</span>
                  <span style="font-size:12px;color:#6b7280;padding:11px 16px;border-right:1px solid #f3f4f6;text-align:center;">
                    {it.created ? new Date(it.created.replace(' ','T')).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'}
                  </span>
                  <span style="font-size:12px;color:{it.expira_em ? '#ef4444' : '#9ca3af'};padding:11px 16px;border-right:1px solid #f3f4f6;text-align:center;">
                    {it.expira_em ? new Date(it.expira_em.replace(' ','T')).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'Sem expiração'}
                  </span>
                  <div style="padding:11px 16px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;
                      background:{it.ativo?'#dcfce7':'#f1f5f9'};color:{it.ativo?'#16a34a':'#94a3b8'};">
                      {it.ativo?'Ativo':'Inativo'}
                    </span>
                  </div>
                </div>
              {:else}
                <p style="padding:20px;color:#9ca3af;font-size:13px;margin:0;">Nenhum registro.</p>
              {/each}
            </div>
          {/each}
        </div>

      <!-- BOLETINS -->
      {:else if section === 'boletins'}
        <GenericTable {loading} items={boletins} dropdownActions
          cols={[{key:'titulo',label:'Título'},{key:'ordem',label:'Ordem'},{key:'publica_em',label:'Postagem'},{key:'expira_em',label:'Expiração'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('boletins')}
          on:edit={(e) => openEdit('boletins', e.detail)}
          on:toggle={(e) => handleToggle('Boletins', e)}
          on:delete={(e) => handleDelete('Boletins', e)}
          on:bulkDelete={(e) => handleBulkDelete('Boletins', e)}
        />

      <!-- CAMPANHA -->
      {:else if section === 'campanha'}
        <GenericTable {loading} items={campanhas} dropdownActions pbUrl={PB_URL}
          cols={[{key:'imagem_1568x876px',label:'Imagem',image:true},{key:'titulo',label:'Título'},{key:'publica_em',label:'Postagem'},{key:'expira_em',label:'Expiração'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('campanha')}
          on:edit={(e) => openEdit('campanha', e.detail)}
          on:toggle={(e) => handleToggle('Campanha', e)}
          on:delete={(e) => handleDelete('Campanha', e)}
          on:bulkDelete={(e) => handleBulkDelete('Campanha', e)}
        />

      <!-- DESTAQUE -->
      {:else if section === 'destaque'}
        <GenericTable {loading} items={destaques} dropdownActions
          cols={[{key:'titulo',label:'Título'},{key:'publica_em',label:'Postagem'},{key:'expira_em',label:'Expiração'},{key:'ativo',label:'Status',toggle:true}]}
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
          <GenericTable {loading} items={datas} dropdownActions
            cols={[{key:'titulo',label:'Título'},{key:'data',label:'Data'},{key:'antecedencia_dias',label:'Aviso (dias)'},{key:'ativo',label:'Status',toggle:true}]}
            on:new={() => openNew('calendario')}
            on:edit={(e) => openEdit('calendario', e.detail)}
            on:toggle={(e) => handleToggle('DatasComemorativas', e)}
            on:delete={(e) => handleDelete('DatasComemorativas', e)}
            on:bulkDelete={(e) => handleBulkDelete('DatasComemorativas', e)}
          />
        </div>

      <!-- USUÁRIOS (somente admin) -->
      {:else if section === 'usuarios' && isSuperuser}
        <!-- Administradores -->
        <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:20px;">
          <div style="padding:14px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:13px;font-weight:600;color:#374151;">Administradores</span>
              <span style="font-size:11px;font-weight:600;background:#fff0f0;color:#7b0000;padding:2px 8px;border-radius:99px;">{superAdmins.length}</span>
            </div>
            <button on:click={() => openNewSuperAdmin()}
              style="font-size:12px;background:rgba(123,0,0,0.08);color:#7b0000;padding:5px 14px;border-radius:8px;border:none;cursor:pointer;font-weight:600;">
              + Novo
            </button>
          </div>
          {#each superAdmins as admin}
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #f9fafb;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:32px;height:32px;border-radius:50%;background:#fff0f0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#7b0000;">
                  {admin.email?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111;">{admin.email}</p>
                  <p style="margin:0;font-size:11px;color:#9ca3af;">Administrador</p>
                </div>
              </div>
              <div style="display:flex;gap:8px;">
                <button on:click={() => openEditSuperAdmin(admin)}
                  style="font-size:12px;color:#7b0000;background:rgba(123,0,0,0.06);border:none;cursor:pointer;font-weight:600;padding:5px 12px;border-radius:6px;">
                  Editar
                </button>
                {#if admin.id !== authModel?.id}
                  <button on:click={() => askConfirm(`Excluir o administrador "${admin.email}"?`, async () => { await pb.collection('_superusers').delete(admin.id); await loadAll(); })}
                    style="font-size:12px;color:#ef4444;background:rgba(239,68,68,0.06);border:none;cursor:pointer;font-weight:600;padding:5px 12px;border-radius:6px;">
                    Excluir
                  </button>
                {/if}
              </div>
            </div>
          {/each}
          {#if superAdmins.length === 0}
            <p style="padding:20px;color:#9ca3af;font-size:13px;margin:0;">Nenhum administrador encontrado.</p>
          {/if}
        </div>

        <!-- Operadores -->
        <GenericTable {loading} items={usuarios} dropdownActions pbUrl={PB_URL}
          cols={[
            {key:'avatar', label:'', image:true},
            {key:'name',  label:'Nome'},
            {key:'email', label:'E-mail'},
            {key:'verified', label:'Verificado', toggle:true},
          ]}
          on:new={() => openNew('usuarios')}
          on:edit={(e) => openEdit('usuarios', e.detail)}
          on:toggle={(e) => handleToggle('Usuarios', e)}
          on:delete={(e) => handleDelete('Usuarios', e)}
          on:bulkDelete={(e) => handleBulkDelete('Usuarios', e)}
        />

      <!-- CONFIGURAÇÕES (somente admin) -->
      {:else if section === 'configuracoes' && isSuperuser}
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- Configurações da empresa -->
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
                  <span style="font-size:13px;color:#1f2937;word-break:break-all;">
                    {#if key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')}
                      {String(value) ? '••••••••' : '—'}
                    {:else}
                      {String(value) || '—'}
                    {/if}
                  </span>
                </div>
              {/each}
            {:else}
              <p style="padding:24px 20px;color:#9ca3af;font-size:13px;margin:0;">Nenhuma configuração cadastrada.</p>
            {/if}
          </div>

          <!-- Configurações do sistema PocketBase -->
          {#if pbSettings}
          <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:600;color:#374151;">Sistema PocketBase</span>
              <button on:click={() => openEdit('configuracoes', config ?? {})}
                style="font-size:12px;background:rgba(123,0,0,0.08);color:#7b0000;padding:6px 14px;border-radius:4px;border:none;cursor:pointer;">
                Editar
              </button>
            </div>

            <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
              <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">Nome da aplicação</span>
              <span style="font-size:13px;color:#1f2937;">{pbSettings.meta?.appName || '—'}</span>
            </div>
            <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
              <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">URL da aplicação</span>
              <span style="font-size:13px;color:#1f2937;">{pbSettings.meta?.appURL || '—'}</span>
            </div>
            <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
              <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">E-mail remetente</span>
              <span style="font-size:13px;color:#1f2937;">{pbSettings.meta?.senderName ? `${pbSettings.meta.senderName} <${pbSettings.meta.senderAddress}>` : (pbSettings.meta?.senderAddress || '—')}</span>
            </div>
            <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
              <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">SMTP</span>
              <span style="font-size:13px;">
                {#if pbSettings.smtp?.enabled}
                  <span style="color:#16a34a;font-weight:600;">Ativo</span>
                  <span style="color:#6b7280;font-size:12px;margin-left:8px;">{pbSettings.smtp?.host}:{pbSettings.smtp?.port}</span>
                {:else}
                  <span style="color:#9ca3af;">Desativado</span>
                {/if}
              </span>
            </div>
            <div style="padding:11px 20px;border-bottom:1px solid #f9fafb;display:flex;gap:16px;">
              <span style="font-size:12px;color:#6b7280;width:220px;flex-shrink:0;">Retenção de logs</span>
              <span style="font-size:13px;color:#1f2937;">{pbSettings.logs?.maxDays ?? '—'} dias</span>
            </div>
          </div>
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
  <label style={lbl}>Publica em</label>
  <input type="datetime-local" bind:value={fBoletim.publica_em} style={inp} />
  <label style={lbl}>Expira em</label>
  <input type="datetime-local" bind:value={fBoletim.expira_em} style={inp} />
  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fBoletim.ativo} style="accent-color:#7b0000;" /> Ativo
  </label>
  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('boletins')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
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
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('campanha')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
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
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('destaque')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
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
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('calendario')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Usuário -->
<!-- Modal superadmin -->
<Modal title={modalTitle} open={modalOpen && editingSuperAdmin} on:close={closeModal}>
  <div style="display:flex;align-items:center;gap:10px;background:#fff0f0;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:18px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span style="font-size:12px;color:#7b0000;font-weight:500;">Conta de administrador — acesso total ao sistema</span>
  </div>

  <label style={lbl}>E-mail *</label>
  <input type="email" bind:value={fSuperAdmin.email} style={inp} placeholder="email@exemplo.com" />

  <label style={lbl}>Nova senha (deixe em branco para manter)</label>
  <div style="position:relative;margin-bottom:12px;">
    {#if showPwdSuperAdmin}<input type="text"     bind:value={fSuperAdmin.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />{:else}<input type="password" bind:value={fSuperAdmin.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />{/if}
    <button type="button" on:click={() => showPwdSuperAdmin = !showPwdSuperAdmin} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;line-height:1;" tabindex="-1">
      {#if showPwdSuperAdmin}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
    </button>
  </div>

  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('usuarios')} disabled={saving} style="{btn}background:#7b0000;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- Modal operador -->
<Modal title={modalTitle} open={modalOpen && section==='usuarios' && !editingSuperAdmin} on:close={closeModal}>
  <label style={lbl}>Nome</label>
  <input bind:value={fUsuario.name} style={inp} placeholder="Nome completo" />

  <label style={lbl}>E-mail *</label>
  <input type="email" bind:value={fUsuario.email} style={inp} placeholder="email@exemplo.com" />

  <label style={lbl}>{editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
  <div style="position:relative;margin-bottom:12px;">
    {#if showPwdUsuario}<input type="text"     bind:value={fUsuario.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />{:else}<input type="password" bind:value={fUsuario.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />{/if}
    <button type="button" on:click={() => showPwdUsuario = !showPwdUsuario} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;line-height:1;" tabindex="-1">
      {#if showPwdUsuario}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
    </button>
  </div>

  <label style={lbl}>Foto de perfil (avatar)</label>
  <input type="file" accept="image/*" on:change={(e) => { fUsuario.avatar = e.currentTarget.files?.[0] ?? null; }} style={inp} />

  <div style="display:flex;gap:20px;margin-bottom:16px;">
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;">
      <input type="checkbox" bind:checked={fUsuario.verified} style="accent-color:#7b0000;" />
      Conta verificada
    </label>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;">
      <input type="checkbox" bind:checked={fUsuario.emailVisibility} style="accent-color:#7b0000;" />
      E-mail visível
    </label>
  </div>

  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('usuarios')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
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

  {#if pbSettings}
  <!-- ── Aplicação ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;">Aplicação (PocketBase)</p>
    <label style={lbl}>Nome da aplicação</label>
    <input bind:value={fPbSettings.appName} style={inp} />
    <label style={lbl}>URL da aplicação</label>
    <input bind:value={fPbSettings.appURL} style={inp} placeholder="https://seu-dominio.com" />
    <label style={lbl}>Nome do remetente (e-mail)</label>
    <input bind:value={fPbSettings.senderName} style={inp} />
    <label style={lbl}>E-mail do remetente</label>
    <input bind:value={fPbSettings.senderAddress} style={inp} placeholder="noreply@empresa.com" />
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.hideControls} style="accent-color:#7b0000;" /> Ocultar controles de UI do PocketBase
    </label>
  </div>

  <!-- ── SMTP ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0;">SMTP (envio de e-mails)</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.smtpEnabled} style="accent-color:#7b0000;" /> Ativado
      </label>
    </div>
    <label style={lbl}>Host</label>
    <input bind:value={fPbSettings.smtpHost} style={inp} placeholder="smtp.gmail.com" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style={lbl}>Porta</label>
        <input type="number" bind:value={fPbSettings.smtpPort} style={inp} />
      </div>
      <div>
        <label style={lbl}>Método de autenticação</label>
        <select bind:value={fPbSettings.smtpAuthMethod} style={inp}>
          <option value="LOGIN">LOGIN</option>
          <option value="PLAIN">PLAIN</option>
        </select>
      </div>
    </div>
    <label style={lbl}>Usuário</label>
    <input bind:value={fPbSettings.smtpUsername} style={inp} />
    <label style={lbl}>Senha</label>
    <div style="position:relative;margin-bottom:12px;">
      {#if showPwdSmtp}<input type="text"     bind:value={fPbSettings.smtpPassword} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{:else}<input type="password" bind:value={fPbSettings.smtpPassword} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{/if}
      <button type="button" on:click={() => showPwdSmtp = !showPwdSmtp} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;line-height:1;" tabindex="-1">
        {#if showPwdSmtp}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
      </button>
    </div>
    <label style={lbl}>Nome local (EHLO/HELO)</label>
    <input bind:value={fPbSettings.smtpLocalName} style={inp} placeholder="opcional" />
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.smtpTls} style="accent-color:#7b0000;" /> TLS
    </label>
  </div>

  <!-- ── S3 (Armazenamento de arquivos) ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0;">Armazenamento de arquivos (S3)</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.s3Enabled} style="accent-color:#7b0000;" /> Usar S3
      </label>
    </div>
    {#if fPbSettings.s3Enabled}
    <label style={lbl}>Bucket</label>
    <input bind:value={fPbSettings.s3Bucket} style={inp} />
    <label style={lbl}>Região</label>
    <input bind:value={fPbSettings.s3Region} style={inp} placeholder="us-east-1" />
    <label style={lbl}>Endpoint</label>
    <input bind:value={fPbSettings.s3Endpoint} style={inp} placeholder="https://s3.amazonaws.com" />
    <label style={lbl}>Access Key</label>
    <input bind:value={fPbSettings.s3AccessKey} style={inp} />
    <label style={lbl}>Secret</label>
    <div style="position:relative;margin-bottom:12px;">
      {#if showPwdS3}<input type="text"     bind:value={fPbSettings.s3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{:else}<input type="password" bind:value={fPbSettings.s3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{/if}
      <button type="button" on:click={() => showPwdS3 = !showPwdS3} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;line-height:1;" tabindex="-1">
        {#if showPwdS3}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
      </button>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.s3ForcePathStyle} style="accent-color:#7b0000;" /> Force path style
    </label>
    {/if}
  </div>

  <!-- ── Backups ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;">Backups</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style={lbl}>Cron de backup</label>
        <input bind:value={fPbSettings.backupCron} style={inp} placeholder="0 0 * * *" />
      </div>
      <div>
        <label style={lbl}>Máx. backups retidos</label>
        <input type="number" bind:value={fPbSettings.backupCronMaxKeep} style={inp} min="1" />
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <span style="font-size:12px;color:#6b7280;">Armazenar backups no S3</span>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.backupS3Enabled} style="accent-color:#7b0000;" /> Ativado
      </label>
    </div>
    {#if fPbSettings.backupS3Enabled}
    <label style={lbl}>Bucket (backup)</label>
    <input bind:value={fPbSettings.backupS3Bucket} style={inp} />
    <label style={lbl}>Região (backup)</label>
    <input bind:value={fPbSettings.backupS3Region} style={inp} />
    <label style={lbl}>Endpoint (backup)</label>
    <input bind:value={fPbSettings.backupS3Endpoint} style={inp} />
    <label style={lbl}>Access Key (backup)</label>
    <input bind:value={fPbSettings.backupS3AccessKey} style={inp} />
    <label style={lbl}>Secret (backup)</label>
    <div style="position:relative;margin-bottom:12px;">
      {#if showPwdBackupS3}<input type="text"     bind:value={fPbSettings.backupS3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{:else}<input type="password" bind:value={fPbSettings.backupS3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />{/if}
      <button type="button" on:click={() => showPwdBackupS3 = !showPwdBackupS3} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;line-height:1;" tabindex="-1">
        {#if showPwdBackupS3}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
      </button>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.backupS3ForcePathStyle} style="accent-color:#7b0000;" /> Force path style
    </label>
    {/if}
  </div>

  <!-- ── Logs ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;">Logs</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style={lbl}>Retenção (dias)</label>
        <input type="number" bind:value={fPbSettings.logsMaxDays} style={inp} min="1" max="365" />
      </div>
      <div>
        <label style={lbl}>Nível mínimo</label>
        <select bind:value={fPbSettings.logsMinLevel} style={inp}>
          <option value={0}>DEBUG (0)</option>
          <option value={4}>INFO (4)</option>
          <option value={8}>WARN (8)</option>
          <option value={12}>ERROR (12)</option>
        </select>
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.logsLogIP} style="accent-color:#7b0000;" /> Registrar IP nos logs
    </label>
  </div>

  <!-- ── Batch ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0;">Requisições em lote (Batch)</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.batchEnabled} style="accent-color:#7b0000;" /> Ativado
      </label>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style={lbl}>Máx. requisições</label>
        <input type="number" bind:value={fPbSettings.batchMaxRequests} style={inp} min="1" />
      </div>
      <div>
        <label style={lbl}>Timeout (s)</label>
        <input type="number" bind:value={fPbSettings.batchTimeout} style={inp} min="0" />
      </div>
      <div>
        <label style={lbl}>Tamanho máx. body (bytes)</label>
        <input type="number" bind:value={fPbSettings.batchMaxBodySize} style={inp} min="0" />
      </div>
    </div>
  </div>

  <!-- ── Rate Limits ── -->
  <div style="border-top:1px solid #f3f4f6;margin:4px 0 14px;padding-top:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin:0;">Limite de requisições (Rate Limits)</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.rateLimitsEnabled} style="accent-color:#7b0000;" /> Ativado
      </label>
    </div>
    <p style="font-size:11px;color:#9ca3af;margin:0;">Para gerenciar regras específicas de rate limit, acesse o painel do PocketBase em <code>/_/</code></p>
  </div>
  {/if}

  {#if formError}<p style="color:#ef4444;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:rgba(107,114,128,0.08);color:#374151;">Cancelar</button>
    <button on:click={() => save('configuracoes')} disabled={saving} style="{btn}background:rgba(123,0,0,0.08);color:#7b0000;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>



<style>
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 20px;
    border: none;
    border-left: 3px solid transparent;
    background: transparent;
    color: #fff;
    font-size: 13px;
    text-align: left;
    box-sizing: border-box;
    cursor: pointer;
    transition: background 0.15s;
  }
  .menu-item:hover {
    background: rgba(255,255,255,0.08);
  }
  .menu-item--active {
    background: rgba(255,255,255,0.15);
    border-left-color: #fff;
  }
  .menu-item--active:hover {
    background: rgba(255,255,255,0.18);
  }
  .menu-icon {
    display: flex;
    align-items: center;
    width: 18px;
    flex-shrink: 0;
    opacity: 0.65;
  }
  .menu-icon--active { opacity: 1; }
  .menu-label--active { opacity: 1 !important; }
</style>
