<script lang="ts">
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
  import GenericTable from './GenericTable.svelte';
  import Modal from './Modal.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  const PB_URL = PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

  type Section = 'dashboard' | 'usuarios' | 'campanha' | 'configuracoes';
  let section: Section = 'dashboard';

  let usuarios:     any[] = [];
  let superAdmins:  any[] = [];
  let campanhas: any[] = [];
  let config:    any   = null;
  let loading = false;
  let isSuperuser = false;

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

  let modalOpen = false;
  let modalTitle = '';
  let editingId: string | null = null;
  let saving = false;
  let formError = '';
  const noAutoCancel = { requestKey: null };

  let fCampanha  = {
    titulo: '', ativo: true,
    imagem: null as File | null, imagemAtual: '', previewUrl: '',
    video: null as File | null, videoAtual: '',
    publica_em: '', expira_em: '',
    collectionId: '', recordId: ''
  };
  const CAMPANHA_IMAGE_WIDTH = 1920;
  const CAMPANHA_IMAGE_HEIGHT = 1080;
  let campanhaImagemError = '';
  let campanhaImagemInfo = '';
  const CAMPANHA_VIDEO_WIDTH = 1920;
  const CAMPANHA_VIDEO_HEIGHT = 1080;
  const CAMPANHA_VIDEO_MAX_SIZE_MB = 200;
  let campanhaVideoError = '';
  let campanhaVideoInfo = '';
  let fUsuario     = { name: '', email: '', password: '', verified: true, emailVisibility: false, avatar: null as File | null };
  let fSuperAdmin  = { email: '', password: '' };
  let editingSuperAdmin = false;
  let showPwdSuperAdmin = false;
  let showPwdUsuario    = false;
  let showPwdSmtp       = false;
  let testEmailAddr     = '';
  let testEmailLoading  = false;
  let testEmailMsg      = '';
  let testEmailErr      = '';

  async function sendTestEmail() {
    if (!testEmailAddr || !testEmailAddr.includes('@')) { testEmailErr = 'Digite um e-mail válido.'; return; }
    testEmailLoading = true; testEmailMsg = ''; testEmailErr = '';
    try {
      await pb.send('/api/settings/test/email', {
        method: 'POST',
        body: { template: 'verification', email: testEmailAddr }
      });
      testEmailMsg = `E-mail de teste enviado para ${testEmailAddr}!`;
    } catch (err: any) {
      testEmailErr = err?.response?.message || err?.message || 'Erro ao enviar.';
    } finally {
      testEmailLoading = false;
    }
  }

  type TplKey = 'verificationTemplate' | 'resetPasswordTemplate' | 'confirmEmailChangeTemplate';
  const tplLabels: Record<TplKey, string> = {
    verificationTemplate:       'Verificação de e-mail',
    resetPasswordTemplate:      'Redefinição de senha',
    confirmEmailChangeTemplate: 'Confirmação de troca de e-mail',
  };
  let tplKey:     TplKey  = 'resetPasswordTemplate';
  let tplSubject: string  = '';
  let tplBody:    string  = '';
  let tplLoading: boolean = false;
  let tplMsg:     string  = '';
  let tplErr:     string  = '';
  let tplPreview: boolean = false;

  async function loadTemplate() {
    tplLoading = true; tplMsg = ''; tplErr = '';
    try {
      const col = await pb.send('/api/collections/Usuarios', { method: 'GET' });
      tplSubject = col[tplKey]?.subject ?? '';
      tplBody    = col[tplKey]?.body    ?? '';
    } catch (err: any) {
      tplErr = err?.response?.message || 'Erro ao carregar template.';
    } finally { tplLoading = false; }
  }

  async function saveTemplate() {
    tplLoading = true; tplMsg = ''; tplErr = '';
    try {
      const patch: any = {};
      patch[tplKey] = { subject: tplSubject, body: tplBody };
      const cols = await pb.send('/api/collections', { method: 'GET' });
      const authCols = (cols?.items ?? []).filter((c: any) => c.type === 'auth');
      for (const c of authCols) {
        await pb.send(`/api/collections/${c.id}`, { method: 'PATCH', body: patch });
      }
      tplMsg = 'Template salvo com sucesso!';
    } catch (err: any) {
      tplErr = err?.response?.message || 'Erro ao salvar template.';
    } finally { tplLoading = false; }
  }

  const tplEntries = Object.entries(tplLabels) as [TplKey, string][];
  function setTplKey(k: string) { tplKey = k as TplKey; }
  $: if (isSuperuser && tplKey) loadTemplate();

  let showPwdS3         = false;
  let showPwdBackupS3   = false;

  let fConfig    = {
    nome_empresa: '',
    modo_manutencao: false,
    mensagem_manutencao: '',
  };

  let pbSettings: any = null;
  let fPbSettings = {
    appName: '', appURL: '', senderName: '', senderAddress: '', hideControls: false,
    smtpEnabled: false, smtpHost: '', smtpPort: 587,
    smtpUsername: '', smtpPassword: '', smtpTls: true, smtpAuthMethod: 'LOGIN', smtpLocalName: '',
    s3Enabled: false, s3Bucket: '', s3Region: '', s3Endpoint: '',
    s3AccessKey: '', s3Secret: '', s3ForcePathStyle: false,
    backupCron: '', backupCronMaxKeep: 3,
    backupS3Enabled: false, backupS3Bucket: '', backupS3Region: '', backupS3Endpoint: '',
    backupS3AccessKey: '', backupS3Secret: '', backupS3ForcePathStyle: false,
    logsMaxDays: 7, logsMinLevel: 0, logsLogIP: true,
    batchEnabled: true, batchMaxRequests: 50, batchTimeout: 3, batchMaxBodySize: 0,
    rateLimitsEnabled: false,
  };


  onMount(async () => {
    if (!pb.authStore.isValid) { goto('/'); return; }
    isSuperuser = (pb.authStore.model as any)?.collectionName === '_superusers';
    await loadAll();
  });

  async function loadAll() {
    loading = true;
    try {
      const [rUsers, rSuperAdmins, rCamp, rCfg, rPbSettings] = await Promise.all([
        pb.collection('Usuarios').getList(1, 100, { sort: 'name' }).catch(() => ({ items: [] })),
        isSuperuser
          ? pb.collection('_superusers').getList(1, 100, { sort: 'email' }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
        pb.collection('Campanha').getList(1, 100, { sort: 'titulo' }).catch(() => ({ items: [] })),
        pb.collection('Configuracoes').getList(1, 1).catch(() => ({ items: [] })),
        isSuperuser ? pb.send('/api/settings', { method: 'GET' }).catch(() => null) : Promise.resolve(null),
      ]);
      usuarios    = rUsers.items;
      superAdmins = rSuperAdmins.items;
      campanhas = rCamp.items;
      config    = rCfg.items[0] ?? null;
      pbSettings = rPbSettings;
    } finally {
      loading = false;
    }
  }

  function openNew(sec: Section) {
    editingId = null;
    editingSuperAdmin = false;
    formError = '';
    if (sec === 'campanha') {
      fCampanha = { titulo: '', ativo: true, imagem: null, imagemAtual: '', previewUrl: '', video: null, videoAtual: '', publica_em: '', expira_em: '', collectionId: '', recordId: '' };
      campanhaImagemError = '';
      campanhaImagemInfo = '';
      campanhaVideoError = '';
      campanhaVideoInfo = '';
    }
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
    if (sec === 'campanha') {
      campanhaImagemError = '';
      campanhaImagemInfo = '';
      campanhaVideoError = '';
      campanhaVideoInfo = '';
      const colId   = item.collectionId ?? '';
      const recId   = item.id ?? '';
      const imgName = item.imagem_1568x876px ?? '';
      const vidName = item.video ?? '';
      const preview = imgName ? `${PB_URL}/api/files/${colId}/${recId}/${imgName}` : '';
      fCampanha = {
        titulo: item.titulo, ativo: item.ativo,
        imagem: null, imagemAtual: imgName, previewUrl: preview,
        video: null, videoAtual: vidName,
        publica_em: item.publica_em ? item.publica_em.slice(0,16) : '',
        expira_em: item.expira_em ? item.expira_em.slice(0,16) : '',
        collectionId: colId, recordId: recId
      };
    }
    if (sec === 'usuarios') {
      fUsuario = { name: item.name, email: item.email, password: '', verified: item.verified ?? true, emailVisibility: item.emailVisibility ?? false, avatar: null };
    }
    if (sec === 'configuracoes') loadConfigForm();
    modalTitle = `Editar — ${menu.find(m=>m.id===sec)?.label}`;
    modalOpen = true;
  }

  function loadConfigForm() {
    if (config) {
      fConfig = {
        nome_empresa: config.nome_empresa ?? '',
        modo_manutencao: config.modo_manutencao ?? false,
        mensagem_manutencao: config.mensagem_manutencao ?? '',
      };
      editingId = config.id;
    }
    if (pbSettings) {
      fPbSettings = {
        appName: pbSettings.meta?.appName ?? '',
        appURL: pbSettings.meta?.appURL ?? '',
        senderName: pbSettings.meta?.senderName ?? '',
        senderAddress: pbSettings.meta?.senderAddress ?? '',
        hideControls: pbSettings.meta?.hideControls ?? false,
        smtpEnabled: pbSettings.smtp?.enabled ?? false,
        smtpHost: pbSettings.smtp?.host ?? '',
        smtpPort: pbSettings.smtp?.port ?? 587,
        smtpUsername: pbSettings.smtp?.username ?? '',
        smtpPassword: pbSettings.smtp?.password ?? '',
        smtpTls: pbSettings.smtp?.tls ?? true,
        smtpAuthMethod: pbSettings.smtp?.authMethod ?? 'LOGIN',
        smtpLocalName: pbSettings.smtp?.localName ?? '',
        s3Enabled: pbSettings.s3?.enabled ?? false,
        s3Bucket: pbSettings.s3?.bucket ?? '',
        s3Region: pbSettings.s3?.region ?? '',
        s3Endpoint: pbSettings.s3?.endpoint ?? '',
        s3AccessKey: pbSettings.s3?.accessKey ?? '',
        s3Secret: pbSettings.s3?.secret ?? '',
        s3ForcePathStyle: pbSettings.s3?.forcePathStyle ?? false,
        backupCron: pbSettings.backups?.cron ?? '',
        backupCronMaxKeep: pbSettings.backups?.cronMaxKeep ?? 3,
        backupS3Enabled: pbSettings.backups?.s3?.enabled ?? false,
        backupS3Bucket: pbSettings.backups?.s3?.bucket ?? '',
        backupS3Region: pbSettings.backups?.s3?.region ?? '',
        backupS3Endpoint: pbSettings.backups?.s3?.endpoint ?? '',
        backupS3AccessKey: pbSettings.backups?.s3?.accessKey ?? '',
        backupS3Secret: pbSettings.backups?.s3?.secret ?? '',
        backupS3ForcePathStyle: pbSettings.backups?.s3?.forcePathStyle ?? false,
        logsMaxDays: pbSettings.logs?.maxDays ?? 7,
        logsMinLevel: pbSettings.logs?.minLevel ?? 0,
        logsLogIP: pbSettings.logs?.logIP ?? true,
        batchEnabled: pbSettings.batch?.enabled ?? true,
        batchMaxRequests: pbSettings.batch?.maxRequests ?? 50,
        batchTimeout: pbSettings.batch?.timeout ?? 3,
        batchMaxBodySize: pbSettings.batch?.maxBodySize ?? 0,
        rateLimitsEnabled: pbSettings.rateLimits?.enabled ?? false,
      };
    }
  }

  function closeModal() { modalOpen = false; }

  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Imagem inválida.'));
      };
      img.src = url;
    });
  }

  async function validateCampanhaImage(file: File): Promise<boolean> {
    const { width, height } = await getImageDimensions(file);
    const valid = width === CAMPANHA_IMAGE_WIDTH && height === CAMPANHA_IMAGE_HEIGHT;
    if (!valid) {
      campanhaImagemInfo = '';
      campanhaImagemError = `Imagem com ${width} x ${height} px. Use exatamente ${CAMPANHA_IMAGE_WIDTH} x ${CAMPANHA_IMAGE_HEIGHT} px para preencher a tela corretamente.`;
      return false;
    }
    campanhaImagemError = '';
    campanhaImagemInfo = `Dimensão validada: ${width} x ${height} px.`;
    return true;
  }

  async function handleCampanhaImageChange(event: Event) {
    const inputEl = event.currentTarget as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    fCampanha.imagem = null;
    campanhaImagemError = '';
    campanhaImagemInfo = '';

    if (!file) return;

    try {
      if (await validateCampanhaImage(file)) {
        fCampanha.imagem = file;
      } else {
        inputEl.value = '';
      }
    } catch {
      campanhaImagemError = `Não foi possível ler a imagem. Envie um arquivo válido com ${CAMPANHA_IMAGE_WIDTH} x ${CAMPANHA_IMAGE_HEIGHT} px.`;
      inputEl.value = '';
    }
  }

  function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        const width = videoEl.videoWidth;
        const height = videoEl.videoHeight;
        URL.revokeObjectURL(url);
        resolve({ width, height });
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Vídeo inválido.'));
      };
      videoEl.src = url;
    });
  }

  async function validateCampanhaVideo(file: File): Promise<boolean> {
    const maxBytes = CAMPANHA_VIDEO_MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      campanhaVideoInfo = '';
      campanhaVideoError = `Vídeo com ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é ${CAMPANHA_VIDEO_MAX_SIZE_MB} MB.`;
      return false;
    }

    const { width, height } = await getVideoDimensions(file);
    const valid = width === CAMPANHA_VIDEO_WIDTH && height === CAMPANHA_VIDEO_HEIGHT;
    if (!valid) {
      campanhaVideoInfo = '';
      campanhaVideoError = `Vídeo com ${width} x ${height} px. Use exatamente ${CAMPANHA_VIDEO_WIDTH} x ${CAMPANHA_VIDEO_HEIGHT} px para preencher a tela sem barras pretas.`;
      return false;
    }
    campanhaVideoError = '';
    campanhaVideoInfo = `Dimensão validada: ${width} x ${height} px.`;
    return true;
  }

  async function handleCampanhaVideoChange(event: Event) {
    const inputEl = event.currentTarget as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    fCampanha.video = null;
    campanhaVideoError = '';
    campanhaVideoInfo = '';

    if (!file) return;

    try {
      if (await validateCampanhaVideo(file)) {
        fCampanha.video = file;
      } else {
        inputEl.value = '';
      }
    } catch {
      campanhaVideoError = `Não foi possível ler o vídeo. Envie um arquivo válido com ${CAMPANHA_VIDEO_WIDTH} x ${CAMPANHA_VIDEO_HEIGHT} px.`;
      inputEl.value = '';
    }
  }

  function toDbDate(v: string): string | null {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().replace('T', ' ');
  }

  function compactPocketBaseError(err: any): string {
    const response = err?.response ?? err?.data;
    const fieldErrors = response?.data;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const messages = Object.entries(fieldErrors)
        .map(([field, value]: [string, any]) => {
          const msg = value?.message || value?.code || JSON.stringify(value);
          return `${field}: ${msg}`;
        })
        .filter(Boolean);
      if (messages.length) return messages.join(' | ');
    }
    if (err?.status === 413) return 'Arquivo muito grande. Verifique o limite de upload do servidor.';
    if (response?.message) return response.message;
    if (err?.isAbort || err?.status === 0) return 'A requisição foi interrompida. Recarregue e tente novamente.';
    return err?.message || 'Erro ao salvar.';
  }

  function parsePbDate(value: unknown): Date | null {
    if (!value) return null;
    const normalized = String(value).replace(' ', 'T');
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
  }

  function isExpired(item: any): boolean {
    const date = parsePbDate(item.expira_em);
    return !!date && date < new Date();
  }

  function formatDate(value: unknown): string {
    const date = parsePbDate(value);
    return date
      ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—';
  }

  function dateTime(item: any): number {
    return parsePbDate(item.publica_em || item.created)?.getTime() ?? 0;
  }

  function dashboardItems(items: any[]): any[] {
    return [...items].sort((a, b) => dateTime(b) - dateTime(a)).slice(0, 5);
  }

  async function save(sec: Section) {
    if (saving) return;
    saving = true;
    formError = '';
    try {
      if (editingSuperAdmin) {
        if (!fSuperAdmin.email.trim()) { formError = 'E-mail obrigatório.'; saving = false; return; }
        if (editingId) {
          const data: any = { email: fSuperAdmin.email };
          if (fSuperAdmin.password) { data.password = fSuperAdmin.password; data.passwordConfirm = fSuperAdmin.password; }
          await pb.collection('_superusers').update(editingId, data, noAutoCancel);
        } else {
          if (!fSuperAdmin.password.trim()) { formError = 'Senha obrigatória.'; saving = false; return; }
          await pb.collection('_superusers').create({ email: fSuperAdmin.email, password: fSuperAdmin.password, passwordConfirm: fSuperAdmin.password }, noAutoCancel);
        }
        modalOpen = false;
        await loadAll();
        saving = false;
        return;
      }

      if (sec === 'campanha') {
        if (!fCampanha.titulo.trim()) { formError = 'Título é obrigatório.'; saving = false; return; }

        if (fCampanha.imagem) {
          try {
            if (!(await validateCampanhaImage(fCampanha.imagem))) { saving = false; return; }
          } catch {
            campanhaImagemError = `Não foi possível validar a imagem. Envie um arquivo válido com ${CAMPANHA_IMAGE_WIDTH} x ${CAMPANHA_IMAGE_HEIGHT} px.`;
            saving = false;
            return;
          }
        }

        if (fCampanha.video) {
          try {
            if (!(await validateCampanhaVideo(fCampanha.video))) { saving = false; return; }
          } catch {
            campanhaVideoError = `Não foi possível validar o vídeo. Envie um arquivo válido com ${CAMPANHA_VIDEO_WIDTH} x ${CAMPANHA_VIDEO_HEIGHT} px.`;
            saving = false;
            return;
          }
        }

        const fd = new FormData();
        fd.append('titulo', fCampanha.titulo);
        fd.append('ativo', fCampanha.ativo ? 'true' : 'false');
        if (fCampanha.publica_em) fd.append('publica_em', toDbDate(fCampanha.publica_em)!);
        if (fCampanha.expira_em)  fd.append('expira_em',  toDbDate(fCampanha.expira_em)!);
        if (fCampanha.imagem) fd.append('imagem_1568x876px', fCampanha.imagem);
        if (fCampanha.video)  fd.append('video', fCampanha.video);

        editingId ? await pb.collection('Campanha').update(editingId, fd, noAutoCancel)
                  : await pb.collection('Campanha').create(fd, noAutoCancel);
      }

      else if (sec === 'usuarios') {
        const fd = new FormData();
        fd.append('name', fUsuario.name);
        fd.append('email', fUsuario.email);
        fd.append('emailVisibility', String(fUsuario.emailVisibility));
        fd.append('verified', String(fUsuario.verified));
        if (fUsuario.avatar) fd.append('avatar', fUsuario.avatar);
        if (editingId) {
          if (fUsuario.password) { fd.append('password', fUsuario.password); fd.append('passwordConfirm', fUsuario.password); }
          await pb.collection('Usuarios').update(editingId, fd, noAutoCancel);
        } else {
          if (!fUsuario.password) { formError = 'Senha obrigatória.'; saving = false; return; }
          fd.append('password', fUsuario.password);
          fd.append('passwordConfirm', fUsuario.password);
          await pb.collection('Usuarios').create(fd, noAutoCancel);
        }
      }

      else if (sec === 'configuracoes') {
        if (editingId) {
          await pb.collection('Configuracoes').update(editingId, { ...fConfig }, noAutoCancel);
        } else {
          await pb.collection('Configuracoes').create({ ...fConfig }, noAutoCancel);
        }
        // Salva configurações do sistema PocketBase de forma independente —
        // falha aqui não deve bloquear o save principal (Configuracoes já foi salvo acima)
        if (isSuperuser && pbSettings) {
          const pbUpdate: any = {
            meta: { appName: fPbSettings.appName, appURL: fPbSettings.appURL, senderName: fPbSettings.senderName, senderAddress: fPbSettings.senderAddress, hideControls: fPbSettings.hideControls },
            smtp: { enabled: fPbSettings.smtpEnabled, host: fPbSettings.smtpHost, port: Number(fPbSettings.smtpPort), username: fPbSettings.smtpUsername, tls: fPbSettings.smtpTls, authMethod: fPbSettings.smtpAuthMethod, localName: fPbSettings.smtpLocalName },
            s3: { enabled: fPbSettings.s3Enabled, bucket: fPbSettings.s3Bucket, region: fPbSettings.s3Region, endpoint: fPbSettings.s3Endpoint, accessKey: fPbSettings.s3AccessKey, forcePathStyle: fPbSettings.s3ForcePathStyle },
            backups: { cron: fPbSettings.backupCron, cronMaxKeep: Number(fPbSettings.backupCronMaxKeep), s3: { enabled: fPbSettings.backupS3Enabled, bucket: fPbSettings.backupS3Bucket, region: fPbSettings.backupS3Region, endpoint: fPbSettings.backupS3Endpoint, accessKey: fPbSettings.backupS3AccessKey, forcePathStyle: fPbSettings.backupS3ForcePathStyle } },
            logs: { maxDays: Number(fPbSettings.logsMaxDays), minLevel: Number(fPbSettings.logsMinLevel), logIP: fPbSettings.logsLogIP },
            batch: { enabled: fPbSettings.batchEnabled, maxRequests: Number(fPbSettings.batchMaxRequests), timeout: Number(fPbSettings.batchTimeout), maxBodySize: Number(fPbSettings.batchMaxBodySize) },
            rateLimits: { enabled: fPbSettings.rateLimitsEnabled },
          };
          if (fPbSettings.smtpPassword) pbUpdate.smtp.password = fPbSettings.smtpPassword;
          if (fPbSettings.s3Secret) pbUpdate.s3.secret = fPbSettings.s3Secret;
          if (fPbSettings.backupS3Secret) pbUpdate.backups.s3.secret = fPbSettings.backupS3Secret;
          pb.send('/api/settings', { method: 'PATCH', body: pbUpdate }).catch((pbErr) => {
            console.warn('[admin] /api/settings PATCH falhou (não-bloqueante):', pbErr);
          });
        }
      }

      modalOpen = false;
      await loadAll();
    } catch (e: any) {
      formError = compactPocketBaseError(e);
    } finally {
      saving = false;
    }
  }

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
      `Deseja excluir ${ids.length} registro(s)? Esta ação não pode ser desfeita.`,
      async () => { await Promise.all(ids.map(id => pb.collection(collection).delete(id))); await loadAll(); }
    );
  }

  function logout() { pb.authStore.clear(); goto('/'); }

  $: authModel = pb.authStore.model as any;
  $: userDisplayName = authModel?.name || authModel?.email?.split('@')[0] || '';
  $: userInitial = userDisplayName?.[0]?.toUpperCase() ?? '?';
  $: userName = userDisplayName ? userDisplayName.charAt(0).toUpperCase() + userDisplayName.slice(1) : '';

  const ICON = {
    dashboard:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    campanha:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
    usuarios:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    configuracoes:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    logout:       `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    tv:           `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
    image:        `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    video:        `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  };

  const menu: { id: Section; label: string }[] = [
    { id: 'dashboard',    label: 'Dashboard'    },
    { id: 'campanha',     label: 'Campanhas'    },
    { id: 'usuarios',     label: 'Usuários'     },
    { id: 'configuracoes',label: 'Configurações'},
  ];

  const adminOnly: Section[] = ['usuarios', 'configuracoes'];
  $: visibleMenu = isSuperuser ? menu : menu.filter(m => !adminOnly.includes(m.id));
  $: if (!isSuperuser && adminOnly.includes(section)) section = 'dashboard';

  const inp = 'display:block;width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #E6E8EA;border-radius:8px;font-size:13px;color:#1E2026;margin-bottom:14px;background:#fff;outline:none;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:#1E2026;margin-bottom:5px;';
  const btn = 'padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;';

  function mediaTipo(item: any): 'video' | 'imagem' | 'vazio' {
    if (item.video) return 'video';
    if (item.imagem_1568x876px) return 'imagem';
    return 'vazio';
  }
</script>

<svelte:head><title>TV Corporativa — Painel</title></svelte:head>

<div style="display:flex;min-height:100vh;font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <!-- SIDEBAR -->
  <aside style="width:224px;background:#fff;border-right:1px solid #E6E8EA;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;">
    <div style="padding:16px 20px;border-bottom:1px solid #E6E8EA;display:flex;justify-content:flex-start;">
      <img src="/bitgroup.png" alt="Grupo Bit" style="height:64px;object-fit:contain;" />
    </div>

    <nav style="flex:1;padding:8px 0;overflow-y:auto;display:flex;flex-direction:column;">
      {#each visibleMenu as item}
        <button
          on:click={() => section = item.id}
          class="menu-item"
          class:menu-item--active={section === item.id}
        >
          <span class="menu-icon" class:menu-icon--active={section === item.id}>
            {@html ICON[item.id]}
          </span>
          <span>{item.label}</span>
        </button>
      {/each}

      <div style="flex:1;"></div>

      <div style="padding:8px 12px;">
        <a href="/tv" target="_blank" rel="noreferrer" class="sidebar-link">
          {@html ICON.tv} Ver TV ao vivo
        </a>
      </div>
    </nav>

    <div style="padding:14px 16px;border-top:1px solid #E6E8EA;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:10px;padding:4px;">
        <span style="width:30px;height:30px;border-radius:50%;background:#FEE8E8;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:#BD2124;font-weight:700;">
          {userInitial}
        </span>
        <div style="flex:1;min-width:0;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#1E2026;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{userName}</p>
          <p style="margin:0;font-size:10px;color:#848E9C;">{isSuperuser ? 'Administrador' : 'Operador'}</p>
        </div>
      </div>
      <button on:click={logout} class="sidebar-link" style="justify-content:center;">
        {@html ICON.logout} Sair
      </button>
    </div>
  </aside>

  <!-- CONTEÚDO PRINCIPAL -->
  <main style="flex:1;background:#FAFAFB;overflow:auto;">

    <!-- Topbar -->
    <div style="background:#fff;border-bottom:1px solid #E6E8EA;padding:0 28px;position:sticky;top:0;z-index:10;height:56px;display:flex;align-items:center;">
      <h1 style="font-size:15px;font-weight:600;color:#1E2026;margin:0;">
        {menu.find(m=>m.id===section)?.label ?? ''}
      </h1>
    </div>

    <div style="padding:28px;">

      <!-- ══ DASHBOARD ══════════════════════════════════════════════════ -->
      {#if section === 'dashboard'}

        <div style="display:grid;grid-template-columns:repeat({isSuperuser ? 2 : 1},1fr);gap:16px;margin-bottom:28px;">
          {#each [
            { label: 'Campanhas ativas', value: campanhas.filter(c => c.ativo && !isExpired(c)).length, total: campanhas.length, color: '#BD2124', sec: 'campanha', adminOnly: false,
              icon: ICON.campanha },
            { label: 'Usuários', value: usuarios.length, total: usuarios.length, color: '#32313A', sec: 'usuarios', adminOnly: true,
              icon: ICON.usuarios },
          ].filter(c => isSuperuser || !c.adminOnly) as card}
            <button class="stat-card" on:click={() => section = card.sec as Section}>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <span style="font-size:11px;font-weight:600;color:#848E9C;text-transform:uppercase;letter-spacing:.06em;">{card.label}</span>
                <span style="color:{card.color};opacity:.7;">{@html card.icon}</span>
              </div>
              <p style="font-size:32px;font-weight:700;color:{card.color};margin:0;line-height:1;">{card.value}</p>
              {#if card.total !== card.value}
                <p style="font-size:11px;color:#848E9C;margin:4px 0 0;">{card.total} no total</p>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Últimas campanhas -->
        <div class="data-card" style="margin-bottom:20px;">
          <div class="card-header">
            <span>Campanhas recentes</span>
            <button on:click={() => section = 'campanha'} class="btn-ghost-red">Gerenciar →</button>
          </div>
          <div class="table-head" style="grid-template-columns:40px 1fr 100px 130px 130px 80px;">
            <span></span>
            <span>Título</span>
            <span style="text-align:center;">Tipo</span>
            <span style="text-align:center;">Postagem</span>
            <span style="text-align:center;">Expiração</span>
            <span style="text-align:center;">Status</span>
          </div>
          {#each dashboardItems(campanhas) as it}
            <div class="table-row" style="grid-template-columns:40px 1fr 100px 130px 130px 80px;">
              <!-- Thumbnail -->
              <div style="display:flex;align-items:center;justify-content:center;">
                {#if it.imagem_1568x876px}
                  <img src="{PB_URL}/api/files/{it.collectionId}/{it.id}/{it.imagem_1568x876px}"
                    alt="" style="width:32px;height:20px;object-fit:cover;border-radius:3px;display:block;" />
                {:else if it.video}
                  <div style="width:32px;height:20px;background:#1e293b;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                    {@html ICON.video}
                  </div>
                {:else}
                  <div style="width:32px;height:20px;background:#f1f5f9;border-radius:3px;"></div>
                {/if}
              </div>
              <span class="cell-main">{it.titulo}</span>
              <div style="display:flex;align-items:center;justify-content:center;">
                {#if mediaTipo(it) === 'video'}
                  <span class="badge-blue">Vídeo</span>
                {:else if mediaTipo(it) === 'imagem'}
                  <span class="badge-gray">Imagem</span>
                {:else}
                  <span class="badge-gray" style="opacity:.5;">—</span>
                {/if}
              </div>
              <span class="cell-meta" style="text-align:center;">{it.publica_em ? formatDate(it.publica_em) : formatDate(it.created)}</span>
              <span class="cell-meta" style="text-align:center;color:{it.expira_em ? '#BD2124' : '#848E9C'};">{it.expira_em ? formatDate(it.expira_em) : 'Sem expiração'}</span>
              <div style="display:flex;justify-content:center;">
                {#if isExpired(it)}
                  <span class="badge-gray" style="background:#fee2e2;color:#dc2626;">Expirado</span>
                {:else}
                  <span class={it.ativo ? 'badge-green' : 'badge-gray'}>{it.ativo ? 'Ativo' : 'Inativo'}</span>
                {/if}
              </div>
            </div>
          {:else}
            <p class="empty-msg">Nenhuma campanha cadastrada.</p>
          {/each}
        </div>


      <!-- ══ CAMPANHA ════════════════════════════════════════════════════ -->
      {:else if section === 'campanha'}
        <!-- Cards de tipo de mídia -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
          {#each [
            { label: 'Campanhas com imagem', value: campanhas.filter(c => c.imagem_1568x876px && !c.video).length, color: '#1E2026' },
            { label: 'Campanhas com vídeo',  value: campanhas.filter(c => c.video).length, color: '#32313A' },
            { label: 'Ativas agora',          value: campanhas.filter(c => c.ativo && !isExpired(c)).length, color: '#0ECB81' },
          ] as m}
            <div style="background:#fff;border:1px solid #E6E8EA;border-radius:10px;padding:16px;">
              <p style="font-size:11px;font-weight:600;color:#848E9C;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px;">{m.label}</p>
              <p style="font-size:26px;font-weight:700;color:{m.color};margin:0;">{m.value}</p>
            </div>
          {/each}
        </div>

        <GenericTable {loading} items={campanhas} dropdownActions pbUrl={PB_URL}
          cols={[{key:'imagem_1568x876px',label:'Preview',image:true},{key:'titulo',label:'Título'},{key:'publica_em',label:'Postagem'},{key:'expira_em',label:'Expiração'},{key:'ativo',label:'Status',toggle:true}]}
          on:new={() => openNew('campanha')}
          on:edit={(e) => openEdit('campanha', e.detail)}
          on:toggle={(e) => handleToggle('Campanha', e)}
          on:delete={(e) => handleDelete('Campanha', e)}
          on:bulkDelete={(e) => handleBulkDelete('Campanha', e)}
        />

      <!-- ══ USUÁRIOS ════════════════════════════════════════════════════ -->
      {:else if section === 'usuarios' && isSuperuser}
        <!-- Administradores -->
        <div class="data-card" style="margin-bottom:20px;">
          <div class="card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span>Administradores</span>
              <span class="badge-red">{superAdmins.length}</span>
            </div>
            <button on:click={openNewSuperAdmin} class="btn-ghost-red">+ Novo</button>
          </div>
          {#each superAdmins as admin}
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #FAFAFB;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:34px;height:34px;border-radius:50%;background:#FEE8E8;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#BD2124;">
                  {admin.email?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#1E2026;">{admin.email}</p>
                  <p style="margin:0;font-size:11px;color:#848E9C;">Acesso total ao sistema</p>
                </div>
              </div>
              <div style="display:flex;gap:8px;">
                <button on:click={() => openEditSuperAdmin(admin)}
                  style="font-size:12px;color:#32313A;background:#FAFAFB;border:1px solid #E6E8EA;cursor:pointer;font-weight:500;padding:5px 12px;border-radius:6px;">
                  Editar
                </button>
                {#if admin.id !== authModel?.id}
                  <button on:click={() => askConfirm(`Excluir "${admin.email}"?`, async () => { await pb.collection('_superusers').delete(admin.id); await loadAll(); })}
                    style="font-size:12px;color:#BD2124;background:#FEE8E8;border:1px solid #FEE8E8;cursor:pointer;font-weight:500;padding:5px 12px;border-radius:6px;">
                    Excluir
                  </button>
                {/if}
              </div>
            </div>
          {/each}
          {#if superAdmins.length === 0}
            <p class="empty-msg">Nenhum administrador encontrado.</p>
          {/if}
        </div>

        <!-- Operadores -->
        <GenericTable {loading} items={usuarios} dropdownActions pbUrl={PB_URL}
          cols={[{key:'avatar',label:'',image:true},{key:'name',label:'Nome'},{key:'email',label:'E-mail'},{key:'verified',label:'Verificado',toggle:true}]}
          on:new={() => openNew('usuarios')}
          on:edit={(e) => openEdit('usuarios', e.detail)}
          on:toggle={(e) => handleToggle('Usuarios', e)}
          on:delete={(e) => handleDelete('Usuarios', e)}
          on:bulkDelete={(e) => handleBulkDelete('Usuarios', e)}
        />

      <!-- ══ CONFIGURAÇÕES ═══════════════════════════════════════════════ -->
      {:else if section === 'configuracoes' && isSuperuser}
        <div style="display:flex;flex-direction:column;gap:16px;">

          <div class="data-card">
            <div class="card-header">
              <span>Configurações da empresa</span>
              <button on:click={() => openEdit('configuracoes', config ?? {})}
                style="font-size:12px;background:#BD2124;color:#fff;padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:500;">
                {config ? 'Editar' : 'Criar'}
              </button>
            </div>
            {#if config}
              {#each Object.entries(config).filter(([k])=>!['id','collectionId','collectionName','created','updated'].includes(k)) as [key, value]}
                <div style="padding:11px 20px;border-bottom:1px solid #FAFAFB;display:flex;gap:16px;">
                  <span style="font-size:12px;color:#848E9C;width:220px;flex-shrink:0;">{key}</span>
                  <span style="font-size:13px;color:#1E2026;word-break:break-all;">
                    {#if key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')}
                      {String(value) ? '••••••••' : '—'}
                    {:else}
                      {String(value) || '—'}
                    {/if}
                  </span>
                </div>
              {/each}
            {:else}
              <p class="empty-msg">Nenhuma configuração cadastrada.</p>
            {/if}
          </div>

          {#if pbSettings}
          <div class="data-card">
            <div class="card-header">
              <span>Sistema PocketBase</span>
              <button on:click={() => openEdit('configuracoes', config ?? {})}
                style="font-size:12px;color:#BD2124;background:rgba(189,33,36,0.08);padding:6px 14px;border-radius:6px;border:none;cursor:pointer;">
                Editar
              </button>
            </div>
            {#each [
              ['Nome da aplicação', pbSettings.meta?.appName],
              ['URL da aplicação', pbSettings.meta?.appURL],
              ['SMTP', pbSettings.smtp?.enabled ? `Ativo — ${pbSettings.smtp.host}:${pbSettings.smtp.port}` : 'Desativado'],
              ['Retenção de logs', `${pbSettings.logs?.maxDays ?? '—'} dias`],
            ] as [label, val]}
              <div style="padding:11px 20px;border-bottom:1px solid #FAFAFB;display:flex;gap:16px;">
                <span style="font-size:12px;color:#848E9C;width:220px;flex-shrink:0;">{label}</span>
                <span style="font-size:13px;color:#1E2026;">{val || '—'}</span>
              </div>
            {/each}
          </div>
          {/if}

        </div>
      {/if}

    </div>
  </main>
</div>

<!-- ── CONFIRM ─────────────────────────────────────────────────────── -->
<ConfirmDialog open={confirmOpen} message={confirmMessage} on:confirm={onConfirmed} on:cancel={onCancelled} />


<!-- ── MODAL: CAMPANHA ─────────────────────────────────────────────── -->
<Modal title={modalTitle} open={modalOpen && section==='campanha'} on:close={closeModal}>
  <label style={lbl}>Título *</label>
  <input bind:value={fCampanha.titulo} style={inp} placeholder="Título da campanha" />

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div>
      <label style={lbl}>Publica em</label>
      <input type="datetime-local" bind:value={fCampanha.publica_em} style={inp} />
    </div>
    <div>
      <label style={lbl}>Expira em</label>
      <input type="datetime-local" bind:value={fCampanha.expira_em} style={inp} />
    </div>
  </div>

  <!-- IMAGEM -->
  <div style="background:#FAFAFB;border:1px solid #E6E8EA;border-radius:10px;padding:14px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
      <span style="color:#1E2026;">{@html ICON.image}</span>
      <span style="font-size:12px;font-weight:700;color:#1E2026;">Imagem</span>
      {#if fCampanha.videoAtual && !fCampanha.video}
        <span style="font-size:10px;color:#848E9C;margin-left:4px;">(vídeo tem prioridade)</span>
      {/if}
    </div>

    <p style="font-size:12px;color:#32313A;margin:0 0 10px;line-height:1.45;">
      Dimensão obrigatória: <strong>{CAMPANHA_IMAGE_WIDTH} x {CAMPANHA_IMAGE_HEIGHT} px</strong> (Full HD 16:9). O cadastro só prossegue com uma imagem exatamente nesse tamanho.
    </p>

    {#if fCampanha.previewUrl && !fCampanha.imagem}
      <div style="margin-bottom:10px;border-radius:6px;overflow:hidden;border:1px solid #E6E8EA;">
        <img src={fCampanha.previewUrl} alt="Preview" style="width:100%;height:120px;object-fit:cover;display:block;" />
        <p style="font-size:11px;color:#848E9C;padding:4px 8px;margin:0;background:#FAFAFB;">Imagem atual — selecione outra para substituir</p>
      </div>
    {/if}
    {#if fCampanha.imagem}
      <div style="margin-bottom:10px;border-radius:6px;overflow:hidden;border:2px solid #BD2124;">
        <img src={URL.createObjectURL(fCampanha.imagem)} alt="Nova imagem" style="width:100%;height:120px;object-fit:cover;display:block;" />
        <p style="font-size:11px;color:#BD2124;padding:4px 8px;margin:0;background:#FFF1F1;font-weight:600;">Nova imagem selecionada</p>
      </div>
    {/if}
    <input type="file" accept="image/*"
      on:change={handleCampanhaImageChange}
      style="display:block;font-size:13px;color:#32313A;" />
    {#if campanhaImagemError}
      <p style="font-size:12px;color:#BD2124;margin:8px 0 0;font-weight:600;line-height:1.4;">{campanhaImagemError}</p>
    {:else if campanhaImagemInfo}
      <p style="font-size:12px;color:#15803d;margin:8px 0 0;font-weight:600;line-height:1.4;">{campanhaImagemInfo}</p>
    {/if}
  </div>

  <!-- DIVISOR -->
  <div style="display:flex;align-items:center;gap:10px;margin:4px 0 12px;">
    <div style="flex:1;height:1px;background:#E6E8EA;"></div>
    <span style="font-size:11px;font-weight:600;color:#848E9C;text-transform:uppercase;letter-spacing:.08em;">ou</span>
    <div style="flex:1;height:1px;background:#E6E8EA;"></div>
  </div>

  <!-- VÍDEO -->
  <div style="background:#FAFAFB;border:1px solid #E6E8EA;border-radius:10px;padding:14px;margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
      <span style="color:#32313A;">{@html ICON.video}</span>
      <span style="font-size:12px;font-weight:700;color:#32313A;">Vídeo</span>
      <span style="font-size:10px;color:#848E9C;margin-left:4px;">(tem prioridade sobre imagem)</span>
    </div>

    <p style="font-size:12px;color:#32313A;margin:0 0 10px;line-height:1.45;">
      Dimensão obrigatória: <strong>{CAMPANHA_VIDEO_WIDTH} x {CAMPANHA_VIDEO_HEIGHT} px</strong> (Full HD 16:9) — enquadramento completo, sem barras pretas.
      Tamanho máximo: <strong>{CAMPANHA_VIDEO_MAX_SIZE_MB} MB</strong>. O cadastro só prossegue com um vídeo exatamente nessa dimensão.
    </p>

    {#if fCampanha.videoAtual && !fCampanha.video}
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #E6E8EA;border-radius:6px;margin-bottom:10px;">
        <span style="color:#32313A;">{@html ICON.video}</span>
        <span style="font-size:12px;color:#32313A;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{fCampanha.videoAtual}</span>
        <a href="{PB_URL}/api/files/{fCampanha.collectionId}/{fCampanha.recordId}/{fCampanha.videoAtual}"
          target="_blank" rel="noreferrer"
          style="font-size:11px;color:#32313A;white-space:nowrap;font-weight:600;">Visualizar</a>
      </div>
    {/if}
    {#if fCampanha.video}
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:2px solid #32313A;border-radius:6px;margin-bottom:10px;">
        <span style="color:#32313A;">{@html ICON.video}</span>
        <span style="font-size:12px;color:#32313A;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{fCampanha.video.name}</span>
        <span style="font-size:11px;color:#848E9C;">{(fCampanha.video.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>
    {/if}
    <input type="file" accept="video/mp4,video/webm,video/quicktime"
      on:change={handleCampanhaVideoChange}
      style="display:block;font-size:13px;color:#32313A;" />
    {#if campanhaVideoError}
      <p style="font-size:12px;color:#BD2124;margin:8px 0 0;font-weight:600;line-height:1.4;">{campanhaVideoError}</p>
    {:else if campanhaVideoInfo}
      <p style="font-size:12px;color:#15803d;margin:8px 0 0;font-weight:600;line-height:1.4;">{campanhaVideoInfo}</p>
    {/if}
    <p style="font-size:11px;color:#848E9C;margin:6px 0 0;">Formatos: MP4, WebM, MOV. O vídeo avança automaticamente para a próxima campanha ao terminar.</p>
  </div>

  <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#32313A;margin-bottom:20px;cursor:pointer;">
    <input type="checkbox" bind:checked={fCampanha.ativo} style="accent-color:#BD2124;" /> Campanha ativa
  </label>

  {#if formError}<p style="color:#BD2124;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#FAFAFB;color:#32313A;border:1px solid #E6E8EA;">Cancelar</button>
    <button on:click={() => save('campanha')} disabled={saving} style="{btn}background:#BD2124;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- ── MODAL: SUPER ADMIN ──────────────────────────────────────────── -->
<Modal title={modalTitle} open={modalOpen && editingSuperAdmin} on:close={closeModal}>
  <div style="display:flex;align-items:center;gap:10px;background:#FFF1F1;border:1px solid #FEE8E8;border-radius:8px;padding:10px 14px;margin-bottom:18px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BD2124" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span style="font-size:12px;color:#BD2124;font-weight:500;">Conta de administrador — acesso total ao sistema</span>
  </div>
  <label style={lbl}>E-mail *</label>
  <input type="email" bind:value={fSuperAdmin.email} style={inp} placeholder="email@exemplo.com" />
  <label style={lbl}>Nova senha (deixe em branco para manter)</label>
  <div style="position:relative;margin-bottom:12px;">
    {#if showPwdSuperAdmin}
      <input type="text"     bind:value={fSuperAdmin.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />
    {:else}
      <input type="password" bind:value={fSuperAdmin.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />
    {/if}
    <button type="button" on:click={() => showPwdSuperAdmin = !showPwdSuperAdmin}
      style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#848E9C;" tabindex="-1">
      {#if showPwdSuperAdmin}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
    </button>
  </div>
  {#if formError}<p style="color:#BD2124;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#FAFAFB;color:#32313A;border:1px solid #E6E8EA;">Cancelar</button>
    <button on:click={() => save('usuarios')} disabled={saving} style="{btn}background:#BD2124;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- ── MODAL: OPERADOR ─────────────────────────────────────────────── -->
<Modal title={modalTitle} open={modalOpen && section==='usuarios' && !editingSuperAdmin} on:close={closeModal}>
  <label style={lbl}>Nome</label>
  <input bind:value={fUsuario.name} style={inp} placeholder="Nome completo" />
  <label style={lbl}>E-mail *</label>
  <input type="email" bind:value={fUsuario.email} style={inp} placeholder="email@exemplo.com" />
  <label style={lbl}>{editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
  <div style="position:relative;margin-bottom:12px;">
    {#if showPwdUsuario}
      <input type="text"     bind:value={fUsuario.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />
    {:else}
      <input type="password" bind:value={fUsuario.password} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••••••" />
    {/if}
    <button type="button" on:click={() => showPwdUsuario = !showPwdUsuario}
      style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#848E9C;" tabindex="-1">
      {#if showPwdUsuario}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
    </button>
  </div>
  <label style={lbl}>Foto de perfil</label>
  <input type="file" accept="image/*" on:change={(e) => { fUsuario.avatar = e.currentTarget.files?.[0] ?? null; }} style="display:block;margin-bottom:14px;font-size:13px;" />
  <div style="display:flex;gap:20px;margin-bottom:16px;">
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;">
      <input type="checkbox" bind:checked={fUsuario.verified} style="accent-color:#BD2124;" /> Conta verificada
    </label>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;">
      <input type="checkbox" bind:checked={fUsuario.emailVisibility} style="accent-color:#BD2124;" /> E-mail visível
    </label>
  </div>
  {#if formError}<p style="color:#BD2124;font-size:12px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;">
    <button on:click={closeModal} style="{btn}background:#FAFAFB;color:#32313A;border:1px solid #E6E8EA;">Cancelar</button>
    <button on:click={() => save('usuarios')} disabled={saving} style="{btn}background:#BD2124;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<!-- ── MODAL: CONFIGURAÇÕES ────────────────────────────────────────── -->
<Modal title={modalTitle} open={modalOpen && section==='configuracoes'} on:close={closeModal}>
  <label style={lbl}>Nome da empresa *</label>
  <input bind:value={fConfig.nome_empresa} style={inp} />

  <label style={lbl}>Mensagem de manutenção</label>
  <input bind:value={fConfig.mensagem_manutencao} style={inp} placeholder="Exibida em modo manutenção" />


  <div style="display:flex;gap:20px;margin-bottom:20px;">
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;">
      <input type="checkbox" bind:checked={fConfig.modo_manutencao} style="accent-color:#BD2124;" /> Modo manutenção
    </label>
  </div>

  {#if pbSettings}
  <!-- Aplicação -->
  <div class="settings-section">
    <p class="settings-section-title">Aplicação (PocketBase)</p>
    <label style={lbl}>Nome da aplicação</label>
    <input bind:value={fPbSettings.appName} style={inp} />
    <label style={lbl}>URL da aplicação</label>
    <input bind:value={fPbSettings.appURL} style={inp} placeholder="https://seu-dominio.com" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div>
        <label style={lbl}>Nome do remetente</label>
        <input bind:value={fPbSettings.senderName} style={inp} />
      </div>
      <div>
        <label style={lbl}>E-mail do remetente</label>
        <input bind:value={fPbSettings.senderAddress} style={inp} placeholder="noreply@empresa.com" />
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.hideControls} style="accent-color:#BD2124;" /> Ocultar controles de UI do PocketBase
    </label>
  </div>

  <!-- SMTP -->
  <div class="settings-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p class="settings-section-title" style="margin:0;">SMTP</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#32313A;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.smtpEnabled} style="accent-color:#BD2124;" /> Ativado
      </label>
    </div>
    <div style="display:grid;grid-template-columns:1fr 100px 1fr;gap:10px;">
      <div>
        <label style={lbl}>Host</label>
        <input bind:value={fPbSettings.smtpHost} style={inp} placeholder="smtp.gmail.com" />
      </div>
      <div>
        <label style={lbl}>Porta</label>
        <input type="number" bind:value={fPbSettings.smtpPort} style={inp} />
      </div>
      <div>
        <label style={lbl}>Método auth</label>
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
      {#if showPwdSmtp}
        <input type="text"     bind:value={fPbSettings.smtpPassword} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />
      {:else}
        <input type="password" bind:value={fPbSettings.smtpPassword} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="deixe em branco para não alterar" />
      {/if}
      <button type="button" on:click={() => showPwdSmtp = !showPwdSmtp}
        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#848E9C;" tabindex="-1">
        {#if showPwdSmtp}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
      </button>
    </div>
    <label style={lbl}>Nome local (EHLO)</label>
    <input bind:value={fPbSettings.smtpLocalName} style={inp} placeholder="opcional" />
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;margin-bottom:14px;">
      <input type="checkbox" bind:checked={fPbSettings.smtpTls} style="accent-color:#BD2124;" /> TLS
    </label>
    <!-- Testar e-mail -->
    <div style="background:#fff;border:1px solid #E6E8EA;border-radius:8px;padding:12px;">
      <p style="font-size:12px;font-weight:600;color:#32313A;margin:0 0 8px;">Testar envio</p>
      <div style="display:flex;gap:8px;">
        <input type="email" bind:value={testEmailAddr} placeholder="destinatario@email.com"
          style="flex:1;padding:8px 10px;border:1px solid #E6E8EA;border-radius:6px;font-size:13px;" />
        <button type="button" on:click={sendTestEmail} disabled={testEmailLoading}
          style="padding:8px 14px;background:#BD2124;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;opacity:{testEmailLoading?0.6:1};">
          {testEmailLoading ? 'Enviando...' : 'Enviar teste'}
        </button>
      </div>
      {#if testEmailMsg}<p style="font-size:12px;color:#15803d;margin:6px 0 0;">{testEmailMsg}</p>{/if}
      {#if testEmailErr}<p style="font-size:12px;color:#b91c1c;margin:6px 0 0;">{testEmailErr}</p>{/if}
    </div>
  </div>

  <!-- Templates de e-mail -->
  {#if isSuperuser}
  <div class="settings-section">
    <p class="settings-section-title">Templates de e-mail</p>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
      {#each tplEntries as [k, label]}
        <button type="button" on:click={() => setTplKey(k)} class="tpl-btn" class:tpl-btn-active={tplKey === k}>
          {label}
        </button>
      {/each}
    </div>
    {#if tplLoading}
      <p style="font-size:13px;color:#848E9C;">Carregando...</p>
    {:else}
      <label style={lbl}>Assunto</label>
      <input bind:value={tplSubject} style={inp} placeholder="Assunto do e-mail" />
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <label style="font-size:12px;font-weight:600;color:#32313A;">Corpo (HTML)</label>
        <button type="button" on:click={() => tplPreview = !tplPreview}
          style="font-size:11px;color:#BD2124;background:none;border:none;cursor:pointer;font-weight:600;">
          {tplPreview ? 'Editar' : 'Pré-visualizar'}
        </button>
      </div>
      {#if tplPreview}
        <div style="border:1px solid #E6E8EA;border-radius:6px;overflow:hidden;height:300px;">
          <iframe srcdoc={tplBody} style="width:100%;height:100%;border:none;" title="Preview"></iframe>
        </div>
      {:else}
        <textarea bind:value={tplBody} rows="12"
          style="display:block;width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E6E8EA;border-radius:6px;font-size:12px;font-family:monospace;resize:vertical;"
          placeholder="HTML do e-mail..."></textarea>
      {/if}
      <p style="font-size:11px;color:#848E9C;margin:6px 0 12px;">Variáveis:
        <code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;">&#123;APP_NAME&#125;</code>
        <code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;">&#123;APP_URL&#125;</code>
        <code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;">&#123;ACTION_URL&#125;</code>
      </p>
      {#if tplMsg}<p style="font-size:12px;color:#15803d;margin:0 0 10px;">{tplMsg}</p>{/if}
      {#if tplErr}<p style="font-size:12px;color:#b91c1c;margin:0 0 10px;">{tplErr}</p>{/if}
      <button type="button" on:click={saveTemplate} disabled={tplLoading}
        style="padding:9px 20px;background:#BD2124;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;opacity:{tplLoading?0.6:1};">
        {tplLoading ? 'Salvando...' : 'Salvar template'}
      </button>
    {/if}
  </div>
  {/if}

  <!-- S3 -->
  <div class="settings-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <p class="settings-section-title" style="margin:0;">Armazenamento S3</p>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#32313A;cursor:pointer;">
        <input type="checkbox" bind:checked={fPbSettings.s3Enabled} style="accent-color:#BD2124;" /> Usar S3
      </label>
    </div>
    {#if fPbSettings.s3Enabled}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style={lbl}>Bucket</label><input bind:value={fPbSettings.s3Bucket} style={inp} /></div>
      <div><label style={lbl}>Região</label><input bind:value={fPbSettings.s3Region} style={inp} placeholder="us-east-1" /></div>
    </div>
    <label style={lbl}>Endpoint</label>
    <input bind:value={fPbSettings.s3Endpoint} style={inp} placeholder="https://s3.amazonaws.com" />
    <label style={lbl}>Access Key</label>
    <input bind:value={fPbSettings.s3AccessKey} style={inp} />
    <label style={lbl}>Secret</label>
    <div style="position:relative;margin-bottom:12px;">
      {#if showPwdS3}<input type="text" bind:value={fPbSettings.s3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••" />{:else}<input type="password" bind:value={fPbSettings.s3Secret} style="{inp}margin-bottom:0;padding-right:38px;" placeholder="••••" />{/if}
      <button type="button" on:click={() => showPwdS3 = !showPwdS3} style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#848E9C;" tabindex="-1">
        {#if showPwdS3}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{/if}
      </button>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;margin-bottom:6px;">
      <input type="checkbox" bind:checked={fPbSettings.s3ForcePathStyle} style="accent-color:#BD2124;" /> Force path style
    </label>
    {/if}
  </div>

  <!-- Logs -->
  <div class="settings-section">
    <p class="settings-section-title">Logs</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div><label style={lbl}>Retenção (dias)</label><input type="number" bind:value={fPbSettings.logsMaxDays} style={inp} min="1" max="365" /></div>
      <div>
        <label style={lbl}>Nível mínimo</label>
        <select bind:value={fPbSettings.logsMinLevel} style={inp}>
          <option value={0}>DEBUG</option>
          <option value={4}>INFO</option>
          <option value={8}>WARN</option>
          <option value={12}>ERROR</option>
        </select>
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#32313A;cursor:pointer;">
      <input type="checkbox" bind:checked={fPbSettings.logsLogIP} style="accent-color:#BD2124;" /> Registrar IP
    </label>
  </div>
  {/if}

  {#if formError}<p style="color:#BD2124;font-size:12px;margin-top:8px;margin-bottom:12px;">{formError}</p>{/if}
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">
    <button on:click={closeModal} style="{btn}background:#FAFAFB;color:#32313A;border:1px solid #E6E8EA;">Cancelar</button>
    <button on:click={() => save('configuracoes')} disabled={saving} style="{btn}background:#BD2124;color:#fff;opacity:{saving?0.7:1};">
      {saving?'Salvando...':'Salvar'}
    </button>
  </div>
</Modal>

<style>
  /* ── Sidebar ────────────────────────────────── */
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 20px;
    border: none;
    border-left: 3px solid transparent;
    background: transparent;
    color: #848E9C;
    font-size: 13px;
    text-align: left;
    box-sizing: border-box;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }
  .menu-item:hover { background: #F5F5F5; color: #1E2026; }
  .menu-item--active { background: #FFF1F1; border-left-color: #BD2124; color: #BD2124; font-weight: 600; }
  .menu-item--active:hover { background: #FEE8E8; }
  .menu-icon { display: flex; align-items: center; width: 18px; flex-shrink: 0; opacity: 0.7; }
  .menu-icon--active { opacity: 1; }
  .sidebar-link {
    display: flex; align-items: center; justify-content: flex-start; gap: 8px;
    width: 100%; padding: 8px 12px; background: #F5F5F5;
    border: none; border-radius: 6px; color: #848E9C;
    font-size: 12px; cursor: pointer; text-decoration: none; box-sizing: border-box; font-weight: 500;
    transition: background 0.12s;
  }
  .sidebar-link:hover { background: #E6E8EA; color: #1E2026; }

  /* ── Cards e tabelas ────────────────────────── */
  .stat-card {
    background: #fff; border: 1px solid #E6E8EA; border-radius: 10px;
    padding: 20px; text-align: left; cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #D0D3D7; }
  .data-card { background: #fff; border: 1px solid #E6E8EA; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .card-header {
    padding: 14px 20px; border-bottom: 1px solid #E6E8EA;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; font-weight: 600; color: #1E2026;
  }
  .table-head {
    display: grid; padding: 8px 20px; background: #FAFAFB;
    border-bottom: 1px solid #E6E8EA;
  }
  .table-head span { font-size: 11px; font-weight: 600; color: #848E9C; text-transform: uppercase; letter-spacing: .05em; }
  .table-row {
    display: grid; align-items: center; padding: 10px 20px;
    border-bottom: 1px solid #F5F5F5; transition: background 0.1s;
  }
  .table-row:hover { background: #FAFAFB; }
  .cell-main { font-size: 13px; font-weight: 500; color: #1E2026; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cell-meta { font-size: 12px; color: #848E9C; }
  .empty-msg { padding: 24px 20px; text-align: center; color: #848E9C; font-size: 13px; margin: 0; }

  /* ── Badges ─────────────────────────────────── */
  .badge-green { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: #E8FAF2; color: #0ECB81; }
  .badge-gray  { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: #F5F5F5; color: #848E9C; }
  .badge-blue  { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: #F5F5F5; color: #32313A; }
  .badge-red   { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: #FEE8E8; color: #BD2124; }

  /* ── Botões ─────────────────────────────────── */
  .btn-ghost-red {
    font-size: 12px; color: #BD2124; background: rgba(189,33,36,0.07);
    border: none; cursor: pointer; font-weight: 600; padding: 5px 12px; border-radius: 6px;
    transition: background 0.1s;
  }
  .btn-ghost-red:hover { background: rgba(189,33,36,0.12); }

  /* ── Configurações modal ────────────────────── */
  .settings-section { border-top: 1px solid #E6E8EA; margin: 4px 0 14px; padding-top: 14px; }
  .settings-section-title { font-size: 11px; font-weight: 700; color: #848E9C; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
  .tpl-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #E6E8EA; background: #fff; color: #1E2026; font-size: 12px; cursor: pointer; }
  .tpl-btn-active { border-color: #BD2124; background: #BD2124; color: #fff; font-weight: 600; }
</style>
