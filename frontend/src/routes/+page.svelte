<script lang="ts">
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  const RECAPTCHA_SITE_KEY = '6LdaYLUsAAAAABmaOWANTuGjbZAlscKtNomAEvYT';

  let email = '';
  let password = '';
  let totpCode = '';
  let showTotp = false;
  let loading = false;
  let error = '';

  async function getRecaptchaToken(action: string): Promise<string> {
    return new Promise((resolve) => {
      const gr = (window as any).grecaptcha;
      if (!gr) { resolve(''); return; }
      gr.ready(() => {
        gr.execute(RECAPTCHA_SITE_KEY, { action })
          .then(resolve)
          .catch(() => resolve(''));
      });
    });
  }

  async function login() {
    if (!email || !password) {
      error = 'Preencha todos os campos.';
      return;
    }
    if (showTotp && !totpCode) {
      error = 'Informe o codigo 2FA.';
      return;
    }
    loading = true;
    error = '';
    try {
      const recaptchaToken = await getRecaptchaToken('login');

      // Tenta Usuarios primeiro
      try {
        await pb.collection('Usuarios').authWithPassword(email, password);
        showTotp = false;
        totpCode = '';
        goto('/admin');
        return;
      } catch (_) { /* não é Usuarios, tenta superuser */ }

      // Superusers
      const res = await pb.send('/api/totp/auth', {
        method: 'POST',
        body: { email, password, totp_code: totpCode, recaptcha_token: recaptchaToken }
      });
      pb.authStore.save(res.token, res.record);
      showTotp = false;
      totpCode = '';
      goto('/admin');
    } catch (err: any) {
      if (err?.response?.requires_totp) {
        showTotp = true;
        error = err.response.message || 'Informe o codigo 2FA.';
        return;
      }
      const detail = err?.response?.message || err?.message || String(err);
      error = 'Erro: ' + detail;
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') login();
  }
</script>

<svelte:head>
  <title>TV Corporativa — Login</title>
  <script src="https://www.google.com/recaptcha/api.js?render=6LdaYLUsAAAAABmaOWANTuGjbZAlscKtNomAEvYT" async defer></script>
</svelte:head>

<div style="display:flex; min-height:100vh; margin:0; padding:0;">

  <!-- Faixa vermelha esquerda -->
  <div style="width:30%; background-color:#BD2124; flex-shrink:0;"></div>

  <!-- Área branca direita -->
  <div style="flex:1; background:#fff; display:flex; align-items:center; justify-content:center;">
    <div style="width:340px;">

      <!-- Logo -->
      <div style="display:flex; justify-content:center; margin-bottom:0;">
        <img src="/bitgroup.png" alt="Bitgroup" style="height:180px; object-fit:contain;" />
      </div>

      <!-- Subtítulo -->
      <p style="text-align:center; color:#BD2124; font-size:15px; font-weight:500; margin:0 0 28px 0; font-family:'Poppins',sans-serif;">
        TV CORPORATIVA BITGROUP
      </p>

      <input
          type="email"
          bind:value={email}
          on:keydown={handleKeydown}
          placeholder="E-mail"
          autocomplete="email"
          style="display:block; width:100%; box-sizing:border-box; padding:14px 16px; border:1px solid #E6E8EA; border-radius:8px; font-size:14px; color:#1E2026; margin-bottom:16px; outline:none; font-family:'Poppins',sans-serif;"
        />

        <input
          type="password"
          bind:value={password}
          on:keydown={handleKeydown}
          placeholder="Senha"
          autocomplete="current-password"
          style="display:block; width:100%; box-sizing:border-box; padding:14px 16px; border:1px solid #E6E8EA; border-radius:8px; font-size:14px; color:#1E2026; margin-bottom:20px; outline:none; font-family:'Poppins',sans-serif;"
        />

        {#if showTotp}
          <input
            type="text"
            inputmode="numeric"
            maxlength="6"
            bind:value={totpCode}
            on:keydown={handleKeydown}
            placeholder="Codigo 2FA"
            autocomplete="one-time-code"
            style="display:block; width:100%; box-sizing:border-box; padding:14px 16px; border:1px solid #E6E8EA; border-radius:8px; font-size:14px; color:#1E2026; margin-bottom:20px; outline:none; font-family:'Poppins',sans-serif;"
          />
        {/if}

        {#if error}
          <p style="color:#BD2124; font-size:13px; margin-bottom:12px; font-family:'Poppins',sans-serif;">{error}</p>
        {/if}

        <button
          on:click={login}
          disabled={loading}
          style="display:block; width:100%; padding:14px; background:#BD2124; color:#fff; font-size:15px; font-weight:600; border:none; border-radius:8px; cursor:pointer; font-family:'Poppins',sans-serif; opacity:{loading ? 0.7 : 1};"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>

      <!-- reCAPTCHA disclosure -->
      <p style="margin-top:20px; text-align:center; font-size:10px; color:#aaa; font-family:'Poppins',sans-serif; line-height:1.5;">
        Protegido por reCAPTCHA —
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color:#999;">Privacidade</a>
        e
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener" style="color:#999;">Termos</a>
      </p>

    </div>
  </div>

</div>

<style>
  :global(.grecaptcha-badge) { visibility: hidden !important; }
</style>
