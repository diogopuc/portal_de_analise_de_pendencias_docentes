<div align="center">

<img src="assets/logoPUCPR.png" alt="PUCPR" width="200" />

# 📋 Portal de Análise de Pendências Docentes

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

## 📌 Sobre o Projeto

O **Portal de Análise de Pendências Docentes** automatiza integralmente o processo de análise semanal de pendências relacionadas a **TACH** (Termo de Atribuição de Carga Horária) e **Agenda** dos docentes da PUCPR.

Antes, esse processo era feito manualmente — planilha por planilha, docente por docente. O portal centraliza tudo em uma interface moderna, gera relatórios PDF individuais ou em lote, e exibe dashboards analíticos em tempo real.

### 🎯 Objetivos

- ✅ Processar automaticamente planilhas Excel semanais
- ✅ Identificar e classificar pendências por docente
- ✅ Gerar relatórios PDF individuais com cabeçalho institucional
- ✅ Gerar todos os PDFs em lote com download via ZIP
- ✅ Exibir dashboards gerenciais com gráficos interativos
- ✅ Filtrar, buscar e paginar os dados
- ✅ Registrar logs de todas as operações

---

## 🖼️ Interface

| Tela | Descrição |
|------|-----------|
| **Painel** | Dashboard com StatCards, gráficos de barras, pizza e rankings por campus |
| **Relatórios** | Tabela paginável com filtros, upload de planilha e geração em lote |
| **Revisar Relatório** | Navegação lateral entre docentes com detalhamento semanal completo |
| **Todos os Relatórios** | Histórico de PDFs gerados com download individual e em ZIP |
| **Análise** | Documentação das regras de negócio e fluxo do sistema |

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Uso |
|------------|-----|
| **Node.js 20** | Runtime |
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
| **React Router v7** | Roteamento |
| **Axios** | Requisições HTTP |

> 💡 **Persistência:** 100% em arquivos Excel (`.xlsx`). Nenhum banco de dados.

---

## 📁 Estrutura do Projeto

```
4 - Pendencias_Agenda_E_TACH/
│
├── 📂 assets/                    # Logos institucionais
│   ├── logoPUCPR.png
│   └── logoPUCRelatorio.png
│
├── 📂 backend/                   # API Node.js/Express
│   └── src/
│       ├── index.ts              # Entrypoint + inicialização automática
│       ├── types/index.ts        # Interfaces e constantes
│       ├── services/
│       │   ├── ExcelReaderService.ts     # Leitura e normalização do Excel
│       │   ├── ProcessingService.ts      # Consolidação e regras de negócio
│       │   └── PDFGenerationService.ts   # Geração de PDFs
│       ├── routes/
│       │   ├── dashboard.ts      # GET /api/dashboard
│       │   ├── docentes.ts       # GET /api/docentes
│       │   └── relatorios.ts     # POST/GET /api/relatorios
│       └── middleware/
│           └── errorHandler.ts   # Tratamento global de erros
│
├── 📂 frontend/                  # App React/Vite
│   └── src/
│       ├── App.tsx               # Roteamento principal
│       ├── main.tsx              # Entrypoint React
│       ├── index.css             # Tema TailwindCSS v4 + design tokens
│       ├── types/index.ts        # Tipos compartilhados
│       ├── services/api.ts       # Camada de comunicação com o backend
│       ├── components/
│       │   ├── layout/           # Header, Sidebar, Footer, Layout
│       │   └── ui/               # Card, Toast, Skeleton
│       └── pages/
│           ├── Painel.tsx        # Dashboard analítico
│           ├── Relatorios.tsx    # Processamento e geração de PDFs
│           ├── RevisarRelatorio.tsx   # Visualização detalhada por docente
│           ├── TodosRelatorios.tsx    # Central de PDFs gerados
│           └── Analise.tsx       # Regras de negócio e documentação
│
├── 📂 data/                      # Persistência em Excel
│   ├── Atv_Pendentes_Abril.xlsx  # Planilha fonte
│   ├── relatorios/               # PDFs gerados
│   ├── logs/                     # Logs de operação
│   └── cache/                    # Cache de processamento
│
├── 📂 scripts/
│   └── iniciar_projeto.bat       # Script de inicialização automática
│
└── Atv_Pendentes_Abril.xlsx      # Planilha original
```

---

## 🚀 Como Executar

### ▶️ Opção 1 — Script automático (recomendado)

Dê **duplo clique** em:

```
scripts/iniciar_projeto.bat
```

O script irá automaticamente:
1. Detectar ou instalar o Node.js
2. Instalar dependências do backend e frontend
3. Criar o arquivo `.env` se necessário
4. Iniciar o backend na porta `3001`
5. Iniciar o frontend na porta `3000`
6. Abrir o navegador automaticamente

---

### ▶️ Opção 2 — Manual

**Pré-requisito:** Node.js 18+ instalado

```bash
# 1. Instalar dependências do backend
cd backend
npm install

# 2. Instalar dependências do frontend
cd ../frontend
npm install

# 3. Iniciar o backend (em um terminal)
cd ../backend
npm run dev

# 4. Iniciar o frontend (em outro terminal)
cd ../frontend
npm run dev
```

Acesse: **http://localhost:3000**

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `backend/.env` (o script `.bat` faz isso automaticamente):

```env
PORT=3001
NODE_ENV=development
DATA_DIR=../data
ASSETS_DIR=../assets
TEMP_DIR=../temp
```

---

## 📊 Regras de Negócio

### Identificação do Docente
A **matrícula** é o identificador único. Cada docente é consolidado entre todas as semanas.

### Pendência de Agenda
```
(CH Total de Contrato − Horas a Alocar) > 0  →  Pendência de Agenda
```

| Resultado | Classificação |
|-----------|--------------|
| > 0 | ⚠️ Pendência de Agenda |
| = 0 | ✅ Sem Pendência |
| < 0 | 🔶 Inconsistência |

### Pendência de TACH

Status que **geram pendência** (exibidos no relatório):

| Status | Cor |
|--------|-----|
| 🔴 NÃO CRIADO | Pendência crítica |
| 🔴 NECESSÁRIO AJUSTAR | Devolvido para correção |
| 🟡 AGUARDANDO APROVAÇÃO | Submetido, aguardando |
| 🟣 RASCUNHO | Em elaboração |
| 🟢 FINALIZADO | Finalizado, aguardando aprovação |

> ✅ **APROVADO** — ignorado. Não aparece no relatório.

### Classificação Final

| Tipo | Condição |
|------|----------|
| `somente_agenda` | Apenas pendência de agenda |
| `somente_tach` | Apenas pendência de TACH |
| `simultanea` | Agenda **e** TACH com pendência |
| `sem_pendencia` | Nenhuma pendência |

### Abas Processadas

| Semana | Aba | Período |
|--------|-----|---------|
| Semana 01 | `01.04` | 01/04 |
| Semana 02 | `06.04` | 06/04 a 10/04 |
| Semana 03 | `13.04` | 13/04 a 17/04 |
| Semana 04 | `20.04` | 20/04 a 24/04 |
| Semana 05 | `27.04` | 27/04 a 30/04 |

> ⚠️ As abas `Resultado` e `Planilha2` são ignoradas.

---

## 📄 Relatórios PDF

Cada PDF gerado contém:

- **Cabeçalho institucional** com logo da PUCPR (cor `#8A0538`)
- **Saudação personalizada**: *"Olá, Prof(a). [Nome]. Segue o detalhamento das pendências ao longo do mês de Abril."*
- **Resumo visual** de status (Agenda e TACH)
- **Detalhamento por semana** com CH, Horas, Saldo e status por dia
- **Rodapé** com data de geração

**Nomenclatura do arquivo:**
```
NOME_COMPLETO_DO_DOCENTE.pdf
```
Ex: `ADALBERTO_CARAMORI_PETRY.pdf`

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Status do servidor |
| `GET` | `/api/dashboard` | Dados do dashboard |
| `GET` | `/api/docentes` | Lista de docentes (paginada, com filtros) |
| `GET` | `/api/docentes/:matricula` | Docente específico |
| `GET` | `/api/docentes/campus/lista` | Lista de campus |
| `POST` | `/api/relatorios/processar` | Processa a planilha |
| `POST` | `/api/relatorios/gerar/:matricula` | Gera PDF individual |
| `POST` | `/api/relatorios/gerar-todos` | Gera todos os PDFs |
| `GET` | `/api/relatorios/lista` | Lista PDFs gerados |
| `GET` | `/api/relatorios/download/:arquivo` | Download de PDF |
| `GET` | `/api/relatorios/download-zip/todos` | Download ZIP com todos |
| `DELETE` | `/api/relatorios/:arquivo` | Exclui um PDF |
| `GET` | `/api/relatorios/status` | Status do processamento |
| `GET` | `/api/relatorios/logs` | Logs de operação |

---

## 🎨 Design System

O projeto segue o **Guia de Estilo Visual PUCPR**:

| Token | Valor |
|-------|-------|
| Primary Pure | `#8A0538` |
| Primary Light | `#B20235` |
| Primary Lightest | `#E5C3D0` |
| Dark 01 | `#1E1E1E` |
| Light 02 | `#F0F2F2` |
| Success | `#4BB218` |
| Warning | `#E5000C` |
| Alert | `#FFD600` |

**Tipografia:**
- Títulos: **Poppins** (400, 500, 600, 700)
- Corpo: **Source Sans 3** (400, 600)

**Ícones:** Font Awesome 6.2.0 via **Lucide React**

---

## 📦 Dependências Principais

### Backend
```json
"xlsx": "^0.18.5",
"pdf-lib": "^1.17.1",
"archiver": "^6.0.1",
"express": "^4.19.2",
"multer": "^1.4.5-lts.1",
"cors": "^2.8.5"
```

### Frontend
```json
"react": "^19.2.6",
"recharts": "^3.8.1",
"lucide-react": "^1.16.0",
"@tanstack/react-query": "^5.100.11",
"react-router-dom": "^7.15.1",
"axios": "^1.16.1"
```

---

## 🏛️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                  │
│  Painel │ Relatórios │ Revisar │ Todos │ Análise     │
│              React Query + Axios                     │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP REST (proxy Vite → :3001)
┌───────────────────▼─────────────────────────────────┐
│                  BACKEND (Express)                   │
│   /api/dashboard   /api/docentes   /api/relatorios  │
├─────────────────────────────────────────────────────┤
│              CAMADA DE SERVIÇOS                      │
│  ExcelReaderService │ ProcessingService │ PDFService │
├─────────────────────────────────────────────────────┤
│              PERSISTÊNCIA (Excel)                    │
│  data/Atv_Pendentes_Abril.xlsx │ data/relatorios/   │
└─────────────────────────────────────────────────────┘
```

---

## 👤 Autor

**Diogo José Varaschin de Oliveira**
Analista de Dados — Grupo Marista · GPCA

---

<div align="center">

**PUCPR © 2026 — Todos os direitos reservados.**

*Portal de Análise de Pendências Docentes — Grupo Marista*

</div>
