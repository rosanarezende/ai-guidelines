# ADR 0023 — Meta-artefatos de governança são SSOT YAML com derivações determinísticas build-time

**Status**: Proposta
**Origem histórica**: Spec 0023 PR5 S3 (2026-05-22, sessão de reflexão pós-PR4 sobre formato do backlog e débito de dashboard nunca materializado).
**Relaciona-se com**:

- [`ADR 0008 — Monolithic Runtime Compiler`](./0008-monolithic-runtime-compiler-governance.md) — mesmo padrão "SSOT + derivações" aplicado a regras (`agents-core.md` → `AGENTS.md` + ledger + `rules.json`). Este ADR generaliza o padrão para meta-artefatos de governança.
- [`ADR 0018 — Governance-First, AI-as-Channel`](./0018-governance-first-ai-as-channel.md) — derivações são determinísticas (build-time, sem LLM no runtime). Princípio preservado.
- [`ADR 0022 — Handoff situado em estado precede distribuição pré-carregada`](./0022-handoff-situated-precedes-static-distribution.md) — handoff é caso de uso futuro de meta-artifact derivado: pode consumir o pipeline para apresentar contexto situado.

---

## Contexto

O projeto já pratica, sem nomeação formal, o padrão "fonte única + derivações" em três casos isolados:

- `agents-core.md` (SSOT markdown) → `AGENTS.md` (compilado in-line) + `agents-core-ledger.md` (tabular) + `rules.json` (indexado) via `yarn build:rules`.
- `state.yml` (SSOT por spec) → `active-specs.yml` (índice agregado) via `publish-state`.
- `living-docs.yml` (SSOT enumerado) → checks de drift via `yarn living-docs:check`.

Cada um foi resolvido caso-a-caso, com formato próprio e mecanismo próprio de derivação. Não há ADR consolidando o padrão.

Em paralelo, dois débitos estruturais se arrastam:

**(1) Backlog.** Hoje vive como markdown em `.governance/specs/roadmap/backlog.md` (90 linhas). É legível para edição humana via PR, mas perde queryability (não dá para filtrar/agrupar/contar candidatas via script) e perde visualização rica (não dá para apresentar a stakeholders externos sem renderizar manualmente). Owner identificou em 2026-05-22 que o formato atual subutiliza o backlog como ferramenta de prioridade.

**(2) Dashboard de governança nunca materializado.** Discussão sobre dashboard HTML para stakeholders iniciou na época do `living-docs.yml` (2026-05-07 ~) e nunca saiu do papel. Owner é visualmente orientada — perde agência cognitiva sem visualização rica do estado da governança (specs ativas, candidatas, prioridades, andamento, entrega de valor). O débito é real e custoso, não capricho.

Os dois débitos têm a mesma forma estrutural: **um conteúdo declarativo (lista, índice, estado) que precisa ser editável por humano, queryable por código, e visualizável por stakeholder não-técnico**. Markdown puro atende apenas a primeira dimensão; database + UI custom atende as três mas viola "repo como SSOT" (ADR 0018) e introduz infra externa.

Existe um caminho intermediário, idiomático ao projeto: **YAML como SSOT (legível e editável) + derivações build-time (JSON para scripts, HTML estático para humanos)**. Esse é o padrão que `agents-core.md` já demonstra funcionar — apenas não foi generalizado.

## Princípio

**`meta-artefatos de governança são SSOT em YAML com derivações determinísticas build-time (JSON para scripts, HTML para humanos)`.**

Equivalente em inglês: **`governance meta-artifacts are YAML SSOT with deterministic build-time derivations (JSON for scripts, HTML for humans)`.**

Operacionalmente:

1. **YAML é fonte única.** Editado por humanos via PR; revisado como qualquer outro arquivo do repo. Schema declarado (ex.: `.governance/schemas/backlog.schema.yaml`). Validado em CI antes de qualquer derivação.

2. **JSON derivado.** Gerado por script no build (`yarn build:meta-artifacts` ou equivalente). Consumido por automação interna (queries, drift checks, scripts auxiliares). **Nunca editado manualmente.** Versionado no repo para permitir consumo sem build.

3. **HTML derivado.** Gerado por template no build. Estático na v1 — sem JS interativo, sem filtros runtime, sem busca client-side complexa. Pode evoluir incrementalmente se demanda real aparecer. Servido via GitHub Pages, ou disponível em `dist/` para inspeção local.

4. **CI drift check.** Equivalente ao `yarn living-docs:check`: se YAML mudou e JSON/HTML não foram regenerados, build falha. Garante que derivações ficam sincronizadas com SSOT.

5. **Aplicabilidade.** Princípio vale para meta-artefatos: backlog, índices, dashboards, roadmaps tabulares, registros de decisão estruturados. **NÃO vale** para conteúdo narrativo (specs, ADRs, decision-briefs, NEXT.md continuam markdown puro — narrativa não é meta-artifact).

6. **Cláusula anti-paper.** Princípio só vale se houver materialização de pelo menos 1 caso real no slot imediatamente seguinte à promoção deste ADR a `Aceita`. ADR sem materialização vira o anti-pattern que originou este ADR (dashboard de 2026 que nunca saiu). Materialização inicial é candidata `governance-dashboard-and-visual-artifacts` no backlog (S4 do PR5), marcada como `Now`.

7. **Determinístico.** Derivações não usam LLM no runtime (ADR 0018 preservado). YAML → JSON é parse + reformat; YAML → HTML é template + dados.

## Opções avaliadas

| #   | Opção                                                    | Trade-off                                                                                                                                                                              |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Markdown only (status quo).**                          | Zero ferramenta nova; legível para edição. Perde queryability e visualização rica. Não resolve débito do dashboard.                                                                    |
| 2   | **YAML SSOT + JSON + HTML derivados (escolhido).**       | Padrão idiomático ao projeto (já praticado isoladamente em 3 casos); SSOT legível humano + queryability + visualização stakeholder. Investimento em pipeline + materialização inicial. |
| 3   | **Database (sqlite/postgres) + UI custom.**              | Máxima power (filtros runtime, autenticação, etc.). Viola "repo como SSOT" (ADR 0018 ecosystem); introduz infra externa; backlog deixa de ser editável via PR.                         |
| 4   | **Ferramenta externa (Notion, Linear, Airtable, etc.).** | Pronto para uso, UI excelente. SSOT migra para fora do repo; viola ADR 0018 ("repositório é memória"); audit trail e versioning ficam dependentes da ferramenta.                       |
| 5   | **YAML SSOT + JSON apenas (sem HTML).**                  | Pipeline mais simples. Não resolve o débito do dashboard — stakeholder visual continua sem entrega. Rejeitado porque a motivação central inclui visualização.                          |

## Framing canônico anti-distorção

**Linguagem aceita:**

- "meta-artefato derivado"
- "pipeline determinístico de visualização"
- "HTML estático auto-gerado"
- "SSOT YAML editável por humano via PR"
- "drift check de derivação"

**Linguagem rejeitada:**

- ~~dashboard tooling~~
- ~~governance UI~~
- ~~knowledge management system~~
- ~~stakeholder portal~~
- ~~workflow visualization platform~~
- ~~smart roadmap viewer~~

**Critério de teste:** se a descrição do mecanismo soar como produto SaaS ou plataforma corporativa, voltar ao framing canônico. Se o mecanismo justificar a descrição enterprise, **rejeitar o mecanismo, não o framing.**

## Consequências

- **Imediatas (PR5 S4, este mesmo PR):**
  - Candidata `governance-dashboard-and-visual-artifacts` registrada no backlog com prioridade `Now`.
  - Escopo da candidata: backlog convertido para YAML+JSON+HTML como primeiro caso real do padrão, mais HTML dashboard de specs ativas, Mermaid embedded onde fizer sentido, prompts versionados para imagens conceituais.

- **De médio prazo:**
  - Próxima spec após Spec 0023 fechar = candidata `governance-dashboard-and-visual-artifacts` (vinculação metodológica explícita; ver "Cláusula anti-paper" item 6).
  - Outros meta-artefatos atuais podem migrar incrementalmente: `active-specs.yml` ganha HTML derivado; `living-docs.yml` ganha dashboard.
  - Padrão consolidado em `.core/process/meta-artifact-pipeline-policy.md` quando ≥ 2 materializações concretas existirem (cf. ADR 0021 critério ≥ 2 casos).

- **Não-consequências (importantes):**
  - **Não substitui markdown narrativo.** Specs, ADRs, decision-briefs, NEXT.md continuam markdown puro. Princípio aplica a meta-artefatos estruturados, não a narrativa.
  - **Não introduz LLM no runtime.** Derivações são build-time determinísticas; ADR 0018 preservado.
  - **Não introduz infra externa.** SSOT permanece no repo; HTML é estático; sem servidor de aplicação obrigatório.
  - **Não obriga adoção universal imediata.** Outros meta-artefatos podem migrar caso-a-caso; status quo markdown continua válido até migração explícita por DEC.

## Critério de revisão

Esta ADR deve ser revisada se:

- **Materialização inicial não vier como próxima spec após 0023.** ADR vira papel — anti-pattern que motivou este ADR está se repetindo. Reabrir como "ADR de papel" e considerar rejeição.
- **Pipeline ficar tão complexo que precise LLM no runtime para alguma derivação.** Viola ADR 0018; reabrir balanço determinístico vs LLM-aided.
- **Mais de 1 stakeholder externo pedir UI rica** (filtros interativos, autenticação, queries client-side complexas). Reabrir trade-off contra opção 3 (database + UI) — pode justificar evolução.
- **Linguagem rejeitada acima começar a aparecer no projeto.** Revisar framing antes que mecanismo derive em produto SaaS.
- **Princípio for invocado para justificar conversão de markdown narrativo (specs/ADRs) em YAML.** Reabrir aplicabilidade (item 5 da operacionalização) — narrativa não é meta-artifact.

Sem nenhum desses gatilhos, esta ADR permanece estável como princípio perene.

## Origem empírica

Este princípio emergiu de dois sinais convergentes em 2026-05-22:

1. **Análise do formato do backlog** durante S3 do PR5: owner pediu repensar formato (YAML, JSON, HTML?). A pergunta revelou que o padrão "fonte única + derivações" já existia em 3 lugares no projeto (rules, state, living-docs), mas nunca foi nomeado como princípio cross-spec.

2. **Reconhecimento do débito do dashboard** que nunca saiu do papel. Owner explicitou que é visualmente orientada e perde agência cognitiva sem visualização rica do estado da governança. Tratar como capricho seria DX-blind; tratar como decisão arquitetural é honesto.

A junção dos dois sinais materializa o princípio: meta-artefatos de governança são SSOT YAML com derivações determinísticas build-time. Backlog é o primeiro caso real de materialização (escopo da candidata `governance-dashboard-and-visual-artifacts`).

A frase do owner que motivou a cláusula anti-paper:

> Tudo isso é débito que tem se arrastado e já podemos fazer essa melhoria de forma intermediária.

ADR sem materialização rápida é exatamente o padrão de débito arrastado que motivou este ADR. A vinculação metodológica forte (próxima spec = materialização) é a única forma de não repetir o pattern.
