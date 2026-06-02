# Handoff operacional — Spec 0024 (retomada em nova sessão)

> Documento de **retomada**, não resumo histórico. Assume zero acesso à conversa anterior. Objetivo: continuar a execução da 0024 sem perder decisão relevante. Supersede `2026-05-31-handoff-next-session-v2.md`.

## 1. Estado Atual

- **Spec:** `0024-context-architecture` (`.governance/specs/0024-context-architecture/`)
- **Branch ativa:** `feat/spec-0024-ruleset-producibility`
- **PR ativo:** **#33** (Draft, stacked sobre `feat/spec-0024-context-architecture` = #32)
- **Último commit:** `4cc5dc8` (reconciliação de absorção; antes: `963cfbb` cleanup, `a578b06` Checkpoint 2.4c)
- **Último checkpoint concluído:** **2.4c** (revisão-como-artefato fechada). #33 embarca 2.2 · 2.2b · 2.3 · 2.3a · 2.3b · 2.4 · 2.4a · 2.4b · 2.4c.
- **Gates:** #32 **GATED** (Checkpoints 1/2/2.1/2.1a fechados). #33 **gate PENDENTE** (cobre 2.2→2.4c) — Technical Audit (Codex) → Architectural Review (ChatGPT) → Human (owner).
- **CI (#33):** verde — `repo-validation`, `smoke` (agregador) + matriz, `governance-pr-check`, `review:check` (no validate).
- **validate:** `yarn validate` verde. Git limpo. Ruleset vivo == versionado (paridade verde).

## 2. Linha do Tempo de Decisões (só as que influenciam trabalho futuro)

| ID                                        | Status                                            | Motivo                                                                                                | Consequência prática                                                            |
| :---------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `[DEC-0024-G00]`                          | Resolved                                          | unidade arquitetural primária = transformação `contexto humano → governança executável`               | não reabrir identidade; tudo deriva disso                                       |
| `[DEC-0024-G02]`                          | Resolved                                          | taxonomia `deterministic/mixed/evidence-driven` **removida** → bloco + propriedade `exige-julgamento` | execução residual (remover `WorkflowType` do runtime/doc) ainda pendente (NEXT) |
| `[DEC-0024-G06]`                          | Resolved                                          | contrato da cadeia `research→…→implementação`                                                         | CAMADA 1 (enforcement) deferida (NEXT)                                          |
| `[DEC-0024-G07]`                          | Resolved                                          | topologia-as-data (`state.yml`=SSOT) + `governance-pr-check` valida projeções (título/template)       | **`governance-pr-check` é `required`** (revisado 2.3b); só `state.yml` é fonte  |
| GG-0001                                   | feito (interno, dogfood, sem DEC consumer)        | decidibilidade de gate (`gate-decidability:check`)                                                    | no `validate`                                                                   |
| review-as-artifact                        | feito (dogfood, **sem DEC** — owner adiou cravar) | revisão/gate viram artefatos versionados; PR = projeção                                               | `review:check` no `validate`; reconciliar no fechamento (item 6)                |
| Reframe "absorção/convergência" (G08/G09) | **DEFERIDO** (owner: "sem DEC agora")             | a 0024 virou de-facto sobre absorção, não só contexto                                                 | decisão de fechamento de spec; **não** mexer agora                              |

## 3. Arquitetura Atual (SSOT) — estado aprovado e vivo

### Governance Topology

- **Onde vive:** `.governance/specs/<spec>/state.yml` § `topology` (SSOT única). Campos por nó: `id/github_pr/role/terminal/sequence/checkpoints`; `cursor`; grupos `concluded/active/planned`.
- **Quem consome:** `governance-pr-check` (deriva título/template esperados).
- **Quem valida:** `state-yml:check` (em `repo-validation`, required) — invariantes: `sequence` única/contígua/`execution`-only; `github_pr` ⟺ `active`/`concluded`; 1 terminal; cursor referencial. Paridade vivo↔versionado: `ruleset-drift` (CI, detect-only).

### Governance PR Enforcement

- **Ruleset:** "Main Governance" (id `15575345`), **off-repo**, versionado em `.github/rulesets/main-governance.json` (SSOT). `bypass_actors`: admin `always`.
- **Required status checks (branch default):** `repo-validation` + `smoke` + `governance-pr-check`.
- **`ruleset:check`** (`cli/ruleset-check.mjs`): **producibilidade** (todo required-context tem produtor estável — no `validate`) + **paridade** (`--parity`, no `ruleset-drift.yml`).
- **`governance-pr-check`** = **required**; valida título (emoji `role/sequence/terminal` + `[Spec NNNN]`) e seções obrigatórias do body contra a topologia. Não-spec PRs → `exempt` (verde).
- **advisory restante:** nada essencial; a paridade-API (ruleset e topologia↔git) é hardening **não-bloqueante** (NEXT).

### Review-as-Artifact (`.governance/specs/<spec>/reviews/` + `gates/`)

- **Review** `reviews/c<N>-<role>.yml` (reviewer-owned): `findings_emitted`, `review_fingerprint` (envelope), e findings `F1..FN` contíguos com `severity`, `location` (`<path>#L` ou `global`), `description`, `disposition` (`open|accepted|dismissed`), `fingerprint`. Hashes = `JSON.stringify` canônico incl. `checkpoint+role`.
- **Resolutions** `reviews/c<N>-resolutions.yml` (implementer-owned): `{finding: "<role>#<id>", action: fixed|wontfix|needs-discussion, ref}`. **Não destrava o gate.**
- **Gate** `gates/c<N>.yml` (human): `{decision: approved|changes_requested}`.
- **`review:check`** (`cli/review-check.mjs`, no `validate`): integridade (fingerprints, envelope, contiguidade, ids qualificados) + gate `approved` ⟹ **zero finding `critical/high` com `disposition: open`**.
- **Limite honesto cravado:** tamper-**evidence**, não tamper-proofing — adulteração exige forja explícita/visível, não prevenção criptográfica (ADR 0021).

### Human Gate

- **Papel:** decisão final do checkpoint (`gates/c<N>.yml`) + Approve nativo do GitHub (gatilho de merge).
- **Relação com findings:** consome o **estado consolidado derivado** (open por severidade) — não relê tudo.
- **Relação com reviews:** só o **reviewer** fecha finding (`disposition: accepted/dismissed`); o gate `approved` é **mecanicamente barrado** se houver bloqueante `open`. O Human Gate decide o **próximo movimento** (avançar), **não** mergeia em `main`.

## 4. Explicitamente REJEITADO (não rediscutir)

- **Event sourcing / log append-only de decisões** — over-modeling; git já é o histórico.
- **Threads/replies/conversa no artefato** — governança guarda a _decisão_, não a conversa; debate efêmero fica no GitHub.
- **Comentário de PR como memória** — invertido: PR = projeção; memória = artefato versionado.
- **Enforcement por git-history (merge-base/`git show`/`git diff`)** — ineficaz para poda no mesmo PR + frágil a squash/rebase; substituído por selo de envelope estrutural.
- **CODEOWNERS / assinaturas criptográficas p/ autoria** — off-repo/nova camada; check local é cego a autoria por design.
- **`location@<commit_sha>`** — é usabilidade (drift espacial), não bypass; torna location quebradiça.
- **Novos estados transitórios de finding** (`in_review`/`needs_validation`) — anti-taxonomia; hand-off é derivado (resolução existe + disposição open).
- **`findings_emitted` dentro do hash de cada finding** — acoplamento artificial; substituído por `review_fingerprint` de envelope.
- **`topology:check` completo / paridade-API agora** — hardening não-bloqueante deferido.
- **Tiered/single-job smoke matrix** — perde diagnóstico por-cell; matriz visível + agregador required é o padrão.

## 5. Problemas Descobertos e Resolvidos (não reabrir)

| Problema                                              | Encontrado               | Resolvido                                                                |
| :---------------------------------------------------- | :----------------------- | :----------------------------------------------------------------------- |
| `guardrails` órfão no ruleset (required sem produtor) | investigação 2.2         | Camada 0 + Checkpoint 2.2                                                |
| `workflow-dispatch.test.mjs` FAIL ambiente-dependente | audit 2.1a (Codex)       | **investigação aberta** (não-defeito; verde em 3 ambientes vs 1 sandbox) |
| topologia ↔ realidade git divergente (nó-fantasma)    | Architectural Review 2.3 | 2.3a (B1)                                                                |
| decisão estrutural sem `[DEC]`                        | Architectural Review 2.3 | 2.3a (`[DEC-0024-G07]`)                                                  |
| dual-SSOT `plan.md`/`state.yml`                       | Arch Review 2.3          | 2.3a (O1: plan = projeção)                                               |
| `sequence` sem invariantes                            | Arch Review 2.3          | 2.3a (O6)                                                                |
| `governance-pr-check` frágil (substring)              | Arch Review 2.3          | 2.3a (O2: header ancorado)                                               |
| `governance-pr-check` advisory vs required            | 2.3b (O5)                | 2.3b (well-formedness local → promovido)                                 |
| `smoke` nunca aplicado ao ruleset vivo                | investigação 2.3b        | apply consolidado (`de2f119`)                                            |
| arquivo ADS `:Zone.Identifier` quebrava smoke Windows | CI                       | `7f05030` (+ gitignore)                                                  |
| autoaprovação / deleção / location na revisão         | AGY review do 2.4        | 2.4a                                                                     |
| poda-final + transplante de finding                   | AGY review do 2.4a       | 2.4b (envelope + checkpoint/role no hash)                                |
| fingerprint ambíguo (`join`) + colisão cross-role     | auditoria final          | 2.4c (JSON canônico + id qualificado)                                    |
| `test-*.js` de scratch commitados                     | pós-2.4c                 | `963cfbb` (+ gitignore `/test-*.js`)                                     |
| brief stale ("advisory") + tabela §4 incompleta       | Closure Review           | `4cc5dc8`                                                                |

## 6. Débitos Reais Restantes

### Aceitos (oficialmente pendentes — em `NEXT.md`)

- **G06 CAMADA 1** (enforcement do contrato da cadeia; 1º candidato `decision-trace:check`) — deferido, dogfood-first.
- **`F-AG04` casa única de templates** (`.core/templates` vs `.ai-guidelines/templates`) — micro-decisão da owner no Checkpoint 11B.
- **Protótipo do Checkpoint 4A (Workflow Provenance)** em `git stash` — referência; só ao chegar no 4A.
- **Glossário Checkpoint/Gate/PR → convenção framework-wide** — candidato consumer-facing.
- **Paridade-API (hardening NÃO-bloqueante):** token `administration:read` no CI p/ `ruleset-drift`; `topology:check` (topologia↔git). Os invariantes locais já foram absorvidos.
- **Reconciliação de fechamento de spec** (não-Checkpoint-3): cravar review-as-artifact + reframe de absorção (G08/G09) no brief/findings; definir regra do campo `decision` (carimbo de emissão vs evolui); registrar scope-creep do nó #33.

### Rejeitados (ver § 4) — não viram backlog.

### Declarados ENCERRADOS

- `smoke` apply (RESOLVIDO); `guardrails` órfão (RESOLVIDO); bypasses do 2.4 (FECHADOS em 2.4a/b/c); staleness do brief (RESOLVIDO).

## 7. Resultado da Architectural Closure Review (#33, 2.2→2.4c)

- **Veredito:** **PRONTO para o Checkpoint 3** (após o Gate do #33).
- **Bloqueantes:** **nenhum** para o Checkpoint 3. Os itens de spec-closure (§6) não bloqueiam o 3.
- **Observações:** nó #33 acumulou 9 checkpoints / 3 concerns (scope-creep, honesto); ambiguidade do campo `decision` (changes_requested + tudo accepted); só `c2.3` foi migrado a artefato (resto = comentário, fronteira de migração).
- **Recomendações:** fechar o Gate do #33 via artefatos; reconciliação de fechamento (§6) antes do encerramento da spec; ao abrir o 3, branch = `feat/spec-0024-checkpoint-3`.
- **Aprovado explicitamente:** a arquitetura entregue no #33 — topology-as-data (G07), governance PR enforcement (required + ruleset-as-code), e review-as-artifact (2.4→2.4c) — é coerente, validada e verde.

## 8. Próxima Ação Recomendada (uma)

**Fechar o Gate do #33 via artefatos** (Codex escreve `reviews/c<N>-audit.yml`; ChatGPT `reviews/c<N>-arch.yml`; owner `gates/c<N>.yml` + Approve) **e então abrir o Checkpoint 3** (`GG-0003 Consistency Projection Check`) como **PR próprio stacked** `feat/spec-0024-checkpoint-3` (base = linha da spec). Nada mais a implementar antes disso.

## 9. Prompt de Retomada (colar em nova sessão)

```
Retome a execução da Spec 0024 (context-architecture) do framework ai-guidelines.

NÃO reabra arquitetura. NÃO refaça pesquisa. NÃO crie novas decisões sem gate.

Contexto (leia, nesta ordem):
- .governance/specs/0024-context-architecture/research/2026-06-02-handoff-next-session.md  (ESTE handoff — SSOT da retomada)
- .governance/specs/0024-context-architecture/state.yml  (§ topology = SSOT estrutural; § next)
- .governance/specs/0024-context-architecture/plan.md  (§ "Sequência de Checkpoints" + § "Decisões revisitadas")
- .governance/specs/0024-context-architecture/decision-brief.md  (decisões Resolved: G00/G02/G06/G07)
- .governance/specs/0024-context-architecture/reviews/README.md  (modelo review-as-artifact)

Estado: branch feat/spec-0024-ruleset-producibility, PR #33 (Draft), último commit 4cc5dc8.
#33 embarca os Checkpoints 2.2→2.4c; gate do #33 PENDENTE (Technical Audit → Architectural Review → Human, via artefatos em reviews/ + gates/).
Decisões cravadas: G00/G02/G06/G07 (Resolved). governance-pr-check é REQUIRED. review-as-artifact é dogfood (sem DEC).

Disciplinas: pt-BR em toda saída. HARNESS LOCK: `yarn format ; yarn validate` antes de commit; push/apply de ruleset só com autorização explícita do owner (CORE-07). 1 checkpoint atômico por vez; parar no Gate. Falsificação ativa.

Objetivo imediato: (a) se o gate do #33 estiver fechado → abrir o Checkpoint 3 (GG-0003 Consistency Projection Check, mecânico, lista fixa de marcadores) como PR stacked feat/spec-0024-checkpoint-3, dogfoodando review-as-artifact; (b) se não → preparar/conduzir o gate do #33 via artefatos. Verifique `git status` limpo + `yarn validate` verde antes de qualquer ação.

NÃO mergeia em main (modo unit; merge único ao fim via review.md R8). NÃO toque G08/G09 (reframe de absorção é decisão de fechamento). Débitos oficiais em NEXT.md.
```
