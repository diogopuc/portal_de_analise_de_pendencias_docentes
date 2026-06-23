// =============================================================================
// semanas.config.ts — CONFIGURAÇÃO DO MÊS / SEMANAS
//
// >>> ESTE É O ÚNICO ARQUIVO QUE PRECISA SER EDITADO AO MUDAR DE MÊS. <<<
//
// Para configurar um novo mês:
//   1. Atualize SEMANAS_CONFIG com uma linha por semana/aba da planilha Excel.
//      - "aba"     → tem que ser IDÊNTICO ao nome da aba no Excel (ex: "04.05").
//      - "semana"  → texto exibido no PDF e no painel (ex: "Semana 01").
//      - "periodo" → texto exibido no PDF (ex: "04/05 a 10/05").
//   2. Se houver feriado/recesso que abone uma semana inteira, adicione a
//      entrada correspondente em SEMANAS_ABONADAS (a chave é o mesmo "aba").
//      Semanas abonadas não contam como pendência e não aparecem no PDF.
//   3. Salve o arquivo e reprocesse a planilha no sistema. Não precisa tocar
//      em mais nenhum outro lugar do código.
// =============================================================================

export const SEMANAS_CONFIG = [
  { aba: '04.05', semana: 'Semana 01', periodo: '04/05 a 10/05' },
  { aba: '11.05', semana: 'Semana 02', periodo: '11/05 a 17/05' },
  { aba: '18.05', semana: 'Semana 03', periodo: '18/05 a 24/05' },
  { aba: '25.05', semana: 'Semana 04', periodo: '25/05 a 31/05' },
];

// Semanas abonadas: chave = "aba" (igual à tabela acima), valor = motivo exibido no painel.
// Deixe o objeto vazio ({}) quando não houver nenhuma semana abonada no mês.
export const SEMANAS_ABONADAS: Record<string, string> = {
  // '04.05': 'Semana abonada — Feriado: Exemplo (01/05)',
};
