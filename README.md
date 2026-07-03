<div align="center">

<img src="assets/logoPUCPR.png" alt="PUCPR" width="200" />

# Portal de Análise de Pendências Docentes

**Sistema fullstack de automação para análise semanal de pendências de TACH e Agenda**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)

*Desenvolvido por **Diogo José Varaschin de Oliveira** — Grupo Marista · GPCA*

</div>

---

## Sobre o Projeto

O **Portal de Análise de Pendências Docentes** automatiza o processo de análise semanal de pendências relacionadas a **TACH** (Termo de Atribuição de Carga Horária) e **Agenda** dos docentes da PUCPR.

O processo era feito manualmente — planilha por planilha, docente por docente. O portal centraliza tudo em uma interface moderna, gera relatórios PDF individuais ou em lote e exibe dashboards analíticos em tempo real.

### Objetivos

- Processar automaticamente planilhas Excel mensais
- Identificar e classificar pendências de Agenda e TACH por docente
- Gerar relatórios PDF individuais com cabeçalho institucional da PUCPR
- Gerar todos os PDFs em lote com download via ZIP (geral ou por tipo de pendência)
- Exibir dashboards gerenciais com gráficos interativos
- Filtrar, buscar e paginar os dados por campus e tipo de pendência

---

## Interface

| Tela | Descrição |
|------|-----------|
| **Painel** | Dashboard com StatCards, gráficos de barras e pizza, rankings por campus e distribuição de status TACH |
| **Relatórios** | Tabela paginável com filtros, upload de planilha, reprocessamento e geração de PDFs em lote |
| **Revisar Relatório** | Navegação lateral entre docentes com detalhamento semanal completo (CH, horas, saldo e status por dia) |
| **Todos os Relatórios** | Central de PDFs gerados com busca, download individual e em ZIP |
| **Análise** | Documentação interativa das regras de negócio, fluxo de processamento e status do TACH |

---

## Stack Tecnológica

### Backend
| Tecnologia | Uso |
|------------|-----|
| **Node.js 20** | Runtime (portable, sem instalação) |
| **Express 4** | API REST |
| **TypeScript 5** | Tipagem estática |
| **xlsx** | Leitura da planilha Excel |
| **pdf-lib** | Geração de PDFs |
| **archiver** | Compactação ZIP |
| **multer** | Upload de arquivos |
| **nodemon + ts-node** | Hot reload em desenvolvimento |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **React 19** | UI |
| **Vite 8** | Bundler (rolldown) |
| **TypeScript** | Tipagem |
| **TailwindCSS v4** | Estilização |
| **React Query v5** | Cache e data fetching |
| **Recharts** | Gráficos |
| **Lucide React** | Ícones |
| **React Router v7** | Roteamento SPA |
| **Axios** | Requisições HTTP |

> **Persistência:** 100% em arquivos Excel (`.xlsx`). Nenhum banco de dados necessário.

---

## Estrutura do Projeto

```
4 - Pendencias_Agenda_E_TACH/
│
├── assets/                         # Logos institucionais (PUCPR)
│
├── backend/
│   └── src/
│       ├── index.ts                # Entrypoint — inicializa dados antes de ouvir na porta
│       ├── config/
│       │   └── semanas.config.ts   # ← ÚNICO ARQUIVO A EDITAR AO MUDAR DE MÊS
│       ├── domain/
│       │   ├── entities/           # Docente, DadosSemana
│       │   ├── repositories/       # IDocenteRepository (interface)
│       │   ├── services/           # PendenciaService (regras de negócio)
│       │   └── value-objects/      # StatusTach
│       ├── application/
│       │   └── use-cases/          # ProcessarPlanilha, GerarRelatorio, ObterDashboard
│       ├── infrastructure/
│       │   ├── readers/            # ExcelPlanilhaReader
│       │   ├── generators/         # PdfRelatorioGenerator
│       │   └── repositories/       # InMemoryDocenteRepository
│       ├── routes/                 # dashboard.ts, docentes.ts, relatorios.ts
│       ├── middleware/             # errorHandler.ts
│       └── shared/constants/       # tach.constants.ts
│
├── frontend/
│   └── src/
│       ├── index.css               # Design tokens + classes utilitárias (PUCPR)
│       ├── services/api.ts         # Camada de comunicação com o backend
│       ├── components/
│       │   ├── layout/             # Header, Sidebar, Footer, Layout
│       │   └── ui/                 # Card, Toast, Skeleton
│       └── pages/
│           ├── Painel.tsx
│           ├── Relatorios.tsx
│           ├── RevisarRelatorio.tsx
│           ├── TodosRelatorios.tsx
│           └── Analise.tsx
│
├── data/
│   ├── *.xlsx                      # Planilha fonte (descoberta automaticamente)
│   ├── relatorios/                 # PDFs gerados
│   ├── logs/                       # Logs de operação
│   └── cache/
│
├── iniciar_projeto.ps1             # Script principal (PowerShell) — recomendado
└── iniciar_projeto.bat             # Alternativa para duplo clique
```

---

## Como Executar

### Opção 1 — Script automático (recomendado)

Dê **duplo clique** em `iniciar_projeto.bat` ou execute no PowerShell:

```powershell
.\iniciar_projeto.ps1
```

O script irá automaticamente:
1. Detectar ou baixar o Node.js 20 portable
2. Instalar dependências do backend e frontend (apenas na primeira vez)
3. Criar o arquivo `.env` se necessário
4. Liberar as portas 3000 e 3001
5. Iniciar o backend na porta `3001` (aguarda a porta abrir antes de continuar)
6. Iniciar o frontend na porta `3000`
7. Abrir o navegador em `http://localhost:3000`

### Opção 2 — Manual

**Pré-requisito:** Node.js 18+ instalado

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:3000**

---

## Configuração ao Mudar de Mês

Edite **apenas** o arquivo `backend/src/config/semanas.config.ts`:

```ts
export const SEMANAS_CONFIG = [
  { aba: '01.06', semana: 'Semana 01', periodo: '01/06 a 07/06' },
  { aba: '08.06', semana: 'Semana 02', periodo: '08/06 a 14/06' },
  // ...
];

// Semanas com feriado que abona a semana inteira
export const SEMANAS_ABONADAS: Record<string, string> = {
  '01.06': 'Feriado: Corpus Christi (04/06/2026)',
};
```

- `aba` — nome **exato** da aba na planilha Excel
- Semanas em `SEMANAS_ABONADAS` não geram pendência e não aparecem no PDF
- Coloque a nova planilha na pasta `data/` — o sistema a detecta automaticamente

---

## Regras de Negócio

### Pendência de Agenda

```
Horas a Alocar > 0  →  Pendência de Agenda
```

### Pendência de TACH

Status que **geram pendência** (exibidos no relatório):

| Status | Situação |
|--------|----------|
| NÃO CRIADO | TACH não foi criado no sistema |
| NECESSÁRIO AJUSTAR | Devolvido para correção |
| RASCUNHO | Em elaboração, não submetido |
| FINALIZADO | Finalizado por importação — docente precisa refazer |

Status **ignorados** (não geram pendência):

| Status | Motivo |
|--------|--------|
| APROVADO | Sem pendência |
| AGUARDANDO APROVAÇÃO | Tratado como aprovado |

### Classificação Final do Docente

| Tipo | Condição |
|------|----------|
| `somente_agenda` | Apenas pendência de Agenda |
| `somente_tach` | Apenas pendência de TACH |
| `simultanea` | Agenda **e** TACH com pendência |
| `sem_pendencia` | Nenhuma pendência identificada |

### Semanas Abonadas

Semanas cadastradas em `SEMANAS_ABONADAS` são marcadas como feriado/recesso. Nessas semanas, pendências de Agenda e TACH são desconsideradas para o docente.

---

## Relatórios PDF

Cada PDF gerado contém:

- **Cabeçalho institucional** com logo da PUCPR (cor `#8A0538`)
- **Saudação personalizada**: *"Olá, Prof(a). [Nome]. Segue o detalhamento das pendências..."*
- **Resumo visual** de status (Agenda e TACH)
- **Detalhamento por semana** com CH de contrato, horas a alocar, saldo e status TACH por dia
- **Rodapé** com data de geração

**Nomenclatura:**
```
NOME_COMPLETO_DO_DOCENTE_MATRICULA.pdf
```

**Downloads disponíveis:**
- PDF individual por docente
- ZIP com todos os PDFs
- ZIP filtrado por tipo: Simultâneas, Somente Agenda, Somente TACH

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Status do servidor |
| `GET` | `/api/dashboard` | Dados do dashboard |
| `GET` | `/api/docentes` | Lista de docentes (paginada + filtros) |
| `GET` | `/api/docentes/:matricula` | Docente específico |
| `GET` | `/api/docentes/campus/lista` | Lista de campus |
| `POST` | `/api/relatorios/processar` | Processa planilha (upload ou arquivo em `data/`) |
| `POST` | `/api/relatorios/gerar/:matricula` | Gera PDF individual |
| `POST` | `/api/relatorios/gerar-todos` | Gera todos os PDFs em lote |
| `GET` | `/api/relatorios/lista` | Lista PDFs gerados |
| `GET` | `/api/relatorios/download/:arquivo` | Download de PDF |
| `GET` | `/api/relatorios/visualizar/:arquivo` | Visualizar PDF no navegador |
| `GET` | `/api/relatorios/download-zip/todos` | ZIP com todos os PDFs |
| `GET` | `/api/relatorios/download-zip/simultaneas` | ZIP — Pendências simultâneas |
| `GET` | `/api/relatorios/download-zip/somente-agenda` | ZIP — Somente Agenda |
| `GET` | `/api/relatorios/download-zip/somente-tach` | ZIP — Somente TACH |
| `DELETE` | `/api/relatorios/:arquivo` | Exclui um PDF |
| `GET` | `/api/relatorios/status` | Status do processamento |
| `GET` | `/api/relatorios/logs` | Logs de operação |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (React 19)                 │
│   Painel │ Relatórios │ Revisar │ Todos │ Análise    │
│          React Query v5 + Axios + React Router v7    │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP REST (Vite proxy → :3001)
┌────────────────────▼─────────────────────────────────┐
│                  BACKEND (Express 4)                 │
│  /api/dashboard   /api/docentes   /api/relatorios    │
├──────────────────────────────────────────────────────┤
│                APPLICATION LAYER                     │
│  ProcessarPlanilhaUseCase │ GerarRelatorioUseCase    │
│  ObterDashboardUseCase                               │
├──────────────────────────────────────────────────────┤
│                  DOMAIN LAYER                        │
│  Docente │ DadosSemana │ PendenciaService            │
│  StatusTach │ IDocenteRepository                     │
├──────────────────────────────────────────────────────┤
│               INFRASTRUCTURE LAYER                   │
│  ExcelPlanilhaReader │ PdfRelatorioGenerator         │
│  InMemoryDocenteRepository                           │
├──────────────────────────────────────────────────────┤
│                  CONFIG LAYER                        │
│  semanas.config.ts  ←  único arquivo a editar/mês   │
├──────────────────────────────────────────────────────┤
│                 PERSISTÊNCIA (Excel)                 │
│  data/*.xlsx (descoberta automática)                 │
│  data/relatorios/  (PDFs gerados)                    │
└──────────────────────────────────────────────────────┘
```

---

## Design System

O projeto segue a identidade visual da PUCPR com design tokens centralizados em `frontend/src/index.css`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#8A0538` | Cor principal |
| `--color-primary-lightest` | `#E5C3D0` | Badges, destaques |
| `--surface-0` | `#F0F2F2` | Fundo da página |
| `--surface-2` | `#FFFFFF` | Cards |
| `--dur-2` | `240ms` | Transições padrão |
| `--shadow-card` | `0 4px 16px rgba(0,0,0,0.08)` | Sombra dos cards |

**Tipografia:**
- Títulos: **Poppins** (600, 700)
- Corpo: **Source Sans 3** (400, 600)

---

## Variáveis de Ambiente

Arquivo `backend/.env` (criado automaticamente pelo script):

```env
PORT=3001
NODE_ENV=development
DATA_DIR=../data
ASSETS_DIR=../assets
TEMP_DIR=../temp
```

---

## Autor

**Diogo José Varaschin de Oliveira**
Analista de Dados — Grupo Marista · GPCA

---

<div align="center">

**PUCPR © 2026 — Todos os direitos reservados.**

*Portal de Análise de Pendências Docentes — Grupo Marista*

</div>
