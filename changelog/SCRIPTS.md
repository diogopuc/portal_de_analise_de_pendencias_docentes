# Changelog — Scripts de Inicialização

Alterações em `iniciar_projeto.ps1`, `iniciar_projeto.bat` e arquivos de configuração de ambiente.

| Peso | Quando usar |
|------|-------------|
| MAJOR | Reescrita completa do fluxo de inicialização |
| MINOR | Nova funcionalidade no script |
| PATCH | Bugfix, ajuste de compatibilidade |

---

## [v1.0.0] — 2026-07-10 · MAJOR

### Lançamento inicial
- `iniciar_projeto.bat`: detecta Node.js, instala dependências, inicia backend (porta 3001) e frontend (porta 3000), abre navegador.
- `iniciar_projeto.ps1`: versão PowerShell do script de inicialização.

---

## [v1.0.1] — 2026-07-12 · PATCH

### Corrigido
- Reescrita do `.bat` sem dependência do `.ps1` com polling de porta para aguardar o backend subir.
- Encoding corrigido para ASCII/CRLF, eliminando caracteres corrompidos no terminal.
- `%~dp0` substituiu `BASE_DIR` para resolver caminhos corretamente.
- `rundll32` usado para abrir o navegador de forma compatível.
- Portas 3000 e 3001 liberadas automaticamente antes de iniciar os processos.
- Download automático do Node.js 20 portable quando não encontrado no sistema.
- Menu de controle persistente com opções de navegador e encerramento.
- Migração da lógica principal para `.ps1` com `$PSScriptRoot` para resolver encoding de caminhos com espaços.
- `start /B` com saída suprimida para manter tudo em uma janela.
