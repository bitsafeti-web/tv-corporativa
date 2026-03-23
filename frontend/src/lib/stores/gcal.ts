import { writable } from 'svelte/store';

export type CalendarEvent = {
  id: string;
  titulo: string;
  descricao: string;
  inicio: Date;
  fim: Date;
  local?: string;
  diaInteiro: boolean;
};

export const calendarEvents = writable<CalendarEvent[]>([]);

function formatDateLabel(inicio: Date, fim: Date, diaInteiro: boolean): string {
  const opts: Intl.DateTimeFormatOptions = diaInteiro
    ? { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }
    : { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' };
  return inicio.toLocaleDateString('pt-BR', opts);
}

export async function fetchCalendarEvents(calendarId: string, apiKey: string): Promise<void> {
  if (!calendarId || !apiKey) return;

  try {
    const now = new Date().toISOString();
    const maxTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // próximos 30 dias
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
      + `?key=${apiKey}&timeMin=${now}&timeMax=${maxTime}&maxResults=10&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao buscar eventos');

    const data = await res.json();
    const events: CalendarEvent[] = (data.items ?? []).map((item: Record<string, unknown>) => {
      const startRaw = item.start as { dateTime?: string; date?: string };
      const endRaw   = item.end   as { dateTime?: string; date?: string };
      const diaInteiro = !startRaw.dateTime;
      const inicio = new Date(startRaw.dateTime ?? startRaw.date ?? '');
      const fim    = new Date(endRaw.dateTime   ?? endRaw.date   ?? '');

      return {
        id: item.id as string,
        titulo: (item.summary as string) ?? 'Evento',
        descricao: formatDateLabel(inicio, fim, diaInteiro) + (item.location ? ` · ${item.location}` : ''),
        inicio,
        fim,
        local: item.location as string | undefined,
        diaInteiro
      };
    });

    calendarEvents.set(events);
  } catch (e) {
    console.error('Google Calendar indisponível:', e);
  }
}

export function startCalendarUpdates(calendarId: string, apiKey: string): () => void {
  fetchCalendarEvents(calendarId, apiKey);
  const interval = setInterval(() => fetchCalendarEvents(calendarId, apiKey), 30 * 60 * 1000); // a cada 30min
  return () => clearInterval(interval);
}
