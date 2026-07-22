# Changelog

Todas as mudanças relevantes do projeto estão documentadas aqui.
Formato: [versionamento semântico](https://semver.org/lang/pt-BR/) — `vMAJOR.MINOR.PATCH`

| Peso | Tipo | Quando usar |
|------|------|-------------|
| MAJOR | Reescrita / breaking | Mudança de arquitetura inteira, quebra de compatibilidade |
| MINOR | Feature / refactor significativo | Nova funcionalidade, melhoria expressiva de qualidade |
| PATCH | Bugfix / ajuste | Correção de erro, pequena melhoria, estilo |

---

## [v1.3.1] — 2026-07-22

### Corrigido
- **Prefixo numérico do curso** (`ExcelPlanilhaReader`): a planilha armazena o curso como `{CÓDIGO} - {NOME}` (ex: `4093 - DIREITO - ADM - CTBA`). O prefixo numérico é agora removido na leitura, armazenando apenas o nome descritivo.

---

## [v1.3.0] — 2026-07-22

### Adicionado / Corrigido (TypeScript — crítico)
- **`DadosSemana` e `DashboardData.porSemana`**: campos `abonada: boolean` e `motivoAbono?: string` adicionados ao tipo frontend, alinhando com o backend.
- **`PaginatedResponse<T>` eliminado**: substituído por `PaginatedDocentes` e `PaginatedRelatorios` tipados e não-ambíguos.
- **Bug de download 404 corrigido**: `Relatorios.tsx` e `RevisarRelatorio.tsx` construíam a URL sem o sufixo `_${matricula}`, causando 404 em todos os downloads individuais. Centralizado em `relatoriosAPI.getNomeArquivo()` com sanitização idêntica ao backend.
- **`strict: true`** habilitado em `backend/tsconfig.json` e `frontend/tsconfig.json`.

---

## [v1.2.1] — 2026-07-21

### Corrigido / Estilo
- Bordas laterais coloridas removidas das seções de `Analise.tsx` ("sem cara de IA").
- Outline preto de foco ao clicar nas fatias do gráfico Recharts removido via CSS.

---

## [v1.2.0] — 2026-07-21

### Corrigido (bugs críticos de runtime)
- **Race condition no boot**: `inicializar()` passou a ser aguardado antes de `app.listen()` — servidor não aceitava mais requisições com repositório vazio.
- **Reprocessar zerava todos os dados**: backend procurava `Atv_Pendentes_Abril.xlsx` (hardcoded) enquanto `SEMANAS_CONFIG` tinha abas de junho. Substituído por auto-descoberta de qualquer `.xlsx` na pasta `data/`.
- **Tela branca após reload** (`Painel.tsx`): `useMutation` estava declarado após `if (isLoading) return (...)`, violando Rules of Hooks. Hooks movidos para antes de qualquer return condicional.
- Botão "Processar Planilha Padrão" adicionado na tela de estado vazio do Painel, sem precisar navegar para Relatórios.

---

## [v1.1.2] — 2026-07-20

### Melhorado (Frontend — padrões Claude Cookbooks)
- Banner de processamento substituído de `<Loader2 className="animate-spin" />` para `<span className="status-dot status-dot--running" />`.
- Lista lateral de `RevisarRelatorio.tsx` refatorada com classes `.docente-item` / `.docente-item--active` / `.docente-item__name` / `.docente-item__meta`.
- Status dots (`.status-dot--err`, `.status-dot--warn`, `.status-dot--ok`) aplicados consistentemente nas páginas.
- CSS: adicionado `.status-dot--warn` em `index.css`.

---

## [v1.1.1] — 2026-07-19

### Melhorado (Frontend — design system)
- Design tokens de motion (`--dur-1`, `--dur-2`, `--ease-std`), surface layers (`--surface-0/1/2/3`) e classes semânticas centralizados em `index.css`.
- Componentes de UI (`Card`, `Toast`, `Skeleton`) refatorados para usar os tokens.

---

## [v1.1.0] — 2026-07-18

### Refatorado (Backend — arquitetura DDD)
- Backend reestruturado em camadas: `domain/` (entidades, repositórios, serviços, value-objects), `application/` (use-cases), `infrastructure/` (readers, generators, repositories), `config/` (`semanas.config.ts`).
- `semanas.config.ts` centraliza todas as abas mensais e semanas abonadas — único arquivo a editar ao mudar de mês.
- `PendenciaService` encapsula as regras de negócio de Agenda e TACH.
- `InMemoryDocenteRepository` implementa `IDocenteRepository`.

---

## [v1.0.3] — 2026-07-17

### Corrigido
- Download ZIP filtrado por tipo de pendência (Simultâneas, Somente Agenda, Somente TACH).
- Hover nos botões de ZIP corrigido.
- PDFs ordenados alfabeticamente na listagem.
- Normalização de campus no backend e preenchimento correto das barras de progresso no Painel.
- Semanas abonadas exibidas com indicador de feriado nas colunas do Painel.
- Bolinha verde para docentes sem pendência na lista lateral de `RevisarRelatorio`.

---

## [v1.0.2] — 2026-07-15

### Corrigido
- Divergências de resultado e cache entre planilha e PDFs gerados.
- Status `FINALIZADO` mapeado corretamente como pendência de TACH.
- Semanas abonadas ocultas do relatório PDF.
- Layout do PDF: sobreposição de elementos, bordas arredondadas, logo branca no cabeçalho, prefixo de pendência removido.
- `AGUARDANDO APROVAÇÃO` tratado como ignorado (sem pendência) em Agenda e TACH.

---

## [v1.0.1] — 2026-07-12

### Corrigido
- Scripts `.bat` e `.ps1` de inicialização: encoding, variáveis de path, polling de porta, download automático do Node.js portable, janelas separadas por processo.
- Footer fixado na base da tela; aceita `marginLeft` para respeitar sidebar.
- Header: badge de revisão movido para dentro do Header, eliminando sobreposição.

---

## [v1.0.0] — 2026-07-10

### Lançamento inicial
- Portal de Análise de Pendências Docentes PUCPR.
- Processamento de planilha Excel mensal (Agenda + TACH).
- Geração de relatórios PDF individuais com cabeçalho institucional.
- Download em lote via ZIP.
- Dashboard com StatCards, gráficos de barras e pizza (Recharts).
- Filtros, busca e paginação por campus e tipo de pendência.
- Telas: Painel, Relatórios, Revisar Relatório, Todos os Relatórios, Análise.
- Stack: Node.js 20 portable, Express 4, React 19, Vite 8, TypeScript, TailwindCSS v4, React Query v5.
