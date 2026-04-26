# Diagnóstico: Falha de Compliance SDD & Arquitetura de Governança v2

**Data**: 2026-04-21
**Spec**: 0004 — Vaga E (Governance Refactor)
**Contexto**: Nenhum agente de IA (Gemini CLI, Claude Code, Cursor) tem
respeitado consistentemente a Prime Directive (Agnostic SDD Override).
A spec 0004.1 tentou resolver via "System Prompts Militares" (Phase 0-3)
mas a compliance permanece inconsistente.

---

## 1. Evidência Empírica da Falha

### Caso 1: Gemini CLI (Antigravity)

O sistema de Planning Mode do Antigravity **obriga** a criação de um
`implementation_plan.md` em `~/.gemini/antigravity/brain/<id>/`. Não há
flag para desativar. O agente cria o plano no artifact efêmero mesmo
quando o `AGENTS.md` diz para usar `.specify/specs/`.

### Caso 2: Claude Code (Antigravity)

O sistema injeta `user_rules` com **3 cópias** do AGENTS.md (uma por
repo no workspace) + 1 cópia do GEMINI.md global. O modelo recebe ~500
linhas de regras redundantes antes mesmo de processar o prompt.

### Caso 3: Autocrítica desta sessão

Nesta mesma sessão, o agente (Claude via Antigravity) criou o plano da
Vaga E como artifact efêmero. A mantenedora precisou intervir para que o
plano fosse transposto para `.specify/specs/`. Demonstração viva do
problema.

---

## 2. Análise de Causa-Raiz

### 2.1 Redundância Diluidora (Signal-to-Noise)

A Prime Directive aparece em **5 locais** com formulações divergentes:

| Local                          | Formulação                                                     | Tokens aprox. |
| ------------------------------ | -------------------------------------------------------------- | ------------- |
| `AGENTS.md` Phase 0            | "Sempre priorize a estrutura canônica..."                      | ~120          |
| `global-rules.md` Regra 14     | "Toda inteligência [...] DEVEM ser persistidos..."             | ~80           |
| `~/.gemini/GEMINI.md` Regra 11 | "proponha um plano (`implementation_plan.md`)" — **CONTRADIZ** | ~60           |
| `docs/rpi-protocol.md` §2      | "Agnostic SDD Override" — versão explicativa                   | ~150          |
| `user_rules` (Claude)          | 3× AGENTS.md + 1× GEMINI.md                                    | ~800          |

**Efeito "Lost in the Middle"**: pesquisa de mercado (2025-2026) confirma
que LLMs deprioritizam instruções repetidas com variação. Quando a mesma
regra aparece em múltiplos formatos, o modelo trata como ruído e segue
seu comportamento default.

**Fonte**: "AI agents ignore repository rules [...] these files should be
treated as suggestions or hints rather than hard, enforceable rules"
(Industry consensus, 2026).

### 2.2 Contradição Ativa

O `~/.gemini/GEMINI.md` (Custom Instructions globais) contém:

> Regra 11: "Planejamento Prévio: [...] proponha um plano
> (`implementation_plan.md`) para aprovação."

Esta regra **instrui explicitamente** o agente a criar um artifact
efêmero. Ela chega ao modelo **antes** do AGENTS.md na hierarquia de
contexto, pois `user_rules` > `project_rules` na maioria das
plataformas.

### 2.3 Confusão de Escopo

| Arquivo            | Escopo Pretendido       | Escopo Real                                  |
| ------------------ | ----------------------- | -------------------------------------------- |
| `AGENTS.md`        | Contrato do repo        | Mistura workflow + Prime Directive + SDD     |
| `global-rules.md`  | Constituição cross-repo | Mistura UI/design + Prime Directive + tokens |
| `GEMINI.md` global | Propagação Gemini       | Cópia parcial com contradições               |
| `rules/claude.md`  | Adaptador Claude        | 3 linhas úteis                               |
| `rules/gemini.md`  | Adaptador Gemini        | Instruções de ignore, sem Prime Directive    |

**Nenhum arquivo tem Responsabilidade Única.**

### 2.4 Bloco Canônico Desatualizado

O bloco `<!-- BEGIN:ai-guidelines-core -->` injetado nos repos satélites
foi escrito **antes** da spec 0004.1 e não
contém Phase 0-3. Além disso, as regras locais desses repos (linhas
7-8-10) prescrevem `.ai-runtime/active-plan.md`, contradizendo a Prime
Directive que diz para usar `.specify/specs/`.

---

## 3. Benchmarks de Mercado: Context Engineering (2026)

### 3.1 Princípio de Responsabilidade Única para Prompt Files

A indústria convergiu para tratar arquivos de instrução como código:

- **Modular Prompt Design**: quebrar system prompts em seções distintas
  (Role, Rules, Tools, Output Format).
- **Regra de Ouro**: se uma instrução é ignorada, não adicione mais
  texto — simplifique ou reformule.

### 3.2 Hierarquia de Prioridade

```
1. System Prompt (hardcoded pela plataforma)
2. User-Level Config (~/.claude/, ~/.gemini/) ← CHEGA PRIMEIRO
3. Project-Level Docs (./AGENTS.md, ./CLAUDE.md)
4. Task Context (prompt do usuário)
```

**Implicação**: regras em `~/.gemini/GEMINI.md` têm precedência natural
sobre `AGENTS.md`. Se houver conflito, o global vence.

### 3.3 Guardrails Programáticos > Instruções Textuais

"If a rule is critical, relying on an AGENTS.md file is insufficient —
you must build programmatic guardrails and unit tests" (Industry, 2026).

**Aplicação**: o CLI `ai-guidelines` pode incluir um comando `audit` que
detecta conflitos entre configs globais e a Prime Directive do repo.

---

## 4. Arquitetura Proposta: Responsabilidade Única

### Camada 1: Fonte Única da Prime Directive

**`AGENTS.md` (raiz)** — Phase 0 imperativo e curto:

- Planejamento → `.specify/specs/<slug>/plan.md`
- Progresso → `.specify/specs/<slug>/tasks.md`
- Débitos → `.specify/specs/<slug>/NEXT.md`
- Artifact forçado → escrever apenas pointer

### Camada 2: Constituição Cross-Repo

**`rules/global-rules.md`** — apenas princípios não-operacionais:

- Idioma, segurança, design, economia de tokens
- Referência ao AGENTS.md para workflow
- **SEM** git, branch, format, Prime Directive (já no AGENTS.md)

### Camada 3: Propagação Global

**`~/.gemini/GEMINI.md`** — pointer mínimo:

- "Consulte AGENTS.md do repositório"
- **SEM** regras operacionais próprias

### Camada 4: Bloco Canônico (repos satélites)

**`<!-- BEGIN:ai-guidelines-core -->`** — versão enxuta:

- Inclui Phase 0 (Prime Directive)
- Remove duplicações com regras locais

---

## 5. Relação com Spec 0004.1

A spec 0004.1 (SDD Contingency) diagnosticou corretamente o problema
("scratchpads efêmeros") e pesquisou as abordagens por plataforma. No
entanto, a solução proposta ("System Prompts Militares") atacou o
sintoma (texto mais enfático) e não a causa-raiz (arquitetura
redundante e contraditória).

Esta Vaga E complementa a 0004.1 com a reestruturação arquitetural
necessária para que o texto do Phase 0 seja efetivamente seguido.

---

_Pesquisa concluída para task E.1 da spec 0004._
