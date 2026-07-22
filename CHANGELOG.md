# Changelog

Histórico de versões do **Portal de Análise de Pendências Docentes**.
Formato: [versionamento semântico](https://semver.org/lang/pt-BR/) — `vMAJOR.MINOR.PATCH`

| Peso | Tipo | Quando usar |
|------|------|-------------|
| MAJOR | Reescrita / breaking | Mudança de arquitetura inteira, quebra de compatibilidade |
| MINOR | Feature / refactor significativo | Nova funcionalidade, melhoria expressiva de qualidade |
| PATCH | Bugfix / ajuste | Correção de erro, pequena melhoria, estilo |

---

## Changelogs por área

| Arquivo | Escopo |
|---------|--------|
| [changelog/BACKEND.md](changelog/BACKEND.md) | `backend/src/` — rotas, entidades, readers, generators, config |
| [changelog/FRONTEND.md](changelog/FRONTEND.md) | `frontend/src/` — páginas, componentes, design system, tipos |
| [changelog/SCRIPTS.md](changelog/SCRIPTS.md) | `iniciar_projeto.bat` / `.ps1` — scripts de inicialização |

---

## Versão atual: v1.3.1

| Data | Versão | Área | Resumo |
|------|--------|------|--------|
| 2026-07-10 | v1.0.0 | Full-stack | Lançamento inicial do portal |
| 2026-07-12 | v1.0.1 | Scripts/UI | Scripts de inicialização e fixes de layout |
| 2026-07-15 | v1.0.2 | Backend | Correções de PDF, TACH e semanas abonadas |
| 2026-07-17 | v1.0.3 | Full-stack | ZIP por tipo, campus normalizado, melhorias de UI |
| 2026-07-18 | v1.1.0 | Backend | Refatoração para arquitetura DDD |
| 2026-07-19 | v1.1.1 | Frontend | Design system com tokens de motion e surface layers |
| 2026-07-20 | v1.1.2 | Frontend | Padrões Claude Cookbooks (status-dot, docente-item) |
| 2026-07-21 | v1.2.0 | Full-stack | Fix race condition, xlsx auto-descoberta, hooks violados no Painel |
| 2026-07-21 | v1.2.1 | Frontend | Remoção de bordas coloridas e outline do Recharts |
| 2026-07-22 | v1.3.0 | Full-stack | TypeScript strict + correções críticas de tipos e URL de download |
| 2026-07-22 | v1.3.1 | Backend | Fix prefixo numérico do campo Curso na leitura do Excel |
