<script lang="ts">
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  export let params: Record<string, string> = {};

  let email = '';
  let password = '';
  let lembrar = false;
  let loading = false;
  let error = '';

  async function login() {
    if (!email || !password) {
      error = 'Preencha todos os campos.';
      return;
    }
    loading = true;
    error = '';
    try {
      try {
        await pb.collection('Usuarios').authWithPassword(email, password);
      } catch {
        await pb.collection('_superusers').authWithPassword(email, password);
      }
      goto('/admin');
    } catch {
      error = 'E-mail ou senha inválidos.';
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
</svelte:head>

<div style="display:flex; min-height:100vh; margin:0; padding:0;">

  <!-- Faixa vermelha esquerda -->
  <div style="width:30%; background-color:#7b0000; flex-shrink:0;"></div>

  <!-- Área branca direita -->
  <div style="flex:1; background:#fff; display:flex; align-items:center; justify-content:center;">
    <div style="width:340px;">

      <!-- Logo -->
      <div style="display:flex; justify-content:center; margin-bottom:18px;">
        <img src="/bitsafe-logo.png" alt="Bitsafe" style="height:90px; object-fit:contain;" />
      </div>

      <!-- Subtítulo -->
      <p style="text-align:center; color:#7b0000; font-size:15px; font-weight:500; margin-bottom:28px; font-family:sans-serif;">
        Tv Corporativa GRUPO BITSAFE
      </p>

      <!-- Campos -->
      <input
        type="email"
        bind:value={email}
        on:keydown={handleKeydown}
        autocomplete="email"
        style="display:block; width:100%; box-sizing:border-box; padding:14px 16px; border:1px solid #bbb; border-radius:4px; font-size:14px; color:#333; margin-bottom:16px; outline:none; font-family:sans-serif;"
      />

      <input
        type="password"
        bind:value={password}
        on:keydown={handleKeydown}
        autocomplete="current-password"
        style="display:block; width:100%; box-sizing:border-box; padding:14px 16px; border:1px solid #bbb; border-radius:4px; font-size:14px; color:#333; margin-bottom:12px; outline:none; font-family:sans-serif;"
      />

      <!-- Lembrar-me -->
      <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#555; margin-bottom:20px; cursor:pointer; font-family:sans-serif;">
        <input type="checkbox" bind:checked={lembrar} style="accent-color:#7b0000;" />
        Lembrar-me
      </label>

      {#if error}
        <p style="color:#b00; font-size:13px; margin-bottom:12px; font-family:sans-serif;">{error}</p>
      {/if}

      <!-- Botão -->
      <button
        on:click={login}
        disabled={loading}
        style="display:block; width:100%; padding:14px; background:rgba(123,0,0,0.08); color:#7b0000; font-size:15px; font-weight:600; border:none; border-radius:8px; cursor:pointer; font-family:sans-serif; opacity:{loading ? 0.7 : 1};"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

    </div>
  </div>

</div>
