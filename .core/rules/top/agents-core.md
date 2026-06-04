### AGENTS-core — Diretivas sempre-injetadas

> **Fonte canônica** das diretivas que o `compiler.mjs` insere no topo do bloco `<AI_GUIDELINES>` em todo `AGENTS.md` distribuído. Cutover aplicado em 5.B3.1.5.5 (2026-05-04): `pointers.mjs` consome `.core/rules/_meta/rules.json` via `compileCoreRulesContent()` filtrando `scope: universal` + `tags: core`. O template `.core/templates/AGENTS-core.md.tmpl` permanece apenas como **fallback** quando o catálogo está ausente/inválido (sem injeção dupla). Remoção definitiva do `.tmpl` é débito de B.7 / `NEXT.md`.
>
> **Convenção YAML cravada em 2026-05-03 (alinha com `5.B3.1` no `tasks.md`):** **Opção B — primeiro bloco fenced ` ```yaml ` imediatamente após cada heading de regra** (frontmatter `---` real foi descartado: não sobrevive a Prettier em arquivos multi-regra, pois o tooling padrão só reconhece frontmatter no início absoluto do arquivo). O `rules-parser.mjs` (B.3.2) detecta cada regra pelo padrão "heading de regra → próximo bloco fenced `yaml`". Categoria predominante aqui: `process`. Sources canônicas externas (CWE/CERT/Sonar/OWASP/paper) não se aplicam à maioria — diretivas operacionais ficam com `evidence_strength: declared_heuristic`. O ledger derivado em `.core/rules/_meta/agents-core-ledger.md` (B.3.4) será a interface humana de revisão crítica.
>
> **Regra editorial cravada (5.B3.1.5 / 2026-05-03):** `Instruction (en)` é runtime injetado pelo compiler em B.3.5 — deve ser **imperativa em 1–3 linhas**, sem tabelas, sem blocos de exemplo, sem rationale. Tabelas, exemplos, racional, "why" e "see also" vivem em `Documentação (pt-br)` ou seções dedicadas (docs-only).
>
> **Hierarquia de headings cravada:** este arquivo usa `###` no topo e `####` por regra para alinhar com `top/global-rules.md` / `base/quality/quality-gates.md`. Compiler em B.3.5 deve preservar esta hierarquia (ou rebaixá-la consistentemente) ao injetar no `<AI_GUIDELINES>` do `AGENTS.md` consumidor — `#`/`##` quebram a formatação do destino.

---

#### [CORE-01] Environment check antes da primeira ação

```yaml
id: CORE-01
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, environment]
```

**Instruction (en):**
Before the first technical action, identify platform, shell, surface (CLI vs IDE), and model class; adapt commands accordingly.

**Documentação (pt-br):**
Antes da primeira ação técnica, identifique o contexto situacional:

- Plataforma: Windows / Linux / macOS / WSL.
- Shell: bash / zsh / PowerShell / cmd.
- Surface: CLI agent (Claude Code, Gemini CLI) vs IDE (Cursor, Copilot).
- Modelo: identifique se está operando com um modelo "Thinking/Reasoning".
- Adapte comandos (ex.: `/dev/null` vs `NUL`, forward slashes) a essa matriz.

**Why this matters:** comandos hardcoded para um SO/shell quebram silenciosamente em outro. Falha rápida no início economiza loops de retry.

**See also:** `[CORE-08]` (HARNESS LOCK).

---

#### [CORE-02] Agnostic SDD Override — repositório como memória

```yaml
id: CORE-02
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, sdd, inquebrável]
```

**Instruction (en):**
The repository is your memory. Persist plans, progress, debts, knowledge, and roadmap under `.governance/specs/` (canonical per ADR 0019). Legacy artifacts under `.specify/specs/` resolve via double-lookup. Read `.governance/specs/roadmap/backlog.md` at session start (fallback to `.specify/specs/roadmap/backlog.md` if the new location is absent). If the platform forces a scratchpad, write only a pointer to the spec file. Planning trapped in agent cache (AI-slop) is unacceptable.

**Documentação (pt-br):**
**[INQUEBRÁVEL]** O repositório é sua memória, não seus artefatos internos. Locais canônicos em diante (cf. ADR 0019 — double-lookup com `.specify/specs/` como bridge legada):

- Planejamento → `.governance/specs/<NNNN>-<slug>/plan.md`
- Progresso → `.governance/specs/<NNNN>-<slug>/tasks.md`
- Débitos → `.governance/specs/<NNNN>-<slug>/NEXT.md`
- Conhecimento → `.governance/specs/<NNNN>-<slug>/research/`
- Roadmap → `.governance/specs/roadmap/backlog.md`
- Bootstrap obrigatório → leia `.governance/specs/roadmap/backlog.md` no início da sessão antes de executar ações de código, para identificar specs ativas, concorrência e prioridades (fallback `.specify/specs/roadmap/backlog.md` se ausente).
- Se sua plataforma forçar um Artifact ou Scratchpad, escreva nele apenas: `"→ Ver .governance/specs/<NNNN>-<slug>/plan.md"` (Pointer).
- "AI-Slop" (planejamento preso em cache de agente) é inaceitável.

**Why this matters:** planejamento em cache não sobrevive troca de sessão/agente. SDD repo-first é o que torna o framework agnóstico de IA.

**See also:** `[CORE-13]` (Artefatos vivos), `[CORE-11]` (Plano formado).

---

#### [CORE-03] Cross-ref para Regras Globais

```yaml
id: CORE-03
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, pointer]
```

**Instruction (en):**
Consult the "Global Rules" section injected later in this `<AI_GUIDELINES>` block for engineering principles and AI efficiency.

**Documentação (pt-br):**
Consulte a seção "Regras Globais" injetada neste bloco `<AI_GUIDELINES>` para princípios de engenharia e eficiência de IA.

**Why this matters:** cross-ref interno ao bloco compilado; evita IA pular a seção de regras universais.

> **Candidata a corte em B.3.5:** se o compiler for refatorado para deixar a hierarquia óbvia (core → global → opt-in), este pointer textual vira redundante.

---

#### [CORE-04] Nunca trabalhe direto em main/master

```yaml
id: CORE-04
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, branch]
```

**Instruction (en):**
Never start active modifications on `main` or `master`. Create a synthetic branch (`feat/`, `fix/`, `docs/`) before changing sources of truth.

**Documentação (pt-br):**
Nunca inicie modificações ativas operando sob a branch `main` ou `master`. Confirme seu estado de _working tree_ ou crie uma branch sintética (`feat/`, `fix/`, `docs/`) antes de alterar fontes de verdade.

**Why this matters:** trabalho direto em main desfaz revisão por PR e arrisca push acidental para upstream protegido.

---

#### [CORE-05] Não versione contexto vazado

```yaml
id: CORE-05
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, hygiene]
```

**Instruction (en):**
Do not version stray context files at the repo root or in working folders (partial payloads, AI scratch). Persistence is for _Release_ only.

**Documentação (pt-br):**
Não versione arquivos contextuais vazados na raiz ou pastas sujas (payloads parciais, rascunhos operacionais de IA). A persistência é apenas para _Release_.

**Why this matters:** rascunhos da IA poluem o histórico e podem vazar prompts/secrets; pertencem ao scratchpad da ferramenta, não ao repo.

---

#### [CORE-06] Commits incrementais atômicos

```yaml
id: CORE-06
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, commit]
```

**Instruction (en):**
Make atomic incremental commits limited to one logical unit. Split tasks that span design + code + spec.

**Documentação (pt-br):**
Realize _Commits Incrementais Atômicos_ limitados à sua unidade lógica. Se a tarefa varrer design, código e spec simultaneamente, fracione as ações comissionadas em passos menores.

**Why this matters:** commits monolíticos sabotam `git bisect` e forçam revisão "tudo ou nada". Commit atômico = unidade revisável independente.

---

#### [CORE-07] Nunca execute git push autonomamente

```yaml
id: CORE-07
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, safety, critical]
```

**Instruction (en):**
**[CRITICAL]** Never execute `git push` autonomously. Any remote push requires explicit human approval from the maintainer.

**Documentação (pt-br):**
**[CRITICAL]** Nunca execute `git push` de forma autônoma. Todo envio de código ao repositório remoto **exige aprovação humana explícita do mantenedor** antes de ser iniciado. Aplica-se a qualquer agente de IA, script automatizado ou hook que não seja o pipeline oficial do repositório.

**Why this matters:** push autônomo escapa do gate de revisão humana e pode publicar código não-validado. Linha cravada como `[CRITICAL]` no template original.

**See also:** `[CORE-08]` (HARNESS LOCK).

---

#### [CORE-08] HARNESS LOCK — cadeia de qualidade obrigatória pré-commit

```yaml
id: CORE-08
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, commit, ci, harness_lock]
```

**Instruction (en):**
**[HARNESS LOCK]** Before any `git commit`, run the project's full validation chain (format, check, lint, test) as declared in `package.json`. The rule is the chain, not the package manager — adapt to project scripts.

**Documentação (pt-br):**
**[CI Compliance — HARNESS LOCK]** É terminantemente proibido submeter qualquer commit sem validar a cadeia de qualidade do projeto. Antes de `git commit`, execute **todos os scripts de validação** definidos no `package.json` do repositório (ex.: `format`, `check`, `lint`, `test`). O padrão canônico é:

```text
<format_cmd> ; <check_cmd> ; git add . ; git commit -m "..."
```

Se o repositório define `yarn format` (write) e `yarn validate` (aggregate: format:check + build + test + living-docs:check, ou equivalente do stack), o comando concreto é: `yarn format ; yarn validate ; git add . ; git commit -m "..."`. Adapte aos scripts do projeto — a regra é a **cadeia**, não o gerenciador. Em stacks sem aggregate, expanda explicitamente: `<format_write> ; <format_check> ; <build> ; <test> ; <docs_check> ; git add . ; git commit -m "..."`.

**Why this matters:** o gate local replica o gate de CI. Pular = empurrar o erro para o pipeline e gastar ciclo de revisão humano com algo automatizável.

**Cross-ref:** complementada por `[CORE-14]` (commit message protocol — IA gera apenas o texto sugerido; humano executa a cadeia).

---

#### [CORE-09] PRs abrem como Draft com matriz oficial

```yaml
id: CORE-09
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, pr, github]
```

**Instruction (en):**
Open Pull Requests in `Draft` mode using the full `.github/pull_request_template.md` matrix. In governed delivery, open the Draft container at the start of development; maintenance/learning work (fix/patch/spike/incident) is code-first by nature (timing + exceptions: ADR 0025).

**Documentação (pt-br):**
A submissão de Pull Requests obrigatoriamente se inaugura no modo `Draft`, utilizando integralmente a matriz `.github/pull_request_template.md`. Em entrega governada, o contêiner Draft abre no início do desenvolvimento; trabalho de manutenção/aprendizado (fix/patch/spike/incident) é código-primeiro por natureza (timing + exceções: ADR 0025).

**Why this matters:** Draft sinaliza WIP e impede que CI/reviewers tratem o PR como pronto antes da hora. Abrir o contêiner cedo em trabalho governado mantém a topology fiel ao estado real do trabalho (ADR 0025).

---

#### [CORE-10] Draft → Ready apenas via revalidação humana

```yaml
id: CORE-10
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, pr, github, gate]
```

**Instruction (en):**
Convert PRs from `Draft` to `Ready` only after explicit human revalidation.

**Documentação (pt-br):**
Converta a operação de `Draft` para `Ready` apenas através da revalidação afirmativa Humana.

**Why this matters:** transição Draft→Ready é gate humano explícito; IA não decide sozinha que está pronto.

---

#### [CORE-11] Plano formado antes de ação

```yaml
id: CORE-11
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, planning]
```

**Instruction (en):**
Act only with a formed plan. Use `governance-foundation` for work that must survive session/agent changes; use a tool-scratchpad lightweight plan only for single-session, local, disposable adjustments.

**Documentação (pt-br):**
**Aja apenas mediante Plano Formado.** Antes de executar qualquer código, escolha a granularidade:

| Critério      | Use `governance-foundation`                                                                             | Use `plano leve`                          |
| :------------ | :------------------------------------------------------------------------------------------------------ | :---------------------------------------- |
| Duração       | > 1 sessão                                                                                              | 1 sessão                                  |
| Escopo        | > 1 arquivo fora de feature isolada                                                                     | Ajuste pontual, local                     |
| Sobrevivência | Precisa sobreviver troca de IA/sessão                                                                   | Descartável                               |
| Onde vive     | `.governance/specs/<NNNN>-<slug>/` (versionado; bridge legada em `.specify/specs/<slug>/` per ADR 0019) | Scratchpad da ferramenta (não versionado) |

**Why this matters:** ação sem plano formado = sintoma clássico de AI-slop. A tabela é o critério-teste objetivo entre `governance-foundation` e plano leve.

**See also:** `[CORE-02]` (Agnostic SDD Override). _TODO(B.4): adicionar cross-ref para o ID canônico da regra "Tipo de spec" quando `global-rules.md` migrar para o schema bilíngue + IDs `[GR-NNNN]`._ Hoje a regra vive em [`.core/rules/top/global-rules.md` § "Workflow com IA"](./global-rules.md#workflow-com-ia).

> **Candidata a docs-only em B.3.5:** a tabela detalhada pode migrar para `.core/process/governance-foundation.md` (já tem seção "Tipos de spec" hoje). O core-runtime mantém só a frase imperativa.

---

#### [CORE-12] Checkpoints antes de ação após contexto extenso

```yaml
id: CORE-12
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, checkpoint]
```

**Instruction (en):**
After absorbing extensive context, return a summary Checkpoint and request human approval before executing Code Actions.

**Documentação (pt-br):**
**Checkpoints antes de ação.** Após absorver contexto extenso (múltiplos arquivos, specs, pesquisas), retorne um Checkpoint resumido e peça aprovação humana **antes** de executar Code Actions.

**Why this matters:** evita "IA absorve 50 arquivos e parte direto para edição agressiva". Checkpoint = oportunidade de o humano corrigir interpretação errada.

---

#### [CORE-13] Artefatos vivos durante o trabalho

```yaml
id: CORE-13
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, sdd, lifecycle]
```

**Instruction (en):**
Keep SDD artifacts updated continuously: mark `tasks.md` items `[/]` (in progress) or `[x]` (done) as you go; record debts in `NEXT.md`. Never create parallel routing files in the repo.

**Documentação (pt-br):**
**Artefatos vivos.** Mantenha atualizados os artefatos SDD durante o trabalho:

- `tasks.md` → marque cada item como `[/]` (em progresso) ou `[x]` (concluído) a cada passo.
- `NEXT.md` → registre débitos, bugs ou insights sem prioridade imediata.
- **Nunca crie arquivos paralelos de roteirização.** Planos leves vivem na ferramenta, não no repositório.

**Why this matters:** artefatos SDD desatualizados = perda do dogfood do framework. Atualização incremental preserva rastreabilidade.

**See also:** `[CORE-02]` (Agnostic SDD Override).

---

#### [CORE-14] Mensagem de commit sugerida: IA fornece apenas a mensagem

```yaml
id: CORE-14
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, commit, safety]
```

**Instruction (en):**
At the end of each sub-block, provide only the commit message suggestion. The human executes the full validation chain (`yarn format ; yarn validate ; ...`) and `git commit`.

**Documentação (pt-br):**
Ao concluir um sub-bloco, IA fornece **apenas** a mensagem sugerida do commit (`feat(spec-XXXX): ...`). O humano executa a cadeia completa de validação (`yarn format ; yarn validate ; git add . ; git commit -m "..."`).

**Why this matters:** economiza tokens e impede IA de operar git autonomamente. Honra `[CORE-07]` (push) e `[CORE-08]` (HARNESS LOCK).

**See also:** `[CORE-08]` (HARNESS LOCK), `[CORE-07]` (Nunca execute git push autonomamente).

---

#### [CORE-15] ADR é princípio perene, não revisitação datada

```yaml
id: CORE-15
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, governance, adr, editorial]
```

**Instruction (en):**
When writing an Architecture Decision Record (ADR), capture a perennial architectural principle — not a phase report, not a revisitation of `decision-brief.md`. The title names the principle; the body must continue to make sense after the originating spec ships. Editorial criteria, format, anti-patterns and rejection signals are canonical at `.core/governance/adrs/README.md`.

**Documentação (pt-br):**
Ao escrever uma ADR, capture um **princípio arquitetural perene** — não relatório de fase, não revisitação datada do `decision-brief.md`.

- **Título** nomeia o **princípio**, não a transição/feature concreta.
- **Corpo** continua válido depois que a spec de origem encerra. Spec aparece só na linha de header como "Origem histórica".
- **Sintomas de ADR mal-escrita** (rejeitar no PR review): título nomeia transição; corpo cita "sub-bloco X.Y" ou "PR N" como cronograma; decisão lista mudanças por arquivo/linha; ADR "vira lixo" quando a fase termina.
- **Fronteira com `decision-brief.md`:** brief é gate humano da spec específica; ADR é princípio cross-spec.

Critério editorial completo, formato canônico, exemplo de ADRs vigentes e ciclo de promoção (local → global) vivem em [`.core/governance/adrs/README.md`](../../governance/adrs/README.md).

**Why this matters:** ADRs sem princípio perene viram lixo no momento em que a fase encerra. O critério é gate de PR review — ADR mal-escrita é defeito de design, não estilo.

**See also:** `[CORE-02]` (repositório como memória), `[CORE-13]` (artefatos vivos).

---

#### [CORE-16] Sync de base ≠ merge atômico ponta-a-ponta

```yaml
id: CORE-16
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, merge, safety]
```

**Instruction (en):**
Distinguish between **base sync** (routine update of a stacked branch with its base) and **end-to-end atomic merge** (one-shot release of an entire spec stack to `main`). They are NOT the same operation. Base sync is frequent, safe, and reversible — it keeps the stack coherent during work. Atomic merge happens ONCE, only at spec closure, after every PR in the stack is Ready. PRs labeled `MERGEABLE` by GitHub are NOT invitations to merge to `main` — that label only indicates absence of merge conflicts against the PR's base branch. Per ADR 0020, spec-bound PRs are never mergeable in isolation.

**Documentação (pt-br):**
Diferencie entre **sync com a base** (atualização rotineira de branch stacked com sua base) e **merge atômico ponta-a-ponta** (rito único de fechamento da spec inteira em direção à `main`). **NÃO são a mesma operação.**

- **Sync com a base:** operação **rotineira**, segura, reversível. Quando uma branch upstream avança (rebase, novos commits), as branches stacked sobre ela puxam o avanço. Mantém o stack coerente durante o trabalho.
- **Merge atômico ponta-a-ponta:** operação **única**, irreversível, **somente no fechamento da spec**, quando **todos** os PRs do stack estão Ready. Conforme ADR 0020, PR vinculado a spec **NÃO é mergeable isoladamente** — o stack inteiro mergeia em sequência atômica.

A label `MERGEABLE` que o GitHub mostra **NÃO é convite para mergear na main** — indica apenas ausência de conflito contra a branch base do PR. Em stack governance-first, `MERGEABLE` é estado normal de PR Ready aguardando fechamento da spec.

**Why this matters:** múltiplas sessões de IA já sugeriram merge antecipado em PRs Ready de stacked PRs, confundindo a label `MERGEABLE` com autorização de fechamento. A confusão custa tempo do humano para esclarecer e arrisca quebrar o contrato governance-first do ADR 0020. Cravar a distinção no `<AI_GUIDELINES>` injetado leva a IA a tropeçar nela antes de sugerir merge prematuro.

**See also:** `[CORE-04]` (Nunca trabalhe direto em main/master), `[CORE-07]` (Nunca execute git push autonomamente), `[CORE-09]` (PRs abrem como Draft), `[CORE-10]` (Draft → Ready apenas via revalidação humana), ADR 0020 (Governance precede e protege execução).
