import { writable, get } from 'svelte/store';
import { PUBLIC_WEATHER_API_KEY, PUBLIC_WEATHER_CITY, PUBLIC_WEATHER_COUNTRY } from '$env/static/public';
import { configEfetiva } from '$lib/stores/config';

export type WeatherData = {
  temp: number;
  sensacao: number;
  descricao: string;
  icone: string;
  umidade: number;
  vento: number;
  cidade: string;
};

export type ForecastItem = {
  hora: string;
  temp: number;
  tempMin: number;
  icone: string;
};

export const weather      = writable<WeatherData | null>(null);
export const weatherError = writable<string | null>(null);
export const forecastItems = writable<ForecastItem[]>([]);

const ICON_MAP: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️'
};

function getParams(): { key: string; city: string; country: string } {
  const cfg = get(configEfetiva);
  return {
    key:     cfg?.weather_api_key || PUBLIC_WEATHER_API_KEY,
    city:    cfg?.cidade          || PUBLIC_WEATHER_CITY,
    country: cfg?.pais            || PUBLIC_WEATHER_COUNTRY
  };
}

export async function fetchWeather(): Promise<void> {
  const { key, city, country } = getParams();

  if (!key || key === 'sua_chave_aqui') {
    weatherError.set('Configure a chave da API de clima');
    return;
  }

  try {
    const q = encodeURIComponent(`${city},${country}`);
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${key}&units=metric&lang=pt_br`
    );
    if (!res.ok) throw new Error();

    const data = await res.json();
    weather.set({
      temp:      Math.round(data.main.temp),
      sensacao:  Math.round(data.main.feels_like),
      descricao: data.weather[0].description,
      icone:     ICON_MAP[data.weather[0].icon] ?? '🌡️',
      umidade:   data.main.humidity,
      vento:     Math.round(data.wind.speed * 3.6),
      cidade:    data.name
    });
    weatherError.set(null);
  } catch {
    weatherError.set('Clima indisponível');
  }
}

export async function fetchForecast(): Promise<void> {
  const { key, city, country } = getParams();
  if (!key || key === 'sua_chave_aqui') return;

  try {
    const q = encodeURIComponent(`${city},${country}`);
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${key}&units=metric&lang=pt_br&cnt=8`
    );
    if (!res.ok) return;

    const data = await res.json();
    forecastItems.set(
      (data.list ?? []).map((item: Record<string, unknown>) => {
        const dt   = new Date((item.dt as number) * 1000);
        const main = item.main as Record<string, number>;
        const w    = (item.weather as Array<Record<string, string>>)[0];
        return {
          hora:    dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
          temp:    Math.round(main.temp),
          tempMin: Math.round(main.temp_min),
          icone:   ICON_MAP[w.icon] ?? '🌡️'
        };
      })
    );
  } catch {
    // silently fail
  }
}

export function startWeatherUpdates(): () => void {
  fetchWeather();
  fetchForecast();
  const interval = setInterval(() => {
    fetchWeather();
    fetchForecast();
  }, 10 * 60 * 1000);
  return () => clearInterval(interval);
}
