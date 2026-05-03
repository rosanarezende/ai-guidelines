# Plan — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress — **Stage 2 (Implementation)** — revised 2026-05-02 (Stage 1 encerrado, gate humano `Resolved` em todos os pontos `[DEC-0018-*]`)

> **Plano em dois passes — Stage 1 concluído.** Stage 1 produziu 1 auditoria
> editorial + 5 researches externas + decision-brief com 14 pontos resolvidos
> no gate humano de 2026-05-02. Stage 2 (esta versão) cristaliza o desenho
> técnico derivado das decisões cravadas e detalha as fases operacionais
> de implementação. Cada subseção `A.2`–`A.6` e `B.2`–`B.7` referencia
> explicitamente o `[DEC-0018-*]` que a alimenta.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Dogfood radical em duas dimensões: (a) a primeira spec de conteúdo do framework é a que cria a regra que a rege; (b) a primeira instância de `decision-brief.md` (esta) é o protótipo do `decision-brief-boilerplate.md` que o Bloco A formalizará. Os dois blocos compartilham o mesmo insight raiz — "infraestrutura amadureceu, conteúdo e disciplina editorial não" — e vivem na mesma branch e mesma PR. Ambos seguem **Stage 1 (research → opções no decision-brief) → Gate humano → Stage 2 (design + implementação)**; nada é decidido pré-research.

ADRs estendidos (referência, não modificação): **0004** (Governance Single Responsibility — base candidata para a taxonomia categorial) e **0008** (Monolithic Runtime Compiler — envelope físico que informa o orçamento de tokens). Nenhum ADR novo é introduzido nesta spec.

### Componentes ou Sub-blocos

#### [A | Política Framework + Auditoria Editorial das Boilerplates]

**Estado atual** (baseline antes da spec):

- `.specify/templates/` contém 7 boilerplates: `spec-`, `plan-`, `tasks-`, `next-`, `research-index-`, `roadmap-`, `project-config-`.
- `.core/process/spec-foundation.md` canoniza lifecycle de specs, política `NEXT.md`, política de migração de research e categorias universal × opt-in **para regras**, mas **não** classifica specs por tipo de entrega (conteúdo × infra) e **não** descreve workflow em dois passes.
- Specs executadas (0008, 0015, 0016, 0017, 0018-rev0) divergiram dos boilerplates ao adicionar/omitir seções (ex: "Decisão de Fusão" em 0008 não está no `spec-boilerplate`). A divergência prática é informação editorial não capturada.
- Inexistente: artefato canônico de gate humano pré-design. `decision-brief.md` desta spec é a primeira instância (hand-rolled).

##### A.0 — Auditoria research-backed (Stage 1)

Output: `research/2026-04-30-boilerplates-audit.md`. Eixos de análise:

| Eixo                                       | Pergunta a responder                                                                                                                                                                                       |
| :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drift estrutural                           | Cada boilerplate × como as specs executadas (0008, 0015, 0016, 0017, 0018-rev0) preencheram o artefato. Que campos são ignorados, que campos ad-hoc foram adicionados, que seções cresceram informalmente? |
| Coerência cruzada                          | Vocabulário, nomenclatura de fases e nivel de profundidade entre boilerplates estão alinhados? Onde divergem?                                                                                              |
| Aderência ao `spec-foundation.md`          | Boilerplate × política canônica. Há políticas no documento que nenhum boilerplate reflete? Há campos no boilerplate que o documento não justifica?                                                         |
| Lacunas trazidas pela prática              | Que campos seriam úteis e estão faltando? "Decisão de Fusão", "Decisões revisitadas", "Tipo de spec", "Cross-refs com specs irmãs", "Conteúdo candidato pré-research", outras emergentes?                  |
| Ruído removível                            | Que campos nunca se preencheram em nenhuma spec — candidatos a corte?                                                                                                                                      |
| Formato do `decision-brief-boilerplate.md` | Dogfooding: o `decision-brief.md` desta spec funciona? Quais campos, IDs, transições de status são úteis? Que melhorias sugerir para o boilerplate formal?                                                 |

Saída: matriz **boilerplate × manter | revisar | adicionar | remover**, com justificativa por linha. **Não decide** os updates — apresenta opções estruturadas para o `decision-brief.md`.

##### A.1 — Popular o `decision-brief.md` com opções (Stage 1 → Gate)

A partir da matriz de A.0, registrar em `decision-brief.md` cada ponto pendente do Bloco A com opções e tradeoffs (sem recomendação travada quando research não convergir):

- `[DEC-0018-A01]` Updates por boilerplate (umbrella com sub-rows por boilerplate).
- `[DEC-0018-A02]` Estrutura do campo "Tipo de spec" (valores válidos, default, semântica).
- `[DEC-0018-A03]` Localização e formato da seção "Tipos de spec" em `spec-foundation.md`; descrição do workflow em dois passes.
- `[DEC-0018-A04]` Texto da linha em `global-rules.md` (curta, sem duplicar o `spec-foundation.md`).
- `[DEC-0018-A05]` Formato definitivo do `decision-brief-boilerplate.md` (informado pelo dogfood desta própria brief).
- `[DEC-0018-A06]` Localização física da seção "Tipos de spec" + workflow em dois passes em `spec-foundation.md`.

##### A.2 — Updates incrementais nos 7 boilerplates existentes

Derivado de `[DEC-0018-A01]` (matriz híbrida). Cada item segue a sub-row da decisão (`A01.1` a `A01.7`):

- `spec-boilerplate.md` (A01.1): adicionar campo **Tipo de spec** obrigatório no header (gatilho de A02 sub-eixo 3 = C); adicionar campo opcional **Decision Brief**, subseções opcionais 🧠 **Decisão de Fusão**, 🛑 **Post-mortem**, e **Cross-refs com specs irmãs**; revisar status composto (`Done (PR #X — YYYY-MM-DD)`); remover prescrição literal de `research/synthesis.md`.
- `plan-boilerplate.md` (A01.2): formalizar formato da seção 📐 **Decisões revisitadas** (data + mudança + razão + impacto, com cap orientativo); adicionar bloco **Stage 1/Stage 2 placeholder** condicional ao tipo `evidence-driven`/`mixed`; relaxar cap de 2-4 linhas em "Princípio guia"; subseção opcional 📎 **Anexo — Conteúdo candidato pré-research**.
- `next-boilerplate.md` (A01.4): trigger explícito de **criação** ("criar quando a spec gerar débitos conscientes"); downgrade de "Itens descartados deliberadamente" para opcional.
- `roadmap-boilerplate.md` (A01.6): sincronizar com a promoção de `tracker`/`repo-first` para `spec-foundation.md` (cf. A.5).
- `research-index-boilerplate.md` (A01.5): sincronizar política de research lifecycle com a constituição.
- `project-config-boilerplate.md` (A01.7): zero churn (confirmado pela auditoria).

##### A.3 — Reestruturação canônica de `tasks-boilerplate.md` em 5 fases + split por tipo de spec

Derivado da ressalva do owner em `[DEC-0018-A01]` e de `[DEC-0018-A02]` Sub-eixo 4 = B (boilerplates separados).

**Modelo canônico (5 fases — substituirá o atual modelo de 3 fases):**

| Fase | Nome                                | Conteúdo                                                                                                                                                  |
| :--- | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Setup                               | Bootstrap, instanciação de artefatos, validação humana inicial.                                                                                           |
| 1    | Implementação A                     | Primeiro sub-bloco de implementação. Exige **commits incrementais** ao final de cada sub-bloco (atomicidade tipo "história de usuário concluída").        |
| 2    | Implementação B                     | Segundo sub-bloco. Mesma exigência de commits incrementais. Specs single-bloco fundem 1+2 com nota explícita.                                             |
| 3    | Preparação para Review (Gate Homol) | Empacotamento e homologação. Status muda para `In Review`, atualiza-se a descrição do PR, e a execução pausa **aguardando Gate de Review Humano formal**. |
| 4    | Encerramento Pré-Merge              | Encerramento ocorre **na branch do PR, antes do merge**. Pós-merge não tem tarefa. Migra research, deleta NEXT.md, atualiza roadmap, finaliza CHANGELOG.  |

**Split por tipo de spec** (`[DEC-0018-A02]` Sub-eixo 4 = B): manter `tasks-boilerplate.md` como variante genérica de referência e adicionar três variantes especializadas:

- `tasks-evidence-driven-boilerplate.md` — inclui sub-bloco "Stage 1 (Research)" + "Gate humano via decision-brief.md" entre Setup e Implementação.
- `tasks-deterministic-boilerplate.md` — single-pass, sem Stage 1 (entra direto em Implementação A após Setup).
- `tasks-mixed-boilerplate.md` — híbrido: Stage 1 condicional para sub-blocos identificados como evidence-driven; restante single-pass.

A justificativa documentada do owner é economia de tokens e redução de carga cognitiva: a IA instancia já com o checklist correto sem precisar resolver condicionais em runtime.

##### A.4 — Criar `decision-brief-boilerplate.md` (8º artefato)

Derivado de `[DEC-0018-A05]`. Formato canônico:

| Sub-eixo                     | Decisão  | Implicação no boilerplate                                                                                                                                                           |
| :--------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Estrutura por ponto       | D        | Estrutura híbrida adaptativa: padrão **B** (Pergunta + Contexto + Opções + Decisão); decompor em sub-eixos (**C**) quando o ponto exige.                                            |
| 2. Convenção de IDs          | A+C+D    | `[DEC-NNNN-XYZ]` + legenda canônica de status (Open/Partial/Resolved/Pendente) no topo + convenção documentada para pontos derivados (origem + IDs sem gaps).                       |
| 3. Recomendação inicial      | D + D9.C | Opcional, com nota explícita do gatilho ("incluir quando há evidência convergente em ≥ 1 research"). Tradeoffs aceita tabela ou lista bulleted.                                     |
| 4. Resumo de status          | C        | Headers individuais + Tabela final manual de "Resumo de status".                                                                                                                    |
| 4-bis. Bloco Gate            | D16.A    | Bloco final explícito **✅ Gate fechado** (data + owner + checkbox por ponto).                                                                                                      |
| 5. Checklist pós-gate (4 ✅) | B        | Checklist explícito: (1) `plan.md` v2 com seções derivadas; (2) `tasks.md` v2 substitui placeholder; (3) status agregado da brief → `Resolved`; (4) commit atômico marcando o gate. |

##### A.5 — Atualizar `.core/process/spec-foundation.md`

Derivado de `[DEC-0018-A03]` (A + D + Misto) e `[DEC-0018-A06]` (A — manter no `spec-foundation.md` atual).

- **Nova seção "Tipos de spec"** logo após "Quando usar spec-foundation". Formato híbrido (D): tabela compacta de 3 linhas (`evidence-driven` / `deterministic` / `mixed`) × colunas (Critério-teste / Workflow / Exemplo cross-repo) + 1 parágrafo descrevendo o gate humano + nota com 2-3 exemplos por tipo de repo (SaaS, library, infra-as-code, ML pipeline).
- **Critério-teste universal** explicitado: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ (`[DEC-0018-A02]` Sub-eixo 2 = A).
- **Sincronização do drift bidirecional** (sub-eixo 3 = misto): promover para a constituição (i) o princípio "repo-first, integração-friendly" + campo `tracker` (do `roadmap-boilerplate.md`) e (ii) o trigger de criação de `NEXT.md` (de `tasks-boilerplate.md` Fase 0). Os demais (formato de "Decisões revisitadas", "Riscos macro", emojis do research-index) ficam como convenção localizada.
- **TODO de migração explícita** em comentário visível no topo da nova seção: anotar que o conteúdo deverá migrar para a futura spec **`governance-information-architecture`** (já presente no backlog), que reorganizará a arquitetura de informação do framework. Isto preserva a coerência arquitetural sem bloquear esta entrega.

##### A.6 — Atualizar `.core/rules/global-rules.md`

Derivado de `[DEC-0018-A04]` (A + D — texto híbrido). Localização: subseção **"Workflow com IA"** (existente). Texto cravado pelo owner:

> **Tipo de spec é declarado no header (`evidence-driven`, `deterministic`, `mixed`).** Specs `evidence-driven` ou `mixed` exigem um gate humano via `decision-brief.md` antes da implementação — o teste é: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_. Detalhes em `.core/process/spec-foundation.md`.

#### [B | Content Overhaul Research-Backed (Rules)]

**Estado atual** (baseline antes da spec):

- `.core/rules/global-rules.md` (pós-b9efb83) tem 20 itens em 3 seções (Princípios de Engenharia, Eficiência de IA, Workflow com IA) — mistura meta-regras do agente, princípios universais de engenharia e workflow operacional sem taxonomia explícita.
- `.core/rules/opt-in/quality-gates.md` (pós-b9efb83) lista 4 categorias com expansão breve dos sensores N+1, race conditions, memory leaks. Heurísticas declarativas, sem fonte e sem evidência de eficácia.
- `.core/rules/{claude,codex,gemini}.md` complementam, mas há sobreposição não-mapeada com `global-rules.md`.
- Conteúdo do b9efb83 foi escrito sem research nem eval — **rascunho candidato a reconciliação**, não estado final (Anexo abaixo).

##### B.0 — Research lifecycle (Stage 1)

5 sínteses externas + 1 medição instrumental. Cada arquivo segue o padrão dos researches já indexados em `research-index.md`.

| Arquivo                                          | Pergunta(s) que responde                                                                                                                                                                          |
| :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `research/2026-04-30-benchmark-rules-content.md` | Como provedores (Anthropic, OpenAI, Google) e OSS curado (Kong, ClickHouse, Bun, multica, awesome-cursorrules, Continue, Aider) estruturam regras editoriais? Que padrões e anti-padrões emergem? |
| `research/2026-04-30-empirical-bugs-ai-code.md`  | Que bugs IA realmente injeta em código (METR, SWE-bench, Aider eval)? "N+1, race conditions, memory leaks" do b9efb83 estão entre os mais frequentes ou foi viés?                                 |
| `research/2026-04-30-external-bug-taxonomies.md` | Como CWE, SEI CERT, Sonar, OWASP-LLM organizam categorias de defeito? Que mapeamento se aplica ao escopo do framework?                                                                            |
| `research/2026-04-30-spec-driven-tools-rules.md` | Como Spec Kit, BMAD, OpenSpec, Continue, Aider tratam regras editoriais vs infraestrutura, e como tratam decisões pré-design?                                                                     |
| `research/2026-04-30-tokens-baseline-budget.md`  | Quantos tokens o `<AI_GUIDELINES>` compilado consome hoje? Distribuição por arquivo? Qual teto factível por arquivo, considerando o orçamento total de contexto típico?                           |

**Síntese cross-research** é absorvida pelo `decision-brief.md` (não há `research/synthesis.md` separado nesta spec). Cada ponto `[DEC-*]` é preenchido com convergências/divergências encontradas.

##### B.1 — Popular o `decision-brief.md` com opções (Stage 1 → Gate)

A partir das 5 sínteses, registrar em `decision-brief.md`:

- `[DEC-0018-B01]` Taxonomia das categorias de regras (quantas? quais?).
- `[DEC-0018-B02]` Colocação por categoria (`global-rules.md` × adapters × opt-in × novos arquivos).
- `[DEC-0018-B03]` Orçamento de tokens (teto por arquivo + agregado).
- `[DEC-0018-B04]` Formato do catálogo de regras (campos, convenção de ID, hierarquia entre arquivos).
- `[DEC-0018-B05]` Metodologia do eval (número de prompts, provedores, métrica, threshold de corte).
- `[DEC-0018-B06]` Fronteira com Spec 0011 (regra-hierarquia).
- `[DEC-0018-B07]` Fronteira com Spec 0009 (harness-engineering).
- `[DEC-0018-B08]` Política de reconciliação do conteúdo b9efb83 (critérios de manter/revisar/reverter).

##### B.2 — Purga radical do legado `b9efb83` (precede a reorganização)

Derivado de `[DEC-0018-B08]` = A + E + L + O. Postura de **purga radical**: regra-a-regra (A), com **source canônica externa obrigatória** (E — CWE / CERT / Sonar RSPEC / OWASP / paper validado), aplicado **ANTES** de qualquer reformatação ou migração de taxonomia (O). Documentação dedicada em `research/2026-04-30-b9efb83-reconciliation.md` (L).

Procedimento:

1. Inventariar as 24 regras candidatas (20 itens em 3 seções de `.core/rules/global-rules.md` + 4 categorias em `.core/rules/opt-in/quality-gates.md`).
2. Para cada regra, atribuir **fonte canônica candidata** (URL + ID externo, ex.: `CWE-89`, `OWASP-LLM01`, `Sonar S2068`). Sem source aceitável, **reverter** sem cerimônia.
3. Tabela final em `research/2026-04-30-b9efb83-reconciliation.md` com colunas: regra / texto original / source proposta / decisão (`manter` | `reverter` | `revisar com source X`) / justificativa.
4. Aplicar reversões em `.core/rules/*.md` num commit isolado, antes de qualquer trabalho de B.3+.

Heurísticas de defeito sem suporte empírico (notavelmente **N+1**, identificado em `research/2026-04-30-empirical-bugs-ai-code.md` § 4 e § 7.3 como ausente das taxonomias maduras) são revertidas. Regras de _race conditions_ e _memory leaks_ são candidatas a manter se source CONCUR/aging-studies pode ser citada explicitamente.

##### B.3 — Arquitetura **Docs-as-Code**: schema bilíngue + parser YAML → `rules.json`

Derivado de `[DEC-0018-B01]` (F + J — taxonomia híbrida + tag de evidência categorizada), `[DEC-0018-B02]` (C + F — escopo de injeção + hierarquia em `opt-in/`), `[DEC-0018-B04]` (E + H + N — estrutura mínima estendida + IDs por escopo + catálogo navegável).

###### Schema canônico de uma regra

Cada regra é um bloco markdown com **frontmatter YAML** + corpo bilíngue. O corpo separa explicitamente o que vai para a IA (inglês, foco em compliance) do que fica para humanos (PT-BR, foco em manutenibilidade OSS).

```markdown
---
id: GR-0001
scope: universal # universal | adapter | opt-in
adapter: null # claude | codex | gemini (se scope=adapter)
opt_in_feature: null # tdd | bdd | quality-gates | ... (se scope=opt-in)
category: security # correctness | security | maintainability | process | editorial
evidence_strength: strong # strong | medium | emerging | declared_heuristic
sources:
  - "CWE-89"
  - "OWASP-A03:2021"
applicable_languages: ["*"]
tags: [sql, input-validation]
---

## [GR-0001] Sanitize SQL inputs

**Instruction (en):**
Always sanitize user input before constructing SQL queries. Use parameterized
queries via the data layer's prepared statement API. Never concatenate user
input into raw SQL strings.

**Documentação (pt-br):**
Sempre higienize entrada de usuário antes de construir queries SQL...

**Why this is an issue / Por que isto é um problema:**
[justificativa em PT-BR]

**Noncompliant example:**
\`\`\`sql
SELECT \* FROM users WHERE name = '${input}';
\`\`\`

**Compliant example:**
\`\`\`sql
SELECT \* FROM users WHERE name = ?;
\`\`\`

**See also:** [GR-0042], [OPT-SECURITY-03]
```

**Convenção de IDs** (`[DEC-0018-B04]` Sub-eixo 2 = H):

- `[GR-NNNN]` — universal (em `.core/rules/global-rules.md`).
- `[ADP-NNNN]` — adapter por IA (em `.core/rules/{claude,codex,gemini}.md`).
- `[OPT-NNNN]` — opt-in (em `.core/rules/opt-in/<feature>/*.md`).

**Categorias-âncora** (`[DEC-0018-B01]` Sub-eixo 2 = J): `correctness` e `security` exigem `evidence_strength: strong` ou `medium` com `sources` não-vazio. `process`, `editorial` e `maintainability` aceitam `declared_heuristic` sem source.

**Hierarquia em `opt-in/`** (`[DEC-0018-B02]` Sub-eixo 2 = F): subdiretórios temáticos (ex.: `opt-in/editorial/`, `opt-in/security/`) — não antecipa a Spec 0011, que tratará da hierarquia profunda também em `global-rules` e nos consumidores.

###### Pipeline de build

```
.core/rules/**/*.md (markdown bilíngue + frontmatter YAML)
        │
        ▼
[1] cli/governance/monolith/rules-parser.mjs
    • Lê todos os .md sob .core/rules/
    • Extrai frontmatter (parser YAML nativo, sem dep externa nova)
    • Valida schema (id único; categoria-âncora exige source; cross-refs apontam IDs existentes)
    • Falha rápido em violação
        │
        ▼
[2] cli/governance/monolith/rules-builder.mjs
    • Serializa o catálogo completo em rules.json (build artifact)
    • Estrutura: { rules: [...], by_id: {...}, by_scope: {...}, generated_at, schema_version }
        │
        ├──▶ rules.json (build artifact — consumido por API/dashboard externo)
        │
        ▼
[3] cli/governance/monolith/compiler.mjs (refatorado)
    • Itera regras filtradas por escopo de injeção (universal + adapters ativos + opt-in selecionados)
    • Extrai apenas o bloco "Instruction (en)" de cada regra
    • Documentação PT-BR fica fora do <AI_GUIDELINES> (economia de tokens, foco em compliance)
        │
        ▼
AGENTS.md do consumidor
    bloco <AI_GUIDELINES> contém:
      - core directives
      - instruction_en de cada regra ativa
      - sem documentação humana (essa vive no repo do framework + dashboard)
```

##### B.4 — Migração das regras sobreviventes para o formato bilíngue

1. Aplicar o schema YAML (B.3) a cada regra que sobreviveu à purga (B.2) e a cada regra introduzida pelo Bloco B.
2. Atribuir IDs canônicos (`[GR-NNNN]`, `[ADP-NNNN]`, `[OPT-NNNN]`).
3. **Tradução qualificada** do campo `Instruction` para Inglês — performance dos modelos de fronteira é mais alta em inglês para instruções imperativas (justificativa registrada em A04 como decisão consciente). Documentação em PT-BR é mantida e melhorada para acessibilidade OSS.
4. Cobertura mínima de cross-refs: cada regra com `category: security` ou `correctness` tem ≥ 1 entrada em `see_also` apontando para regra correlata ou opt-in feature.

##### B.5 — Eval amostral (Stage 2 limitado a baseline)

Derivado de `[DEC-0018-B05]` (C + H + K + N + R) e `[DEC-0018-B07]` (D — apenas amostral nesta spec; eval pleno é da Spec 0009).

| Dimensão         | Decisão                                                                                                          |
| :--------------- | :--------------------------------------------------------------------------------------------------------------- |
| Largura×prof     | Híbrido (C) — broad amostral aqui; calibração trimestral fica para 0009.                                         |
| Asserção         | G obrigatório (RSPEC mínima por regra) + F amostral (delta comportamental) — **H** combinado.                    |
| Provedores       | Claude + Codex + Gemini (K — paritários aos 3 adapters).                                                         |
| Não-determinismo | 3 rodadas (N), passa-rate **2/3**.                                                                               |
| Threshold        | Categorizado (R): regras `evidence_strength: strong` reprovadas → cortadas (hard); demais → débito em `NEXT.md`. |

Output: `research/2026-04-30-eval-results.md` documentando subset selecionado, prompts canônicos, passa-rate por regra × provedor, decisões de corte/débito.

##### B.6 — Token budget: lint heurístico + sanity check Anthropic API

Derivado de `[DEC-0018-B03]` (C + E + H + O + P).

| Sub-eixo             | Decisão                                                                                                                                                                      |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Granularidade     | C — por arquivo **e** agregado.                                                                                                                                              |
| 2. Tipo de teto      | E — **soft ceiling** + audit obrigatório.                                                                                                                                    |
| 3. Valores numéricos | H — agregado ≤ 6 K tokens; universal ≤ 1,5 K; adapter ≤ 600; opt-in ≤ 1,2 K.                                                                                                 |
| 4. Enforcement       | O — lint heurístico local (Tok-H = chars/3,5 calibrado para PT-BR) integrado a `yarn check`; sanity check off-CI via `messages.count_tokens` (script standalone, periódico). |
| 5. Unidade canônica  | P — tokens (Tok-H), com linhas/instruções em comentário derivado.                                                                                                            |

Implementação em `cli/governance/monolith/token-budget.mjs`. Soft ceiling = `WARN`, nunca `FAIL` — alinhado com MindStudio "exceeding the threshold = signal to audit, not to expand". Consumo ≥ 70 % do teto agregado dispara audit obrigatório no PR description **e** funciona como gatilho da Spec 0011 (cf. B.7).

##### B.7 — Catálogo navegável + `NEXT.md` (débitos cravados)

###### Catálogo navegável (`[DEC-0018-B04]` Sub-eixo 3 = N)

`.core/rules/catalog.md` — gerado/mantido como índice humano, com 1 linha por regra (ID + intent curto + escopo + categoria + link). Não é fonte da verdade (regras vivem inline nos seus arquivos canônicos), mas dá visão global e cross-ref navegável. Drift entre catálogo e regras é mitigado por validação cruzada no `rules-parser`.

###### `NEXT.md` (débitos cravados)

Derivado de `[DEC-0018-B06]` (A + F + N) e `[DEC-0018-B07]` (D + H + J).

- **Spec 0011 (regra-hierarquia)** — gatilho mensurável: **agregado compilado ≥ 4,2 K tokens (= 70 % do teto de 6 K)**. Apêndice com snapshot canônico do `<AI_GUIDELINES>` ao fim da 0018 (medição Tok-H, listagem de regras, taxonomia final, cobertura de cross-refs) para que a 0011 inicie com baseline conhecido.
- **Spec 0009 (harness-engineering)** — todo o pipeline automatizado (agente validador separado, sensores em CI, integração `/ultra-review`) fica para 0009 (H). Eval mínimo da 0018 (B.5) **é declarado como baseline-regression**: qualquer mudança no catálogo invalida o baseline e exige re-rodada no harness 0009. Researches 0018 (5 arquivos) ficam congelados em `.specify/specs/researchs/governance/` (J) — F9.2 do encerramento se encarrega.
- **Inovação a abrir como spec futura — Scaffolding Inteligente de Provedores** (registrada em B07): a CLI deverá detectar provedores ativos no consumidor (heurística: presença de `CLAUDE.md`, `.codex/`, `gemini.md` etc.) e gerar automaticamente: (i) **arquivos restritivos** estilo `.claudeignore` focando contexto; (ii) **trampolins** como `CLAUDE.md` contendo apenas `@AGENTS.md` para impedir drift entre adapter file e fonte canônica. Mitiga _Context Rot_ e elimina arquivos soltos. Candidata a virar Spec autônoma após merge da 0018.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Stage 1 (este Plan)

- [ ] `research/2026-04-30-boilerplates-audit.md` produzido com matriz por boilerplate.
- [ ] 5 arquivos research do Bloco B finalizados, cada um com fontes citadas.
- [ ] `decision-brief.md` populado com todos os pontos `[DEC-0018-*]` listados acima, status `Pendente` para cada um, opções com tradeoffs registradas a partir da evidência.
- [ ] Gate humano: owner revisou e marcou cada ponto `Resolved` com escolha + justificativa + data.
- [ ] Status do `decision-brief.md` atualizado para `Resolved` (todos os pontos fechados).

### Stage 2 (Implementação)

**Bloco A — Boilerplates + foundation + global-rules**

- [ ] 7 boilerplates existentes atualizados conforme matriz `[DEC-0018-A01]` (A.2).
- [ ] `tasks-boilerplate.md` reestruturado em 5 fases canônicas (A.3).
- [ ] 3 boilerplates especializados por tipo criados: `tasks-evidence-driven-`, `tasks-deterministic-`, `tasks-mixed-` (A.3).
- [ ] `decision-brief-boilerplate.md` (8º artefato) criado conforme `[DEC-0018-A05]` (A.4).
- [ ] `.core/process/spec-foundation.md` ganha seção "Tipos de spec" com TODO de migração para `governance-information-architecture` (A.5).
- [ ] `.core/rules/global-rules.md` ganha linha cravada em `[DEC-0018-A04]` na subseção "Workflow com IA" (A.6).
- [ ] `spec.md` desta 0018 retroactivamente recebe `Tipo de spec: evidence-driven` no header — registrado em "Decisões revisitadas" como exceção consciente à imutabilidade pós-`In Review` (a regra é criada por esta própria spec).

**Bloco B — Conteúdo + pipeline Docs-as-Code**

- [ ] `research/2026-04-30-b9efb83-reconciliation.md` publicado: 24 regras avaliadas, source canônica externa por regra ou justificativa de reverso (B.2).
- [ ] Reversões de b9efb83 aplicadas em `.core/rules/*` num commit isolado, antes de B.3+ (B.2).
- [ ] `cli/governance/monolith/rules-parser.mjs` implementado com testes BDD em PT-BR + traceability `[BR-*]` (cobertura ≥ 85 %, kill-rate ≥ 60 %) (B.3).
- [ ] Schema YAML formal documentado em `decision-brief-boilerplate.md` (8º artefato) e em `CLAUDE.md` raiz (B.3).
- [ ] `cli/governance/monolith/rules-builder.mjs` gera `rules.json` em build-time; alvo `yarn build:rules` exposto (B.3).
- [ ] `cli/governance/monolith/compiler.mjs` refatorado: extrai apenas `Instruction (en)` para `<AI_GUIDELINES>`; documentação PT-BR fica fora do bloco compilado (B.3).
- [ ] Snapshots de `cli/app/engine.test.mjs` e `cli/governance/agents-merge.test.mjs` revisados e atualizados conscientemente (não silenciosamente) (B.3).
- [ ] Regras sobreviventes migradas para formato bilíngue com IDs canônicos `[GR-*]` / `[ADP-*]` / `[OPT-*]` (B.4).
- [ ] Tradução qualificada do campo `Instruction` para Inglês em todas as regras sobreviventes (B.4).
- [ ] `research/2026-04-30-eval-results.md` publicado: subset crítico × 3 provedores (Claude/Codex/Gemini) × 3 rodadas (B.5).
- [ ] `cli/governance/monolith/token-budget.mjs` implementado: lint heurístico (WARN soft ceiling, sem FAIL) integrado em `yarn check` (B.6).
- [ ] Script standalone `cli/scripts/token-sanity-check.mjs` (off-CI) chama `messages.count_tokens` para auditoria periódica (B.6).
- [ ] `.core/rules/catalog.md` gerado/mantido como índice navegável humano (B.7).
- [ ] `NEXT.md` cravado: gatilho 4,2 K tokens para Spec 0011 + snapshot canônico; baseline-regression para Spec 0009; Scaffolding Inteligente como spec futura (B.7).

### Globais (toda a spec)

- [ ] `yarn check` verde.
- [ ] `yarn test` verde.
- [ ] Diff em consumidor real revisado via `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run` (Stage 2).

---

## 🧪 Estratégia de Testes

- **Unit/Integração (Stage 2)**: testes existentes em `cli/governance/monolith/` e `tests/integration/` continuam verdes; novos componentes (`rules-parser.mjs`, `rules-builder.mjs`, `token-budget.mjs`) seguem a convenção co-located + BDD em PT-BR + traceability `[BR-*]` (cobertura ≥ 85 %, kill-rate ≥ 60 %). Snapshots de `compiler.test.mjs` e `agents-merge.test.mjs` revisados conscientemente para refletir o split bilíngue do `<AI_GUIDELINES>`.
- **Validação cruzada do schema (Stage 2)**: `rules-parser.mjs` valida em build-time (i) IDs únicos, (ii) cross-refs (`see_also`) apontando para IDs existentes, (iii) categorias-âncora (`correctness`, `security`) com `evidence_strength: strong | medium` e `sources` não-vazio. Falha rápido em violação.
- **Token budget (Stage 2)**: `token-budget.mjs` integrado em `yarn check`. Soft ceiling = `WARN`; nunca `FAIL` (alinhado com decisão `[DEC-0018-B03]` E). Sanity check periódico off-CI via `messages.count_tokens`.
- **Editorial (manual, Stage 2)**: lint de redundância cross-arquivo entre `global-rules.md` e adapters; revisão de legibilidade do `AGENTS.md` compilado em consumidor real (`adopt --dry-run`).
- **Empírico (eval B.5)**: subset crítico × 3 provedores × 3 rodadas; resultado em `research/2026-04-30-eval-results.md`. Não roda em CI — débito para Spec 0009 (baseline-regression cravado em `NEXT.md`).

---

## 🛠️ Arquivos modificados (esperado)

**Stage 1 (este passe):**

- `research/2026-04-30-boilerplates-audit.md` (novo).
- `research/2026-04-30-benchmark-rules-content.md` (novo).
- `research/2026-04-30-empirical-bugs-ai-code.md` (novo).
- `research/2026-04-30-external-bug-taxonomies.md` (novo).
- `research/2026-04-30-spec-driven-tools-rules.md` (novo).
- `research/2026-04-30-tokens-baseline-budget.md` (novo).
- `decision-brief.md` (criado em Fase 0; populado durante A.1 e B.1).

**Stage 2 (Implementação):**

_Boilerplates e foundation (Bloco A):_

- `.specify/templates/spec-boilerplate.md` (atualizar — A.2).
- `.specify/templates/plan-boilerplate.md` (atualizar — A.2).
- `.specify/templates/tasks-boilerplate.md` (reestruturar para 5 fases — A.3).
- `.specify/templates/tasks-evidence-driven-boilerplate.md` (novo — A.3).
- `.specify/templates/tasks-deterministic-boilerplate.md` (novo — A.3).
- `.specify/templates/tasks-mixed-boilerplate.md` (novo — A.3).
- `.specify/templates/next-boilerplate.md` (atualizar — A.2).
- `.specify/templates/roadmap-boilerplate.md` (atualizar — A.2).
- `.specify/templates/research-index-boilerplate.md` (atualizar — A.2).
- `.specify/templates/decision-brief-boilerplate.md` (novo, 8º artefato — A.4).
- `.core/process/spec-foundation.md` (nova seção "Tipos de spec" + sync de drift — A.5).
- `.core/rules/global-rules.md` (linha em "Workflow com IA" — A.6 + reorganização Bloco B).

_Conteúdo, pipeline e instrumentação (Bloco B):_

- `.core/rules/global-rules.md` (purga + bilíngue + IDs `[GR-*]` — B.2/B.4).
- `.core/rules/{claude,codex,gemini}.md` (bilíngue + IDs `[ADP-*]` — B.4).
- `.core/rules/opt-in/quality-gates.md` (purga + bilíngue + IDs `[OPT-*]` — B.2/B.4; possível subdiretório `opt-in/security/` ou `opt-in/editorial/` conforme B.3).
- `.core/rules/catalog.md` (novo — B.7).
- `cli/governance/monolith/rules-parser.mjs` + `.test.mjs` (novo — B.3).
- `cli/governance/monolith/rules-builder.mjs` + `.test.mjs` (novo — B.3).
- `cli/governance/monolith/compiler.mjs` + `.test.mjs` (refatorar para bilíngue — B.3).
- `cli/governance/monolith/token-budget.mjs` + `.test.mjs` (novo — B.6).
- `cli/scripts/token-sanity-check.mjs` (novo, off-CI — B.6).
- `package.json` (alvos `yarn build:rules`, hook em `yarn check` para token-budget — B.3/B.6).

_Researches, registros e encerramento:_

- `research/2026-04-30-b9efb83-reconciliation.md` (novo — B.2).
- `research/2026-04-30-eval-results.md` (novo — B.5).
- `NEXT.md` (criado em Fase 5; deletado na Fase 7 — débitos para 0011, 0009, Scaffolding).
- `CHANGELOG.md` (entrada da 0018 — Fase 7).
- `.specify/specs/research-index.md` (Fase 7 — F9.2 do encerramento, migração dos 6 researches).
- `.specify/specs/roadmap/historico.md` + `roadmap/backlog.md` (Fase 7 — encerramento).
- `CLAUDE.md` raiz (documentar o pipeline Docs-as-Code e o schema bilíngue — B.3).
- `spec.md` desta 0018 (header retroativo `Tipo de spec: evidence-driven` — A.2; registrado em "Decisões revisitadas").

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                     | Mitigação                                                                                                                                                   |
| :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 derrapando: research expandindo sem fechar opções | `decision-brief.md` é gate explícito — toda research deve alimentar pelo menos um ponto `[DEC-*]`. Se não alimenta, está fora do escopo.                    |
| Decisão pré-research vazando para Stage 1                 | Lint manual do `plan.md` antes do gate: nenhuma decisão técnica final deve aparecer fora do `decision-brief.md`.                                            |
| Gate humano arrastado                                     | Owner aprova ponto-a-ponto; não exige resolução simultânea de todos. Status `Partial` é estado válido enquanto algumas decisões esperam mais research.      |
| Inflação de tokens no `<AI_GUIDELINES>`                   | Orçamento é decisão validada em `[DEC-0018-B03]`; medição em B.0.5 e re-medição pós-implementação.                                                          |
| Quebra de testes de snapshot do AGENTS.md                 | Atualização de snapshots em Stage 2 com diff revisado; nenhuma alteração silenciosa.                                                                        |
| PR grande (Bloco A + Bloco B)                             | Commits atômicos por sub-bloco. Plano B: split em PRs sequenciais (A antes de B) se ficar pesado.                                                           |
| Eval não-determinístico                                   | Critérios em `[DEC-0018-B05]` precisam endereçar: seed, ≥2 provedores, kill rate como faixa. Aceitar que eval mínimo não substitui harness completo (0009). |
| Conteúdo do b9efb83 ser "trabalho perdido"                | Política em `[DEC-0018-B08]`: reconciliar (não descartar). Conteúdo preservado no Anexo.                                                                    |

---

## 📐 Decisões revisitadas

> Registro cumulativo de mudanças de rota durante a execução. Decisões originais
> validadas no gate humano vivem no `decision-brief.md` (não aqui).

- **2026-04-30 — Reabertura como Draft (revised), pass 1.**
  - **Mudança:** spec original (rev. inicial) foi reescrita. Adicionado **Bloco A** (política framework + auditoria editorial dos 7 boilerplates de SDD). **Bloco B** (content overhaul) reestruturado de "expansão das seções" para fluxo research-first.
  - **Por quê:** spec original violou o ciclo RPI do próprio framework. Acreção sem evidência é AI-slop disfarçado.

- **2026-04-30 — Refatoração para Stage 1 + Gate, pass 2.**
  - **Mudança:** primeira reescrita ainda cravava decisões pré-research (taxonomia (a)/(b)/(c), formato `[RULE-ENG-NN]`, "8–12 prompts × ≥2 provedores"). Reformulada para modelo Stage 1 (research + opções no `decision-brief.md`) → Gate humano → Stage 2 (design + implementação). `decision-brief.md` introduzido como artefato canônico de gate; será formalizado como 8º boilerplate em Bloco A.
  - **Por quê:** owner identificou que a estrutura anterior reproduzia o erro de fundo da rev. inicial — pulava o gate humano pós-research e travava o desenho antes de ter evidência.
  - **Implicação em `tasks.md`:** estrutura completamente reescrita; Fases 4+ (Stage 2) ficam como placeholder até o gate.

- **2026-05-02 — Encerramento Stage 1 + abertura Stage 2.**
  - **Mudança:** gate humano resolveu todos os 14 pontos `[DEC-0018-*]` em `decision-brief.md`. Sub-blocos `A.2`–`A.6` e `B.2`–`B.7` reescritos com desenho técnico cravado: estratégia bilíngue (instrução em inglês para a IA, documentação em PT-BR para humanos), pipeline Docs-as-Code (parser YAML → `rules.json` → compiler bilíngue), purga radical do legado `b9efb83` por source canônica externa, soft ceiling de 6 K tokens (gatilho 4,2 K para Spec 0011), eval amostral em 3 provedores. Novo modelo de 5 fases para `tasks-boilerplate.md` (Setup → Impl A → Impl B → Review prep → Pré-merge close) com split por tipo de spec.
  - **Por quê:** Stage 1 entregou auditoria editorial (boilerplates) + 5 researches externas com decisões fundamentadas. O desenho técnico agora deriva linearmente da matriz de decisões — qualquer rota não derivada do brief é rejeitada como acreção pré-research.
  - **Implicação em `tasks.md`:** Fase 4+ deixa de ser placeholder; passa a operar como **Stage 2 dogfoodando o novo modelo de 5 fases** (Fases 4–7 numeradas continuamente, mapeando para as fases canônicas 1–4 do novo `tasks-boilerplate.md`). Fases 0–3 atuais permanecem como histórico do Stage 1 (já completas).
  - **Exceção consciente à imutabilidade da `spec.md`:** a 0018 cria o campo "Tipo de spec" — sua própria `spec.md` recebe o campo retroativamente em A.2. Justificativa: a regra é instituída por esta spec; aplicar a regra a si mesma é dogfooding necessário.

- **2026-05-02 — Reabertura controlada de A.5 (concorrência de specs + premissa de distribuição dos boilerplates).**
  - **Mudança:** durante 4.A3.2 (criação do `tasks-evidence-driven-boilerplate.md`), o owner identificou dois drifts colaterais que afetam a redação dos boilerplates de tasks e exigem ajuste em A.5 (`.core/process/spec-foundation.md`):
    - (i) **Concorrência de specs** — `spec-foundation.md` linhas 149-150 cravam _"uma spec ativa por vez: feche a spec anterior antes de abrir uma nova"_, lendo-se como restrição global do repo. Isso **contradiz** a research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../../specs/researchs/governance/2026-04-29-concurrency-best-practices.md) (OSS opera com múltiplas RFCs/specs simultâneas, gerenciadas via Issue-first + backlog visualizável) e a própria linha 186 do mesmo documento (_"uma sessão, uma spec ativa"_, escopo de sessão). É **débito da 0017** que vazou — a research foi feita, mas a redação canônica não foi reconciliada.
    - (ii) **Premissa de distribuição** — `.specify/templates/` será ofertado aos repos consumidores como parte da metodologia SDD do framework. Boilerplates devem ser **agnósticos ao stack interno** do `ai-guidelines`; comandos específicos (`yarn check:repo`, CLI `adopt --dry-run`) viram **ilustrações opcionais** com nota de adaptação ao stack do consumidor.
  - **Por quê:** ambos os drifts ficaram visíveis ao escrever o checklist genérico distribuível. Boilerplate replicar a redação ambígua perpetuaria o erro em todos os consumidores.
  - **Implicação em `tasks-boilerplate.md` e `tasks-evidence-driven-boilerplate.md`:** itens 4.7 (concorrência) e 3.4/3.5 (validação em ambiente real) já foram reformulados nesta sessão para refletir o escopo correto + agnosticismo de stack.
  - **Implicação em A.5:** adicionar sub-task `4.A5.5` para reconciliar `spec-foundation.md` linhas 149-150 com a research da 0017 e com a redação alinhada da linha 186. **Não é revisita do gate humano** (`[DEC-0018-A01]` cravou apenas a manutenção do MANDATÓRIO em 0.3 e 3.5, sem fixar redação que diferenciasse sessão × repo) — é fidelidade à fonte canônica + research existente.

- **2026-05-02 — Movimentação `spec-foundation.md` para `.core/process/` (decorrência da premissa de distribuição).**
  - **Mudança:** `docs/process/spec-foundation.md` foi movido (via `git mv`, histórico preservado) para `.core/process/spec-foundation.md`. Stub temporário criado em `docs/process/spec-foundation.md` apontando para o novo path. 18 arquivos vivos atualizados com substituição mecânica (`docs/process/spec-foundation` → `.core/process/spec-foundation`). 4 arquivos imutáveis (Spec 0008 + `roadmap/historico.md`) **não foram tocados** — preservam path antigo via stub.
  - **Por quê:** `.core/` é o material distribuível aos repos consumidores via CLI. Como a premissa cravada nesta sessão é que `.specify/templates/` (e a metodologia SDD por extensão) será ofertada como "riqueza" do framework aos consumidores, a constituição operacional do SDD precisa estar em `.core/` para participar da distribuição. A pasta `.core/process/` é categoria nova (até então só havia `.core/rules/` e `.core/templates/`).
  - **Distribuição efetiva via CLI:** **fora de escopo desta spec.** A 0018 apenas posiciona o arquivo no novo path; a integração no pipeline do `compiler.mjs` / `engine.mjs` é débito explícito da próxima spec de governance (`governance-information-architecture`, candidata em `roadmap/backlog.md`).
  - **Stub temporário:** preservado em `docs/process/spec-foundation.md` para manter links de specs históricas (Spec 0008 e `roadmap/historico.md`) funcionais. Marcado para remoção pela `governance-information-architecture` (registrado como débito em `NEXT.md` ao fim da 0018).
  - **Implicação em A.5:** sub-task `4.A5.0` cravada e marcada `[x]` (movimentação concluída nesta sessão); sub-task `4.A2.9` aberta para revisão de agnosticismo nos 5 boilerplates já commitados em A.2 (após sub-bloco A.3 completo).

---

## 📎 Anexo — Conteúdo candidato pré-research (b9efb83)

Resumo do conteúdo mergeado em `b9efb83` (`feat: implement content deepening framework with new global rules, quality gates, and spec 0018 planning`). Tratado como **rascunho candidato** para reconciliação em Stage 2 conforme política validada em `[DEC-0018-B08]`.

**`.core/rules/global-rules.md` (pós-b9efb83):** 20 itens distribuídos em 3 seções:

- _Princípios de Engenharia_ (7): PT-BR, não modificar arquivos críticos sem confirmação, acesso seguro a chaves, tipagem estrita, estado/imutabilidade, fail-fast, concorrência explícita.
- _Eficiência de IA_ (5): model routing, feedback cirúrgico, modularidade, redução de ruído, check de contexto.
- _Workflow com IA_ (8): plan mode, referenciar padrão existente, PR description colaborativo (3 etapas), patterns agnósticos, padrões-não-paths, RPI obrigatório, contexto enxuto, routing de esforço.

**`.core/rules/opt-in/quality-gates.md` (pós-b9efb83):** 4 categorias:

- Análise estática (complexidade ciclomática, dependências circulares, semântica de nomes).
- Cobertura e mutação (≥85% / ≥60% kill rate).
- Sensores de bugs típicos de IA (N+1, race conditions, memory leaks) — **declarativo, sem fonte**.
- Security & secrets.

**Decisão pré-fato (a ser reconciliada em Stage 2 sob evidência de research e eval):** manter, revisar ou reverter por regra. Nenhuma é assumida correta sem passar pelo filtro do catálogo e/ou eval definidos em `decision-brief.md`.
