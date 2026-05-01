# Plan — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft (revised 2026-04-30) — **Stage 1 (Research)**

> **Plano em dois passes.** Stage 1 (este conteúdo) só formula perguntas
> de pesquisa, eixos de análise e critérios de decisão — sem cravar
> taxonomia, formato de catálogo, metodologia de eval ou fronteiras.
> Decisões emergem do `decision-brief.md` após gate humano. Stage 2
> (preencher pós-gate) acrescenta apêndice com decisões validadas e
> desenho técnico derivado.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Dogfood radical em duas dimensões: (a) a primeira spec de conteúdo do framework é a que cria a regra que a rege; (b) a primeira instância de `decision-brief.md` (esta) é o protótipo do `decision-brief-boilerplate.md` que o Bloco A formalizará. Os dois blocos compartilham o mesmo insight raiz — "infraestrutura amadureceu, conteúdo e disciplina editorial não" — e vivem na mesma branch e mesma PR. Ambos seguem **Stage 1 (research → opções no decision-brief) → Gate humano → Stage 2 (design + implementação)**; nada é decidido pré-research.

ADRs estendidos (referência, não modificação): **0004** (Governance Single Responsibility — base candidata para a taxonomia categorial) e **0008** (Monolithic Runtime Compiler — envelope físico que informa o orçamento de tokens). Nenhum ADR novo é introduzido nesta spec.

### Componentes ou Sub-blocos

#### [A | Política Framework + Auditoria Editorial das Boilerplates]

**Estado atual** (baseline antes da spec):

- `.specify/templates/` contém 7 boilerplates: `spec-`, `plan-`, `tasks-`, `next-`, `research-index-`, `roadmap-`, `project-config-`.
- `docs/process/spec-foundation.md` canoniza lifecycle de specs, política `NEXT.md`, política de migração de research e categorias universal × opt-in **para regras**, mas **não** classifica specs por tipo de entrega (conteúdo × infra) e **não** descreve workflow em dois passes.
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

##### A.2 a A.6 — Stage 2 (preencher pós-gate)

> Tasks de implementação derivadas das decisões validadas em `decision-brief.md`.
> Esta seção será reescrita após Stage 1 + Gate.

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

##### B.2 a B.5 — Stage 2 (preencher pós-gate)

> Catálogo, eval, reconciliação e aplicação final em `.core/rules/*` derivam das decisões validadas em `decision-brief.md`.
> Esta seção será reescrita após Stage 1 + Gate.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Stage 1 (este Plan)

- [ ] `research/2026-04-30-boilerplates-audit.md` produzido com matriz por boilerplate.
- [ ] 5 arquivos research do Bloco B finalizados, cada um com fontes citadas.
- [ ] `decision-brief.md` populado com todos os pontos `[DEC-0018-*]` listados acima, status `Pendente` para cada um, opções com tradeoffs registradas a partir da evidência.
- [ ] Gate humano: owner revisou e marcou cada ponto `Resolved` com escolha + justificativa + data.
- [ ] Status do `decision-brief.md` atualizado para `Resolved` (todos os pontos fechados).

### Stage 2 (pós-gate — DoD a ser detalhado)

> A ser preenchido após Gate humano.

### Globais (toda a spec)

- [ ] `yarn check` verde.
- [ ] `yarn test` verde.
- [ ] Diff em consumidor real revisado via `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run` (Stage 2).

---

## 🧪 Estratégia de Testes

- **Unit/Integração**: testes existentes em `cli/governance/monolith/` e `tests/integration/` cobrem o pipeline. Devem continuar verdes; ajustar snapshots em Stage 2 se a estrutura do `<AI_GUIDELINES>` mudar.
- **Editorial (manual, Stage 2)**: lint de redundância cross-arquivo entre `global-rules.md` e adapters; revisão de legibilidade do AGENTS.md compilado.
- **Empírico (eval B-Stage 2)**: detalhes definidos em `[DEC-0018-B05]`. Resultado em `research/2026-04-30-eval-results.md`. Não roda em CI por agora — débito para Spec 0009.

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

**Stage 2 (pós-gate — lista exaustiva a ser refinada conforme decisões):**

- `.specify/templates/*` (7 existentes + 1 novo `decision-brief-boilerplate.md`).
- `docs/process/spec-foundation.md`.
- `.core/rules/global-rules.md`.
- `.core/rules/opt-in/quality-gates.md`.
- `.core/rules/{claude,codex,gemini}.md` (potencial, conforme `[DEC-0018-B02]`).
- `research/2026-04-30-eval-results.md` (novo, Stage 2).
- `CHANGELOG.md`.
- `.specify/specs/research-index.md` (encerramento).
- `NEXT.md` (criado se houver débitos — fronteiras 0011/0009 conforme `[DEC-0018-B06]`/`[DEC-0018-B07]`).

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
