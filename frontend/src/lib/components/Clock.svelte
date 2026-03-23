<script lang="ts">
  import { now, formatTime } from '$lib/stores/clock';

  export let timezone = 'America/Sao_Paulo';
  export let size: 'sm' | 'md' | 'lg' = 'lg';

  $: time = formatTime($now, timezone);
  $: [hh, mm, ss] = time.split(':');

  const sizes = {
    sm: { main: 'text-4xl', sec: 'text-xl mb-1' },
    md: { main: 'text-6xl', sec: 'text-2xl mb-1' },
    lg: { main: 'text-8xl', sec: 'text-3xl mb-2' }
  };

  $: s = sizes[size];
</script>

<div class="flex items-end gap-1 select-none">
  <span class="font-mono font-bold leading-none tracking-tight text-white text-shadow {s.main}">
    {hh}<span class="text-white/40 animate-pulse">:</span>{mm}
  </span>
  <span class="font-mono text-white/50 leading-none {s.sec}">{ss}</span>
</div>
