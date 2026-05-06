# Research: Trampolins, Guardrails e Distribuição de Templates

**Data:** 2026-05-06
**Domínio:** CLI Workflow e Integração do Consumidor
**Relacionado a:** `[DEC-0019-B01]` e Setup Determinístico

## 1. O Problema

1. O CLI do ai-guidelines hoje não distribui as pastas de templates (`.specify/templates/`) para os repositórios consumidores.
2. As regras de texto (como a `CORE-02`) carregam o caminho _hardcoded_ do repositório mãe (`.specify/specs/roadmap/backlog.md`), o que quebra quando aplicadas num consumidor se o caminho local não for idêntico.
3. Consumidores usam múltiplas extensões (Claude Code, Cursor, GitHub Copilot) que geram seus próprios arquivos (`CLAUDE.md`, `.cursorrules`), levando a drift da fonte canônica (`AGENTS.md`).

## 2. Evidência e Insight do Usuário

- "O ideal é copiar para dentro de um arquivo `.ai-guidelines/templates` no repo consumidor."
- "Se sugerimos uma estrutura de pastas na cli, que o usuário pode alterar, mas será essa estrutura que será referenciada."

## 3. Análise: Paths Hardcoded no Runtime

Se as regras do `ai-guidelines` (no `rules.json`) contêm strings fixas como `.specify/`, o compilador ao gerar o `AGENTS.md` num repositório que adotou a pasta `.ai-guidelines/` estaria apontando para o lugar errado.

**Solução técnica via CLI:**
O CLI, durante o `init/adopt`, pode definir uma chave no `ai-guidelines.config.json` (ou simplesmente perguntar o diretório base, padrão `.ai-guidelines/`).
No compilador (`compiler.mjs`), as regras devem usar uma interpolação de string (`{{SDD_DIR}}` ou `{{BASE_DIR}}`), que será substituída no momento da compilação pelo caminho real configurado no projeto alvo.

## 4. Trampolins e Guardrails (`.claudeignore`, `CLAUDE.md`, etc)

**Benchmark:** Ferramentas modernas injetam arquivos "trampolim" que redirecionam o comportamento da IDE para um arquivo central.
Se o consumidor usa Claude, a presença de um `CLAUDE.md` é iminente. O ideal é o `ai-guidelines cli` gerar um `CLAUDE.md` restrito que _apenas_ contenha: `Please refer to AGENTS.md for all system instructions.` Isso evita a fragmentação (Context Rot).
Além disso, gerar um `.claudeignore` padronizado pode excluir `node_modules`, pastas de build e evitar a sobrecarga de tokens indevidos no contexto do agente.

## 5. Próximos Passos

Essas diretrizes ajudam a formar as opções do `decision-brief.md` em `[DEC-0019-B01]`:

- Definir como os paths dinâmicos (templates) interagirão com as regras do catálogo que hoje são estáticas.
- Decidir se o CLI pergunta o diretório de instalação e o registra no repositório do consumidor.
