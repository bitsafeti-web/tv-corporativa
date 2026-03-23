import { readable } from 'svelte/store';

export const now = readable(new Date(), (set) => {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});

export function formatTime(date: Date, timezone = 'America/Sao_Paulo'): string {
  return date.toLocaleTimeString('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatDate(date: Date, timezone = 'America/Sao_Paulo'): { diaSemana: string; dia: string; mes: string; ano: string } {
  const opts = { timeZone: timezone };

  const diaSemana = date.toLocaleDateString('pt-BR', { ...opts, weekday: 'long' });
  const dia = date.toLocaleDateString('pt-BR', { ...opts, day: '2-digit' });
  const mes = date.toLocaleDateString('pt-BR', { ...opts, month: 'long' });
  const ano = date.toLocaleDateString('pt-BR', { ...opts, year: 'numeric' });

  return {
    diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
    dia,
    mes: mes.charAt(0).toUpperCase() + mes.slice(1),
    ano
  };
}
