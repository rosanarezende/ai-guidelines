# ADR 0004 — Governança de Responsabilidade Única

**Status**: Aceita
**Data**: 2026-04-21
**Spec**: 0004 — Vaga E (Governance Refactor)

---

## Contexto

Todos os agentes de IA (Gemini CLI, Claude Code, Cursor) ignoravam
consistentemente a Prime Directive (Agnostic SDD Override), criando
planos efêmeros em vez de persistir em `.specify/specs/`.

### Diagnóstico

A Prime Directive aparecia em **5 locais** com formulações divergentes:

- `AGENTS.md` Phase 0 (formulação densa)
- `rules/global-rules.md` Regra 14 (cópia com variação)
- `~/.gemini/GEMINI.md` Regra 11 (**contradição ativa** — instruía
  criação de `implementation_plan.md`)
- `docs/rpi-protocol.md` §2 (versão explicativa)
- `user_rules` injetadas por plataformas (3× AGENTS.md + 1× GEMINI.md)

O efeito "Lost in the Middle" fazia os modelos tratarem a regra repetida
como ruído. A contradição no GEMINI.md (config global) sobrepunha o
AGENTS.md (project-level) na hierarquia de prioridade da maioria das
plataformas.

## Decisão

Adotar **Responsabilidade Única** por arquivo de governança:

| Camada            | Arquivo                       | Responsabilidade                        |
| ----------------- | ----------------------------- | --------------------------------------- |
| 1. Fonte Única    | `AGENTS.md` (raiz)            | Contrato operacional + Prime Directive  |
| 2. Constituição   | `rules/global-rules.md`       | Princípios de engenharia — SEM workflow |
| 3. Propagação     | `~/.gemini/GEMINI.md`         | Pointer mínimo — SEM regras             |
| 4. Bloco canônico | `<!-- ai-guidelines-core -->` | Versão para repos satélites             |

### Mudanças aplicadas

1. **AGENTS.md Phase 0**: Reescrita no formato imperativo com lista
   (vs. parágrafo denso), marcado como `[INQUEBRÁVEL]`.
2. **global-rules.md**: Removidas regras 3 (git), 7 (IA log), 11 (RPI),
   12 (PR checklist), 14 (Prime Directive — duplicação central).
   Reorganizado em seções de Responsabilidade Única.
3. **GEMINI.md**: Esvaziado. Apenas pointer para AGENTS.md dos repos.
   Regra 11 (contradição) eliminada.
4. **rpi-protocol.md**: Duplicação da Prime Directive substituída por
   referência ao AGENTS.md Phase 0.

## Consequências

### Positivas

- Prime Directive existe em **exatamente 1 lugar** canônico.
- Zero contradições entre configs globais e project-level.
- Contexto enviado ao modelo é ~60% menor (menos regras duplicadas).

### Negativas / Riscos

- Repos satélites mantêm bloco canônico
  desatualizado até serem atualizados pelo CLI `adopt`.
- Plataformas com planning modes forçados (ex: Antigravity) continuarão
  criando artifacts efêmeros — a regra do Pointer mitiga, não elimina.

### Ação futura

- Feature de **detecção de conflitos globais** no CLI (registrada no
  ROADMAP (ver `roadmap/backlog.md` pós-Spec 0008)) para alertar sobre `~/.gemini/`, `~/.claude/`, etc.

---

_Pesquisa de suporte: `.specify/specs/researchs/0004-ai-dev-foundations-public-ready/governance-architecture-v2.md`_
