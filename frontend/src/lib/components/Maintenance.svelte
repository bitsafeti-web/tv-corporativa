<script lang="ts">
  export let mensagem: string = 'Sistema em manutenção. Voltamos em breve.';
  export let empresa: string = '';
</script>

<div class="fixed inset-0 z-50 flex" style="font-family: 'Inter', sans-serif;">

  <!-- Faixa vermelha esquerda -->
  <div class="relative flex-shrink-0 flex flex-col items-center justify-between py-16 px-8"
    style="width: 38%; background: #7b0000;">

    <!-- Brilho sutil no topo -->
    <div class="absolute top-0 left-0 right-0 h-64 pointer-events-none"
      style="background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 70%);"></div>

    <!-- Logo -->
    <div class="relative z-10 flex flex-col items-center gap-1">
      <img src="/bitsafe-branco.png" alt="Bitsafe" class="h-32 object-contain" />
      <img src="/gptw-2026.png" alt="GPTW" class="h-28 object-contain" />
    </div>

    <!-- Ícone central -->
    <div class="relative z-10 flex flex-col items-center gap-2">
      <!-- ping wrapper -->
      <div class="relative flex items-center justify-center">
        <!-- anel externo ping -->
        <span class="absolute inline-flex w-24 h-24 rounded-full opacity-50" style="background:rgba(255,255,255,0.15); animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <!-- anel médio ping com delay -->
        <span class="absolute inline-flex w-20 h-20 rounded-full opacity-30" style="background:rgba(255,255,255,0.15); animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite; animation-delay:0.4s;"></span>
        <!-- círculo central -->
        <div class="relative w-16 h-16 rounded-full flex items-center justify-center"
          style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-4">
        <span class="w-2 h-2 rounded-full animate-pulse" style="background:#fca5a5;"></span>
        <span class="text-white/50 text-xs tracking-wide">Manutenção ativa</span>
      </div>
    </div>

    <!-- Rodapé -->
    <p class="relative z-10 text-white/20 text-xs">© {new Date().getFullYear()} Bitsafe TI</p>
  </div>

  <!-- Área direita escura -->
  <div class="flex-1 flex flex-col items-start justify-center px-20"
    style="background: #0f0f0f;">

    <!-- Linha decorativa vermelha -->
    <div class="mb-10 w-12 h-1 rounded-full" style="background: #7b0000;"></div>

    <p class="text-xs tracking-widest uppercase mb-4" style="color: #7b0000;">Aviso do sistema</p>

    <h1 class="text-5xl font-bold leading-tight mb-6" style="color: #f5f5f5;">
      Este painel está<br/>em manutenção!
    </h1>

    <p class="text-lg leading-relaxed max-w-md" style="color: rgba(255,255,255,0.35);">
      {mensagem}
    </p>

    <!-- Barra de progresso animada -->
    <div class="mt-16 w-64">
      <div class="flex justify-between mb-2">
        <span class="text-xs" style="color:rgba(255,255,255,0.2);">Aguarde</span>
      </div>
      <div class="h-0.5 w-full rounded-full overflow-hidden" style="background:rgba(255,255,255,0.06);">
        <div class="h-full rounded-full" style="background:#7b0000; animation: progress 3s ease-in-out infinite;"></div>
      </div>
    </div>

  </div>
</div>

<style>
  @keyframes progress {
    0%   { width: 0%; opacity: 1; }
    70%  { width: 100%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
  @keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }
</style>
