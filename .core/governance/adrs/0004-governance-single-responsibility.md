# ADR 0004 — Governança de Responsabilidade Única

**Status**: **Superseded by ADR 0008** (Governança Monolítica)
**Originalmente aceita**: 2026-04-21 (Spec 0004 — Vaga E, Governance Refactor)
**Superseded**: 2026-05-17 (Spec 0021 sub-bloco 4.B.4)

---

> **Nota de supersessão (2026-05-17):** a decisão original — **Responsabilidade Única por arquivo de governança** — foi efetivamente absorvida por [`ADR 0008 — Governança Monolítica`](./0008-monolithic-runtime-compiler-governance.md), aceita 9 dias depois (2026-04-30).
>
> Sob a arquitetura monolítica, a Prime Directive **não vive mais em arquivos separados** que precisam ser coordenados. Ela é compilada in-line no bloco `<AI_GUIDELINES>` do `AGENTS.md` consumidor, garantindo por construção que existe em **exatamente um lugar canônico** — a propriedade-objetivo de 0004 virou consequência emergente do monolítico, não política explícita a ser enforced documento por documento.
>
> O documento permanece preservado como **rastro histórico** do caminho da decisão: registra o diagnóstico (Lost-in-the-Middle, contradição entre `~/.gemini/GEMINI.md` e `AGENTS.md`, 5 lugares com formulações divergentes) que motivou tanto este ADR quanto a arquitetura monolítica subsequente. Nenhuma das mudanças aplicadas listadas abaixo precisa ser re-executada — todas foram absorvidas pelo cutover monolítico.

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
- `.core/process/rpi-protocol.md` §2 (versão explicativa)
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
