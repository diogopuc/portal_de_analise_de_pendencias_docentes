import fs   from 'fs';
import path from 'path';

export interface SemanaConfig {
  aba: string;
  semana: string;
  periodo: string;
}

export interface SemanasConfigData {
  semanas: SemanaConfig[];
  abonadas: Record<string, string>;
}

const CONFIG_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'semanas.config.json');

const CONFIG_PADRAO: SemanasConfigData = {
  semanas: [
    { aba: '01.06', semana: 'Semana 01', periodo: '01/06 a 07/06' },
    { aba: '08.06', semana: 'Semana 02', periodo: '08/06 a 14/06' },
    { aba: '15.06', semana: 'Semana 03', periodo: '15/06 a 21/06' },
    { aba: '22.06', semana: 'Semana 04', periodo: '22/06 a 28/06' },
  ],
  abonadas: {
    '01.06': 'Semana abonada - Feriado: Corpus Christi (04/06/2026)',
  },
};

export function lerConfig(): SemanasConfigData {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as SemanasConfigData;
    }
  } catch {}
  return CONFIG_PADRAO;
}

export function salvarConfig(config: SemanasConfigData): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// Compat com imports antigos (avaliados uma vez na importação — use lerConfig() para acesso dinâmico)
export const SEMANAS_CONFIG   = CONFIG_PADRAO.semanas;
export const SEMANAS_ABONADAS = CONFIG_PADRAO.abonadas;
