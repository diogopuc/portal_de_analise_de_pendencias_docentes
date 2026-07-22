# Changelog — Backend

Alterações em `backend/src/` (rotas, entidades, readers, generators, config).

| Peso | Quando usar |
|------|-------------|
| MAJOR | Reescrita de arquitetura, breaking change |
| MINOR | Nova funcionalidade, refactor expressivo |
| PATCH | Bugfix, ajuste pequeno |

---

## [v1.0.0] — 2026-07-10 · MAJOR

### Lançamento inicial
- API REST com Express 4.
- Leitura de planilha Excel com `xlsx`.
- Geração de relatórios PDF individuais com `pdf-lib` (cabeçalho PUCPR `#8A0538`).
- Download em lote via ZIP com `archiver`.
- Upload de planilha via `multer`.
- Endpoints: `/api/dashboard`, `/api/docentes`, `/api/relatorios/*`.

---

## [v1.0.2] — 2026-07-15 · PATCH

### Corrigido
- Divergências de resultado e cache entre planilha e PDFs gerados corrigidas.
- Status `FINALIZADO` mapeado corretamente como pendência de TACH.
- Semanas abonadas ocultas do relatório PDF.
- Layout do PDF: sobreposição de elementos, bordas arredondadas, logo branca no cabeçalho.
- `AGUARDANDO APROVAÇÃO` tratado como ignorado (sem pendência) em Agenda e TACH.

---

## [v1.0.3] — 2026-07-17 · PATCH

### Corrigido
- Download ZIP filtrado por tipo de pendência (Simultâneas, Somente Agenda, Somente TACH) adicionado em `routes/relatorios.ts`.
- Normalização de campus no backend: `.trim().toUpperCase()` antes de agrupar por campus.

---

## [v1.1.0] — 2026-07-18 · MAJOR

### Refatorado — Arquitetura DDD
- Backend reestruturado em camadas:
  - `domain/entities/` — `Docente`, `DadosSemana`
  - `domain/repositories/` — `IDocenteRepository` (interface)
  - `domain/services/` — `PendenciaService` (regras de negócio)
  - `domain/value-objects/` — `StatusTach`
  - `application/use-cases/` — `ProcessarPlanilhaUseCase`, `GerarRelatorioUseCase`, `ObterDashboardUseCase`
  - `infrastructure/readers/` — `ExcelPlanilhaReader`
  - `infrastructure/generators/` — `PdfRelatorioGenerator`
  - `infrastructure/repositories/` — `InMemoryDocenteRepository`
  - `config/semanas.config.ts` — único arquivo a editar ao mudar de mês
- `PendenciaService` encapsula todas as regras de Agenda e TACH.
- `InMemoryDocenteRepository` implementa `IDocenteRepository`.

---

## [v1.2.0] — 2026-07-21 · MINOR

### Corrigido (bugs críticos de runtime)
- **Race condition no boot** (`index.ts`): `inicializar()` passou a ser aguardado com `await` antes de `app.listen()`. Antes, o servidor aceitava requisições com o repositório ainda vazio.
- **Reprocessar zerava todos os dados** (`routes/relatorios.ts`): backend buscava `Atv_Pendentes_Abril.xlsx` (hardcoded) enquanto `SEMANAS_CONFIG` tinha abas de junho → 0 docentes após `repositorio.limpar()`. Substituído por auto-descoberta de qualquer `.xlsx` em `data/`.

---

## [v1.3.0] — 2026-07-22 · MINOR

### Adicionado
- `strict: true` habilitado em `backend/tsconfig.json` — erros de tipo agora detectados pelo compilador e IDE.

---

## [v1.3.1] — 2026-07-22 · PATCH

### Corrigido
- **Prefixo numérico do curso** (`ExcelPlanilhaReader.ts`): a planilha armazena o curso como `{CÓDIGO} - {NOME}` (ex: `4093 - DIREITO - ADM - CTBA`). O prefixo numérico é agora removido na leitura com `/^\d+\s*-\s*/`, armazenando apenas o nome descritivo.

---

## [v1.4.0] — 2026-07-22 · MINOR

### Adicionado — Infraestrutura backend para 6 funcionalidades

#### Config dinâmica
- `semanas.config.ts`: refatorado com `lerConfig()` (lê `data/semanas.config.json`) e `salvarConfig()`. Exportações estáticas mantidas para compatibilidade.
- `ExcelPlanilhaReader.ts` e `ObterDashboardUseCase.ts`: passaram a chamar `lerConfig()` a cada execução — alterações de config têm efeito sem restart.
- `routes/config.ts` (novo): `GET /api/config/semanas` e `PUT /api/config/semanas`.

#### Snapshots / Histórico
- `ProcessarPlanilhaUseCase.ts`: salva snapshot JSON em `data/historico/{timestamp}.json` após cada processamento bem-sucedido.
- `routes/historico.ts` (novo): `GET /api/historico`, `GET /api/historico/:file`, `GET /api/historico/comparar?de=&para=` (compara dois snapshots e retorna `regularizados`, `novasPendencias`, `delta`).

#### Excel consolidado
- `routes/docentes.ts`: `GET /api/docentes/exportar-excel` — gera `.xlsx` com ExcelJS filtrado por campus, curso, tipoPendencia, busca. Cabeçalho estilizado com `#8A0538`.

#### E-mail
- `nodemailer` instalado.
- `routes/email.ts` (novo): `POST /api/email/enviar` — lê configuração SMTP de variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`), anexa o PDF do docente e envia.
- `index.ts`: rotas `/api/config`, `/api/historico` e `/api/email` registradas. `HISTORICO_DIR` criado no boot.
