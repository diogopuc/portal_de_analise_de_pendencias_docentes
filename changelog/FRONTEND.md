# Changelog — Frontend

Alterações em `frontend/src/` (páginas, componentes, design system, tipos, serviços).

| Peso | Quando usar |
|------|-------------|
| MAJOR | Reescrita completa da UI, breaking change |
| MINOR | Nova tela, refactor expressivo, design system |
| PATCH | Bugfix, ajuste de estilo, pequena melhoria |

---

## [v1.0.0] — 2026-07-10 · MAJOR

### Lançamento inicial
- React 19 + Vite 8 (rolldown) + TypeScript + TailwindCSS v4.
- React Query v5 para cache e data fetching.
- React Router v7 para SPA.
- Telas: **Painel** (dashboard + gráficos Recharts), **Relatórios** (tabela paginável + upload), **Revisar Relatório** (detalhamento semanal), **Todos os Relatórios** (central de PDFs), **Análise** (regras de negócio).
- Identidade visual PUCPR (`#8A0538`) com Poppins + Source Sans 3.

---

## [v1.0.1] — 2026-07-12 · PATCH

### Corrigido
- Footer fixado na base da tela; recebe `marginLeft` como prop para respeitar a largura da sidebar.
- Header: badge de revisão movido para dentro do componente, eliminando sobreposição com "Sistema Online".

---

## [v1.0.3] — 2026-07-17 · PATCH

### Melhorado
- Bolinha verde para docentes sem pendência na lista lateral de `RevisarRelatorio`.
- Indicador de feriado exibido nas colunas de semanas abonadas no `Painel`.
- Hover nos botões de download ZIP por tipo corrigido.
- PDFs ordenados alfabeticamente na listagem de `TodosRelatorios`.
- Cards de pendência no Painel com descrições corrigidas.
- Barras de progresso por campus preenchidas corretamente.

---

## [v1.1.1] — 2026-07-19 · MINOR

### Melhorado — Design System
- Design tokens centralizados em `index.css`:
  - Motion: `--dur-1`, `--dur-2`, `--ease-std`
  - Surface layers: `--surface-0`, `--surface-1`, `--surface-2`, `--surface-3`
  - Classes semânticas de botões, badges e cards
- Componentes `Card`, `Toast`, `Skeleton` refatorados para usar os tokens.

---

## [v1.1.2] — 2026-07-20 · PATCH

### Melhorado — Padrões Claude Cookbooks
- **Banner de processamento** (`Relatorios.tsx`): `<Loader2 animate-spin />` substituído por `<span className="status-dot status-dot--running" />`.
- **Lista lateral** (`RevisarRelatorio.tsx`): refatorada com classes semânticas `.docente-item`, `.docente-item--active`, `.docente-item__name`, `.docente-item__meta`.
- **Status dots** aplicados consistentemente: `.status-dot--err`, `.status-dot--warn`, `.status-dot--ok`.
- `index.css`: adicionada classe `.status-dot--warn { background: #FAAD14 }`.

---

## [v1.2.0] — 2026-07-21 · MINOR

### Corrigido (bugs críticos de UI)
- **Tela branca após reload** (`Painel.tsx`): `useMutation` declarado após `if (isLoading) return (...)` violava React Rules of Hooks. Todos os hooks movidos para antes de qualquer return condicional.
- **Botão "Processar Planilha Padrão"** adicionado ao estado vazio do Painel — sem precisar navegar para a tela de Relatórios.

---

## [v1.2.1] — 2026-07-21 · PATCH

### Corrigido / Estilo
- **Bordas laterais coloridas** (`Analise.tsx`): `borderLeft: '4px solid ...'` removido de todas as seções de conteúdo.
- **Outline preto no Recharts** (`index.css`): foco em elementos SVG ao clicar nas fatias do gráfico de pizza removido via `.recharts-wrapper *:focus, .recharts-surface:focus, svg *:focus { outline: none }`.

---

## [v1.3.0] — 2026-07-22 · MINOR

### Corrigido / Melhorado — TypeScript (crítico)
- **`DadosSemana`** (`types/index.ts`): campos `abonada: boolean` e `motivoAbono?: string` adicionados, alinhando com o backend.
- **`DashboardData.porSemana`** (`types/index.ts`): idem acima — `abonada` e `motivoAbono` agora declarados no tipo.
- **`PaginatedResponse<T>` eliminado** (`types/index.ts`): substituído por `PaginatedDocentes` e `PaginatedRelatorios` com campos obrigatórios e tipados corretamente (sem ambiguidade `docentes?` vs `relatorios?`).
- **Bug de download 404 corrigido** (`Relatorios.tsx`, `RevisarRelatorio.tsx`): URLs construídas sem `_${matricula}` causavam 404 em todos os downloads individuais. Centralizado em `relatoriosAPI.getNomeArquivo(nome, matricula)` em `services/api.ts` com sanitização idêntica ao backend.
- `strict: true` habilitado em `frontend/tsconfig.json`.

---

## [v1.4.0] — 2026-07-22 · MINOR

### Adicionado — Visão do Coordenador
- Nova tela `/coordenador` acessível pelo menu lateral (grupo "COORDENAÇÃO").
- Filtros client-side por **campus**, **curso** e **nome/matrícula do docente** — sem requisições adicionais ao backend.
- **6 KPI cards** com borda colorida superior: Total, Com Pendência (%), Simultânea, Somente Agenda, Somente TACH, Sem Pendência.
- **Gráfico donut** — distribuição por tipo de pendência com tooltip de percentual.
- **Gráfico de barras agrupado** — pendências de Agenda e TACH por semana.
- **Tabela paginada** com matrícula, nome, campus, curso, badge de tipo e contagem de semanas pendentes.
- Botão **Exportar CSV** com BOM UTF-8 (compatível com Excel).
- Botão **"Ver"** na tabela navega para `/revisar` (tela de detalhamento do docente).
