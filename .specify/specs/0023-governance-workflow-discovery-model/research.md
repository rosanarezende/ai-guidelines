# Research — Spec 0023 Modelo de Workflow de Governança e Descoberta

> **Stage A (Discovery).** Este `research.md` é o artifact central do Stage A — captura hipóteses, evidências internas, matriz inicial de níveis, anti-patterns observados e perguntas abertas. **NÃO é um mini-plan disfarçado.** Decisões cravadas não pertencem aqui — pertencem ao `decision-brief.md` futuro (a ser criado após gate humano de Stage A → Stage B).
>
> **Cardinalidade declarada:** 1 `research.md` por spec; anexos extensos vão para `./research/` (local à spec) quando são narrativos da própria 0023, ou para `.core/research/` (cross-spec) quando reutilizáveis em specs futuras. A própria 0023 vai decidir/refinar esta cardinalidade como output.
>
> **Spec:** [`./spec.md`](./spec.md) — Stage A em curso.

---

## 1. Hipóteses (explícitas como hipóteses, NÃO como conclusões)

Cada hipótese é formulada com:

- enunciado claro,
- suporte preliminar (evidência interna disponível agora),
- o que precisa ser confirmado,
- condição de falsificação possível.

### H1 — O problema não é "falta de planning"; é "planning antes de discovery"

**Enunciado:** a causa-raiz mais provável do churn observado em specs recentes não é planejamento insuficiente; é planejamento construído sobre premissas implícitas/frágeis que não foram investigadas. **Hipótese a confirmar** — pode haver casos genuínos de planning insuficiente que esta hipótese não cobre.

**Suporte preliminar:**

- Spec 0022 PR #15 fechado por escopo invertido (planning de "de-arrumação" sob premissa CLI-first não auditada).
- Spec 0022 PR #16 com `plan.archived.md` e `tasks.archived.md` arquivados por "invalidação metodológica" — cabeçalhos explícitos declaram "nasceu antes do discovery arquitetural correto".
- Spec 0021 com escopo expandido duas vezes (2026-05-09 gate humano + 2026-05-17 amendment 4.E) — cada expansão foi reação a discovery emergente DURANTE execução, não a planejamento insuficiente no início.

**O que precisa ser confirmado:** a hipótese explica todos os casos de churn observados, ou alguns são genuinamente "planning insuficiente"? Como diferenciar os dois?

**Falsificação possível:** se uma spec executada sob o novo lifecycle (com `research.md` real antes de `decision-brief.md`) ainda gerar churn equivalente, a hipótese está incorreta ou incompleta.

### H2 — Os 7 pilares atuais podem estar corretos, mas em nível taxonômico errado

**Enunciado:** a taxonomia atual (`spec`, `spike`, `fix`, `patch`, `incident`, `proposal`, `experiment`) tratada como "tipos de WorkItem" no mesmo nível pode estar misturando categorias de níveis diferentes — alguns parecem **workflow families**, outros parecem **operational states**, outros parecem **decision objects** (pré-decisão).

**Suporte preliminar:**

- A 0021 entregou os 7 pilares no nível de WorkItem (objeto de domínio único, taxonomia uniforme). Esse nível serve perfeitamente para o registry (`registry.yml` SSOT), mas pode não servir para o lifecycle — cada pilar pode exigir lifecycle diferente.
- `incident` parece distinto operacionalmente: é uma **mudança de estado emergente** que pode disparar trabalho de qualquer outro tipo (fix / patch / spike / proposal); tratá-lo como "tipo igual a spec" parece categoria-erro.
- `proposal` é pré-decisão (sem comprometimento de execução); virar `spec` é promoção formal. O lifecycle de `proposal` é estruturalmente mais curto que o de `spec`.
- Detalhamento das observações em [`research/taxonomia-observacoes.md`](./research/taxonomia-observacoes.md).

**O que precisa ser confirmado:** mapear cada pilar contra os níveis candidatos (workflow family / artifact / lifecycle stage / governance context / operational state / decision object) com exemplos concretos do repo e identificar conflitos onde a categoria não explica completamente.

**Falsificação possível:** se cada pilar puder ser plenamente descrito em um único nível sem perda de informação, a hipótese está incorreta — os 7 pilares estão no nível certo e o problema é outro.

### H3 — Os boilerplates atuais embutem epistemologia execution-first

**Enunciado:** os arquivos em `.specify/templates/` provavelmente são mais do que "só templates" — parecem materializar um workflow implícito (`spec → decision-brief → plan → tasks` linear) que assume execução iminente e não oferece lugar canônico para discovery profunda. **Hipótese a confirmar caso a caso**, não conclusão.

**Suporte preliminar:**

- `spec-boilerplate.md` tem `Decision Brief: [./decision-brief.md](./decision-brief.md)` e `Plan: [./plan.md](./plan.md)` no header — implicita que esses arquivos vão existir desde o setup.
- `plan-boilerplate.md` declara "vive durante execução" — sugere que existe desde o setup, antes de qualquer research.
- `tasks-boilerplate.md` tem variante `tasks-evidence-driven-boilerplate.md` que inclui Stage 1 (Research) como sub-bloco do tasks, não como artifact independente.
- Não há `research-boilerplate.md` no template SDD.
- Detalhamento das observações em [`research/boilerplates-audit.md`](./research/boilerplates-audit.md).

**O que precisa ser confirmado:** quais boilerplates específicos induzem qual comportamento errado, com referência a casos concretos.

**Falsificação possível:** se nenhum dos boilerplates conseguir ser citado como causa direta de planning prematuro em casos concretos, a hipótese está incorreta — o problema está em outro lugar (cultura, hábito, treinamento de autores).

### H4 — `research.md` resolve o vácuo sem precisar reescrever o lifecycle inteiro

**Enunciado:** adicionar `research.md` como artifact obrigatório no Stage A (antes de `decision-brief.md`) pode ser suficiente para resolver o churn, sem reescrever `spec-boilerplate`/`decision-brief-boilerplate`/`plan-boilerplate`/`tasks-boilerplate`.

**Suporte preliminar:**

- A maior parte do churn observado nas Specs 0021 e 0022 vem da **ausência de discovery disciplinada**, não de problemas nos artefatos posteriores.
- Boilerplates existentes têm framing parcial — `tasks-evidence-driven-boilerplate.md` e `tasks-mixed-boilerplate.md` já tentam separar research de execution (Stage 1 vs Stage 2). Falta apenas o artifact concreto canônico (e tirá-lo de "sub-bloco do tasks" para "artifact independente").

**O que precisa ser confirmado:** o `research.md` por si só basta, ou ele exige alterações pontuais em outros boilerplates para coerência (ex.: `spec-boilerplate.md` aceitar `Decision Brief: (a definir)` no header sem link quebrado)?

**Falsificação possível:** se aplicar `research.md` sem outras mudanças não reduzir churn em 2+ specs novas executadas após esta 0023 fechar, a hipótese precisa ser revisada.

---

## 2. Evidências internas do repo (com links relativos)

### 2.1 Churn por planning prematuro

- **Spec 0022 PR #15** ([fechado](https://github.com/rosanarezende/ai-guidelines/pull/15)) — escopo "de-arrumação" (`git mv cli src/cli`) vetado pela owner por inverter o problema real (não resolveria a duplicação arquitetural, só a visual).
- **Spec 0022 PR #16** ([draft](https://github.com/rosanarezende/ai-guidelines/pull/16)) — escopo "cutover arquitetural completo via DDD/TDD/BDD". Branch `feat/spec-0022-cli-runtime-cutover`. Os arquivos [`plan.archived.md`](../0022-cli-runtime-cutover/plan.archived.md) e [`tasks.archived.md`](../0022-cli-runtime-cutover/tasks.archived.md) carregam cabeçalho explícito **"🚫 ARQUIVADO — NÃO USAR COMO BASE DE IMPLEMENTAÇÃO"**. O [`spec.md` da 0022](../0022-cli-runtime-cutover/spec.md) está marcado como **"Status: Paused — Stage A (Discovery)"** justamente porque a sessão 2026-05-18 revelou que o framing ainda estava enviesado por CLI-first/runtime-assumption mesmo após corrigir o erro do PR #15.

### 2.2 Inflação do `NEXT.md` como caixote

- **Spec 0021** `NEXT.md` chegou a **208 linhas com 10 itens em "Fase 4"** durante o sub-bloco 4.C, somando débitos acumulados das Fases 0–3. A sanitização em 4.C.[SANITIZE-NEXT] (commit `9bd5aa0`) reduziu para 45 linhas com 1 débito ativo. O item "Cutover completo da CLI mjs para `src/` DDD" foi migrado para `roadmap/backlog.md` — ali estava implícito antes, "empurrado com a barriga".
- Trilha narrativa completa em [`.specify/specs/0021-governance-information-architecture/closure-review.md`](../0021-governance-information-architecture/closure-review.md) §6.

### 2.3 Confusão de artifact (artefatos informais cumprindo papéis canônicos)

- **Auditorias ad-hoc dentro de pastas de specs**: a 0021 tem [`audit-2026-05-10-pre-2d-sanitization.md`](../0021-governance-information-architecture/audit-2026-05-10-pre-2d-sanitization.md), [`audit-2026-05-11-pre-3c4-living-docs-aggregation.md`](../0021-governance-information-architecture/audit-2026-05-11-pre-3c4-living-docs-aggregation.md), [`audit-2026-05-11-pre-3d-template-engine.md`](../0021-governance-information-architecture/audit-2026-05-11-pre-3d-template-engine.md). Nasceram fora do template, sem contrato canônico. Funcionaram informalmente como `research.md`. Evidência de que o template SDD vigente não tem lugar canônico para esse tipo de artifact.
- **`closure-review.md` da 0021**: documento de boundary review e debt transfer assessment para spec de fundação. Nasceu sem template, durante a sessão de design 2026-05-18, como artifact reconhecido necessário. Cabeçalho declara explicitamente "**NÃO é parte do template SDD vigente** — nasce de uma necessidade descoberta durante a sessão de design 2026-05-18".

### 2.4 Boilerplates induzindo comportamento errado

- Detalhamento item-a-item em [`research/boilerplates-audit.md`](./research/boilerplates-audit.md).

### 2.5 Mistura taxonômica nos 7 pilares

- Observações detalhadas em [`research/taxonomia-observacoes.md`](./research/taxonomia-observacoes.md).

---

## 3. Matriz inicial (rascunho) — separando níveis

> **Aviso:** isto é **rascunho de Stage A**, NÃO conclusão. Preenchido com exemplos do repo. A coluna "Nível provável" registra hipótese, não decisão. Conflitos conhecidos estão na última coluna — são esperados nesta fase e alimentam a investigação.

| Conceito atual                  | Nível provável (hipótese)                                | Evidência interna sugerindo o nível                                                                                                                             | Conflito conhecido                                                                           |
| :------------------------------ | :------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| `spec`                          | workflow family (delivery container)                     | Toda spec hoje percorre `spec.md → decision-brief.md → plan.md → tasks.md`; é a unidade canônica do framework.                                                  | Algumas "specs" são na prática ADRs disfarçadas (ex.: 0018 é majoritariamente um princípio). |
| `proposal`                      | decision object (pré-decisão)                            | Não tem comprometimento de execução; lifecycle muito mais curto (nasce no backlog → recebe rationale → promovida ou descartada).                                | Hoje é tratada como WorkItem no mesmo nível de `spec`.                                       |
| `spike`                         | workflow family (time-boxed learning)                    | Lifecycle distinto: time-boxed, output é aprendizado técnico (PoC/prototype), não código de produção. ADR 0001 formaliza o vocabulário.                         | Pode disparar `spec` ou `proposal` ou nada — relação cruzada com outros pilares.             |
| `experiment`                    | workflow family (hypothesis-driven)                      | Exige `hypothesis` explícita + métricas + outcome `won`/`lost`/`inconclusive` (ADR 0002). Output é aprendizado validado, não necessariamente código mergeado.   | Pode disparar `spec` quando ganha — relação semelhante a `spike`.                            |
| `fix`                           | workflow family (delivery mode pequeno)                  | Pequeno escopo, raramente exige `decision-brief.md`/`plan.md`/`tasks.md` extensos. Lifecycle quase trivial.                                                     | Distinção `fix` vs `patch` é sutil — podem ser duplicação.                                   |
| `patch`                         | workflow family? subset de `fix`? operacional?           | Possíveis interpretações: (a) hotfix urgente; (b) ajuste sem bug (config, versão); (c) sinônimo informal de `fix`.                                              | Categoria mais ambígua entre os 7 pilares.                                                   |
| `incident`                      | operational state (não workflow family)                  | Mudança de estado emergente; pode disparar `fix`, `patch`, `spike`, ou `proposal`. Lifecycle: detectado → contido → diagnosticado → resolvido (via outro tipo). | Atualmente é WorkItem com `kind: incident` — categoria-erro provável.                        |
| `decision-brief.md`             | artifact (não universal)                                 | Obrigatório em specs `evidence-driven`/`mixed`; opcional em `deterministic`. Hoje é gate humano.                                                                | Patches/fixes raramente exigem; ainda assim, `tasks-boilerplate` referencia-o.               |
| `plan.md`                       | artifact (não universal)                                 | Faz sentido em delivery longo, raramente em patch/spike curto.                                                                                                  | `plan-boilerplate.md` declara "vive durante execução" — sugere que sempre existe.            |
| `tasks.md`                      | artifact (não universal)                                 | Idem `plan.md`.                                                                                                                                                 | Idem.                                                                                        |
| `research.md` (proposto novo)   | artifact universal em Stage A                            | Hipótese H4: deve ser obrigatório quando research é necessária; opcional para workflows triviais (patches, hotfixes).                                           | Inexistente no template atual — está sendo definido por esta própria spec.                   |
| `closure-review.md` (caso 0021) | artifact (não universal; specs de fundação/convergência) | Inaugurado pela 0021 sem template, durante sessão de fechamento. Evidência de gap no template SDD para specs que estabelecem paradigma.                         | Sem boilerplate; sem critério canônico de quando usar.                                       |
| `NEXT.md`                       | artifact universal (durante a spec)                      | Já existe; é deletado ao fechamento; itens relevantes migram para `roadmap/backlog.md`. Funcional.                                                              | Tende a inflar como caixote — caso documentado da 0021.                                      |

---

## 4. Anti-patterns observados

### AP1 — Plan/tasks nascendo antes de research

**Sintoma:** o autor cria `plan.md` e `tasks.md` no setup da spec, sem `research.md` ou audit prévio.

**Caso concreto:** Spec 0022 PR #16 — `plan.md` e `tasks.md` foram criados no commit inicial da branch, antes que qualquer investigação arquitetural tivesse acontecido. Arquivados depois como "ARCHIVED — methodologically invalid". Ver [`plan.archived.md`](../0022-cli-runtime-cutover/plan.archived.md) e [`tasks.archived.md`](../0022-cli-runtime-cutover/tasks.archived.md).

**Causa provável:** o template SDD vigente trata `plan.md`/`tasks.md` como artefatos do setup (existem desde a Fase 0); não há gate explícito impedindo criação prematura.

### AP2 — `decision-brief.md` genérico que induz decisão

**Sintoma:** o `decision-brief.md` é instanciado a partir do boilerplate com perguntas A/B/C que parecem genéricas mas embutem premissas implícitas — o owner que assina o gate herda essas premissas sem percebê-las.

**Caso concreto:** Spec 0022 PR #16 — [`decision-brief.md` da 0022](../0022-cli-runtime-cutover/decision-brief.md) foi marcado como "**historical pre-discovery framing artifact**". As 6 perguntas embutiam pressupostos CLI-first/runtime-assumption que não tinham sido auditados em research independente.

**Causa provável:** sem `research.md` que ancore as opções em evidência empírica, as perguntas do brief flutuam sobre premissas implícitas do autor.

### AP3 — "Spec como container universal"

**Sintoma:** toda iniciativa é tratada como `spec`, mesmo quando seria mais bem servida por outro pilar (patch/fix/spike/incident). Patches e fixes herdam `plan.md`/`tasks.md` por reflexo, gerando overhead desproporcional ao tamanho do trabalho.

**Caso concreto preliminar:** evidência específica a ser coletada durante a execução da 0023 (citar 2–3 exemplos concretos no encerramento). Hipótese inicial: PRs pequenos eventualmente nascem como spec por hábito do template.

**Causa provável:** ausência de **matriz workflow → artefatos mínimos** no `governance-foundation.md`. Sem critério objetivo, o reflexo é "abrir spec".

### AP4 — `NEXT.md` virando caixote

**Sintoma:** débitos são empilhados sem classificação imediata (resolvido aqui / migra pro backlog / vira spec própria); ao final, o `NEXT.md` precisa de "sanitize" pesado.

**Caso concreto:** Spec 0021 `NEXT.md` 208 linhas → 45 linhas após 4.C.[SANITIZE-NEXT]. Ver [`closure-review.md` §6](../0021-governance-information-architecture/closure-review.md).

**Causa provável:** falta de regra editorial visível "classifique na hora" + ausência de gate quantitativo (linhas / itens abertos por fase).

### AP5 — Artefatos informais cumprindo papéis canônicos sem template

**Sintoma:** documentos importantes nascem fora do template (`audit-YYYY-MM-DD-*.md`, `closure-review.md`) porque o template vigente não tem lugar canônico para eles. Eles cumprem o papel, mas não têm contrato — formato, conteúdo, ciclo de vida e relação com outras specs ficam ad-hoc.

**Caso concreto:** 3 audits dentro da pasta da Spec 0021 + 1 closure-review. Ver §2.3.

**Causa provável:** template SDD execution-first não tem `research-boilerplate.md` nem `closure-review-boilerplate.md`.

---

## 5. Perguntas abertas (insumo para futuro `decision-brief.md` da 0023)

> Estas perguntas **não** são respondidas aqui. Elas alimentam o `decision-brief.md` que nascerá **depois** do gate humano de Stage A → Stage B. Quem responder antes está pulando o ritual da própria spec.

1. **P1 — Granularidade do lifecycle.** Quantos estágios? Algo na linha de 4 (Discovery → Framing → Gate → Planning) é suficiente, ou patch precisa de lifecycle mais curto (ex.: Discovery + Planning direto, sem Framing/Gate formal)?

2. **P2 — Cardinalidade de `research.md`.** 1:1 com spec? Pode ter múltiplos `research.md` por spec (um por tópico)? Qual critério decide entre `research/` local à spec vs `.core/research/` (cross-spec)?

3. **P3 — Taxonomia dos 7 pilares.** Mantém os 7 como estão (no nível atual de WorkItem)? Reposiciona alguns para outros níveis (ex.: `incident` vira operational state)? Adiciona ou remove pilares? **Output deve ter rationale por pilar**, não decisão em bloco.

4. **P4 — Gate humano em quais transições.** Hoje há gate em Stage 1 → Stage 2 (decision-brief Resolved). O novo lifecycle precisa de gates adicionais? Ex.: research review (Stage A → Stage B)?

5. **P5 — Convivência com workflows não-spec.** Como patches/fixes/incidents entram no lifecycle? Compartilham o setup da spec (mesmo tipo de pasta, mesmos artefatos opcionais) ou têm setup próprio mais leve?

6. **P6 — Migração das specs existentes.** As specs já fechadas (0008–0021) precisam ser retrofitadas para o novo modelo? Provavelmente não (preservar histórico), mas precisa decisão explícita para evitar ambiguidade.

7. **P7 — Política de `.core/research/`.** Naming, versionamento, citação cross-spec, ciclo de vida (research envelhece?), permanência (research vira ADR?).

8. **P8 — Aplicação ao próprio runtime.** O lifecycle se aplica também a refatorações de código (ex.: cutover da 0022)? Ou é só para specs metodológicas/de feature/de governança?

9. **P9 — Dogfooding da própria 0023.** Esta spec consegue ser fechada sob o lifecycle que ela define? Onde aparecem atritos? (Esta pergunta se responde pela própria execução da spec, não por análise antecipada.)

10. **P10 — `closure-review.md` como artifact canônico.** Devemos formalizar `closure-review-boilerplate.md` no template? Se sim, qual critério objetivo de "quando usar"?

---

## 6. Próximos passos do Stage A

> **Checklist de investigação — NÃO é checklist de implementação.** Verbos esperados: _coletar evidência_, _mapear exemplos_, _validar links_, _refinar hipótese_, _falsificar_. Verbos proibidos nesta seção: _implementar_, _criar boilerplate_, _publicar_, _decidir_, _canonizar_. Quem precisar desses últimos está pulando o gate de Stage A → Stage B.

- [ ] **Coletar evidência adicional para H1–H4.** Cada hipótese precisa de ao menos 2 casos concretos do repo registrados em "Suporte preliminar" — ou contraexemplo registrado em "Falsificação possível".
- [ ] **Mapear exemplos concretos para AP3 ("spec como container universal").** Citar 2–3 PRs/specs do repo onde o reflexo "abrir spec" gerou overhead desproporcional.
- [ ] **Refinar a matriz inicial (§3).** Cada conceito recebe 1–2 exemplos concretos do repo + ao menos 1 conflito conhecido onde a categoria não explica completamente o uso real.
- [ ] **Completar os anexos** [`research/taxonomia-observacoes.md`](./research/taxonomia-observacoes.md) e [`research/boilerplates-audit.md`](./research/boilerplates-audit.md) conforme novos casos forem identificados.
- [ ] **Validar links relativos.** Toda referência cruzada (0021, 0022, ADRs, anexos locais) deve apontar para arquivo existente no repo, ou ser convertida em referência textual sem hyperlink.
- [ ] **Releitura crítica final** caçando trechos conclusivos sem marcação de hipótese — ver critério em §7 abaixo.

---

## 7. Condições para abrir o Gate (Stage A → Stage B)

> **Esta seção NÃO abre o gate.** Apenas define critérios observáveis que indicam quando a investigação está madura o suficiente para o `decision-brief.md` nascer. O gate em si é assinado pela owner em rodada própria, após esta lista estar substancialmente atendida.

Critérios mínimos para considerar Stage A pronto para encerrar:

- [ ] **Hipóteses H1–H4 ancoradas em evidência interna suficiente.** Cada hipótese tem ao menos 2 casos concretos do repo (sob suporte preliminar ou condição de falsificação documentada). Hipóteses sem evidência convergente são rebaixadas para "perguntas abertas" ou descartadas explicitamente em §5.
- [ ] **Matriz inicial (§3) rascunhada com conflitos.** Cada conceito da matriz tem ao menos 1 exemplo do repo + 1 conflito conhecido onde a categoria não explica completamente. Lacunas (linhas com "TBD") estão fechadas ou justificadas como "investigação remetida ao `decision-brief.md`".
- [ ] **Principais ambiguidades dos 7 pilares mapeadas por nível.** O anexo [`research/taxonomia-observacoes.md`](./research/taxonomia-observacoes.md) cobre cada um dos 7 pilares com hipótese de nível taxonômico + ao menos 1 conflito conhecido. Pilares ainda "sem hipótese" estão explicitamente listados como tal.
- [ ] **Lista de perguntas abertas (§5) madura.** As 10 perguntas P1–P10 estão em estado "prontas para virar pontos `[DEC-0023-*]` no `decision-brief.md`" — ou seja: cada uma tem opções candidatas pré-mapeadas, mesmo que sem decisão.
- [ ] **Sem trechos conclusivos sem marcação de hipótese.** Releitura crítica final do `research.md` e dos anexos confirma que conclusões cravadas não vazaram para Stage A (todo trecho assertivo está explicitamente marcado como hipótese, observação preliminar ou pergunta).
- [ ] **Aviso editorial alinhado.** O cabeçalho deste `research.md` continua sinalizando que decisões pertencem ao `decision-brief.md` futuro, não a este arquivo.

**Quando todos os critérios acima estiverem substancialmente atendidos**, a owner decide se abre o gate (e materializa `decision-brief.md`) ou se a investigação precisa de mais uma rodada. **A criação de `decision-brief.md` é o sinal de que o Stage A fechou.** **Não criar antes.**
