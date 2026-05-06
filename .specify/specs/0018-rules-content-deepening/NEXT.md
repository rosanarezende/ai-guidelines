# NEXT — Débitos e Insights Spec 0018

> **Política:** este arquivo registra débitos conscientes, bugs identificados, insights sem prioridade imediata ou **tasks que vazaram do escopo da spec e serão resolvidos em specs futuras**. Será **deletado ao final da Spec 0018** (Fase 7 — Encerramento Pré-Merge), com itens migrados para `roadmap/backlog.md` conforme prioridade.
>
> **Diferença crítica:**
>
> - **Débitos a resolver NESTA spec (mesmo se não planejados):** ficam em `tasks.md` como sub-tasks de algum bloco existente, marcadas `[/]` (em progresso) com nota "_Pendente de commit_".
> - **Débitos a resolver em OUTRA spec futura:** ficam aqui em `NEXT.md` até o encerramento.
>
> Esta diferença não está documentada em `.core/process/spec-foundation.md` — vide **Débito A.7** abaixo.
>
> Criado: 2026-05-03 (durante Bloco B — sub-bloco B.3.2).

---

## 📝 Débitos Abertos

### Débito A.7 — Documentação: diferença entre débitos NEXT.md vs tasks.md em spec-foundation.md

**Origem:** identificado durante B.3.2 Green Phase (2026-05-03)  
**Constatado:** NEXT.md e tasks.md têm papéis que não estão explícitos em `spec-foundation.md`  
**Prioridade:** Média  
**Tipo:** Documentação de clarificação em `.core/process/spec-foundation.md`

**Descrição:**

A política _implícita_ desta spec é:

- Débitos/insights a resolver **nesta spec**, mesmo que não previstos originalmente → `tasks.md` (com subtasks vinculadas a um bloco existente)
- Débitos/insights a resolver **em specs futuras** ou que vazaram do escopo → `NEXT.md` (para migração em Fase 7)

Esta diferença não está explícita em `spec-foundation.md`, seção "Artefatos de Spec". Causa fricção ao tentar decidir "onde anoto este débito?".

**Proposta:**

Adicionar à seção "Política de NEXT.md" em `spec-foundation.md`:

> **Débitos desta spec vs Débitos de specs futuras:**
>
> - Se surge durante implementação um item que **será resolvido antes de Fase 7** (Encerramento Pré-Merge), anote em `tasks.md` como sub-task do bloco apropriado, com status `[/]` (_Pendente de commit_) e nota inline.
> - Se é um **débito consciente fora do escopo**, anotar em `NEXT.md` para decisão futura (Fase 7 migra para `roadmap/backlog.md`).
> - Checklist: "Se este item vai ser resolvido ANTES do merge desta spec? Sim → `tasks.md`. Não → `NEXT.md`."

**Onde vive:**

- Adicionar a `agents-core.md` como `[CORE-14]` após `[CORE-13]`
- Será injetado em B.3.5 (compiler refactor)
- Hoje não está injetado (catálogo paralelo)

**Task associada:**

- [x] Criar `[CORE-14]` em `agents-core.md`
- [ ] Validar schema YAML
- [ ] Cravar `_TODO in CORE-13` referenciando B.4 (ligação bidirecional)
- [ ] Testar injeção em B.3.5

### Débito B.7.1 — Spec 0011 (Regra-Hierarquia)

**Gatilho cravado:**
`agregado compilado ≥ 4,2 K tokens (= 70 % do teto de 6 K)`

O orçamento Tok-H e o threshold foram implementados no lint heurístico. Quando o teto soft for atingido, a Spec 0011 deve ser priorizada. Ao fim da 0018 (Fase 7), um apêndice no roadmap conterá um snapshot canônico do `<AI_GUIDELINES>` (medição Tok-H, listagem de regras, taxonomia final, cobertura de cross-refs) para que a 0011 inicie com um baseline conhecido.

### Débito B.7.2 — Spec 0009 (Harness-Engineering)

**Aviso de regressão:**
O eval mínimo da 0018 atua como `baseline-regression` no harness. Isso significa que **qualquer mudança em rules** invalida o baseline atual e exige uma re-rodada do pipeline da Spec 0009. Toda a infraestrutura completa de eval e sensores contínuos em CI está reservada para a 0009.

### Débito B.7.3 — Inovação Futura: Scaffolding Inteligente de Provedores

**Descrição:**
A CLI deverá detectar provedores ativos no projeto consumidor (heurística: presença de `CLAUDE.md`, `.codex/`, `gemini.md`) e gerar automaticamente:

1. **Arquivos restritivos** (estilo `.claudeignore`) focados em economia de contexto.
2. **Trampolins** (como um `CLAUDE.md` contendo apenas `@AGENTS.md` ou equivalente) para impedir drift entre o adapter file e a fonte canônica.
   Isso mitigará a degradação de contexto (_Context Rot_) e eliminará arquivos soltos não governados. Candidato forte a Spec autônoma após o merge da 0018.

### Seed B.9 — Artefatos de automação preservados para Spec 0009

**Origem:** Commits `4e0c12b`, `1f46138`, `2bb8c15` da branch `feat/spec-0018-rules-content-deepening` (2026-05-04).
**Contexto:** Implementados por IAs autônomas durante a execução da 0018, estes artefatos **antecipam a fronteira da Spec 0009** (harness-engineering) e foram deliberadamente **excluídos do entregável** da 0018 na sanitização de 2026-05-05. O `decision-brief.md` crava explicitamente em `[DEC-0018-B07]` Sub-eixo 1 = D que o eval automatizado fica para a 0009.

**Artefatos preservados no histórico git (não no entregável):**

| Arquivo                                          | Descrição                                                            | Commit    |
| :----------------------------------------------- | :------------------------------------------------------------------- | :-------- |
| `cli/governance/quality-gates/engine.mjs`        | Engine de quality-gates que mapeia tags de `rules.json` a detectores | `4e0c12b` |
| `cli/governance/quality-gates/detectors.mjs`     | Detectores estáticos (ex: `try-catch` vazio)                         | `4e0c12b` |
| `cli/governance/quality-gates/engine.test.mjs`   | Testes BDD do engine                                                 | `4e0c12b` |
| `cli/commands/ai-check.mjs`                      | CLI `ai:check` unificada (quality-gates + token-lint)                | `1f46138` |
| `cli/commands/ai-check.test.mjs`                 | Testes do ai-check                                                   | `1f46138` |
| `cli/governance/evaluation/eval-runner.mjs`      | Runner de avaliação que consome ai-check                             | `2bb8c15` |
| `cli/governance/evaluation/eval-runner.test.mjs` | Testes do eval-runner                                                | `2bb8c15` |

**Nota para a Spec 0009:** Os detectores são extremamente básicos (apenas 1 pattern: `catch {}` vazio). A arquitetura engine→detectors→rules.json é reutilizável mas precisa ser expandida com detectores reais para N+1, race conditions, memory leaks conforme as taxonomias em `research/2026-04-30-external-bug-taxonomies.md` e `research/2026-04-30-empirical-bugs-ai-code.md`. O script `ai:check` foi removido do `package.json` da 0018 — a 0009 deve re-adicioná-lo quando os detectores forem robustos.

### ~~Seed B.10 — Referências externas no rationale das regras~~ ✅ RESOLVIDO

**Origem:** Pesquisa `research/2026-05-05-akita-benchmark-analysis.md`
**Resolução (2026-05-05):** Decisão de unificar `external_evidence` dentro de `sources` com prefixo `EXT-*` + campo `validated_by_benchmark: true/false`. Implementado em:

- `_meta/sources-taxonomy.md` — taxonomia de prefixos e registro de referências externas
- `rules-parser.mjs` (L27, L273-283) — validação do campo `validated_by_benchmark`
- `global-rules.md` — GR-0001, GR-0004, GR-0005 populados com `EXT-AKITA-2026`; GR-0001 com `EXT-AIJAIL-2026`
- Cross-ref de descobribilidade adicionada no header de `global-rules.md`

### Seed B.11 — Secure Agent Execution (ai-jail + GR-0001)

**Origem:** Análise do [EXT-AIJAIL-2026] — `github.com/akitaonrails/ai-jail`
**Contexto:** O ai-jail resolve operacionalmente o que GR-0001 resolve textualmente: impedir que agentes IA acessem secrets desnecessariamente.

**Ação proposta (spec futura — candidata a spec autônoma):**

1. Documentar `ai-jail` como tooling recomendado no rationale da regra GR-0001
2. Explorar integração com o CLI: `npx ai-guidelines adopt --sandbox` poderia gerar `.ai-jail` com masks automáticas para patterns `.env*` + `credentials*`
3. Mapear o conceito de "lockdown mode" do ai-jail para nossa taxonomia de severidade (hard/soft → default/lockdown)

### ~~Seed B.12 — Anti-Slopsquatting Gate~~ ✅ RESOLVIDO

**Origem:** Deep research `benchmark-LLM-para-governanca-AI.md` (Sonar §3: 19,7% de alucinação de pacotes) + paper USENIX 2025.
**Resolução (2026-05-05):** Implementado como `[GR-0006] No autonomous dependency installation (Anti-Slopsquatting)` em `global-rules.md`. Sources: CWE-1357, OWASP-CICD-A06, EXT-SONAR-LLM-2026. Registrado em `sources-taxonomy.md`. Pipeline verde (40 regras, 0 erros).
