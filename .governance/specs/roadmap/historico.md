# Histórico — `.governance/specs/`

> Specs concluídas (arquivo narrativo). Ao fechar uma spec, mova a entrada de [`backlog.md` §Em execução](./backlog.md) para cá, mantendo o número como histórico. Cf. [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

## Concluídas

### Spec 0023 — Workflow Runtime (2026-05)

**Branch:** `feat/spec-0023-bootstrap-alignment`
**Stack:** PR #18 → #19 → #22 → #23 → #24 → #25 → #26 → Integration PR #27
**Versão:** `1.1.0`

Entregou o runtime operacional do ciclo governance-driven: wizard CLI de 8 opções (`ai-guidelines workflow`), briefing determinístico de spec ativa com gate de execução (`ai-guidelines continue`), enforcement L2 que bloqueia implementação sem planejamento, operações transacionais via GitHub CLI (Integration PR + merge atômico com modos `unit`/`sequential` e landed-via reconciliation), clipboard nativo multiplataforma (macOS, WSL2, Wayland, X11), e prompts visuais parametrizados com coleta local de contexto.

Decisões canônicas: ADR 0018 (IA como canal, não runtime), ADR 0020 (merge atômico), ADR 0021 (enforcement L2). Modelo de 3 boundaries (Execução / Prontidão / Pós-merge) como leitura determinística do estado da spec.
