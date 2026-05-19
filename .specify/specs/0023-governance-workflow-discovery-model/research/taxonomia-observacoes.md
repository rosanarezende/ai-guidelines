# Anexo — Observações sobre a Taxonomia dos 7 Pilares

> **Anexo da Spec 0023 [`research.md`](../research.md)**, alimentando as seções §2.5 (Evidências — mistura taxonômica), §3 (Matriz inicial) e §5 P3 (Perguntas abertas — taxonomia dos pilares).
>
> **Stage A — observação, não conclusão.** Os reposicionamentos sugeridos aqui são hipóteses ancoradas em evidência interna, não decisões. A decisão final está no `decision-brief.md` futuro da 0023.

---

## 1. Como a Spec 0021 entregou os 7 pilares

A Spec 0021 consolidou os 7 pilares (`spec`, `spike`, `fix`, `patch`, `incident`, `proposal`, `experiment`) como **WorkItem** — taxonomia uniforme sob um único modelo de domínio em `src/domain/work-item/WorkItem.ts`. O registry estruturado (`registry.yml` SSOT) trata todos os 7 como instâncias do mesmo agregado, distinguidas pelo campo `kind`. Testes de invariante (`Pillars.test.ts`) protegem essa uniformidade.

Isso serve perfeitamente o **registry como SSOT estruturado** — todo trabalho em curso vive num único arquivo legível por humanos e agentes, com schema validado e drift guard ativo. **Esse mérito é real e não está em discussão.**

A pergunta que esta 0023 faz é outra: **o registry é estado; o lifecycle não é**. O fato de os 7 pilares compartilharem a mesma estrutura de WorkItem (estado) não implica que percorrem o mesmo lifecycle (transições). Tratá-los como "tipos de trabalho equivalentes" para fins de lifecycle pode ser categoria-erro.

---

## 2. Sinais de mistura taxonômica (observações iniciais)

### 2.1 `incident` como categoria diferenciada

`incident` é declarado como pilar par dos outros 6. Operacionalmente, porém:

- Um `incident` é uma **mudança de estado emergente** do sistema (algo quebrou, há urgência percebida) — não um "tipo de trabalho iniciado por decisão".
- Resolver um `incident` envolve disparar **outro tipo** de trabalho: um `fix`, um `patch`, um `spike` (para diagnosticar), ou até abrir uma `proposal` (mudança preventiva pós-incident).
- O lifecycle parece ser: **detectado → contido → diagnosticado → resolvido via outro tipo → post-mortem**. O verbo central é "responder", não "executar".

**Hipótese a investigar:** `incident` é **operational state** (estado do sistema), não **workflow family** (tipo de trabalho). No registry, poderia continuar como entrada, mas com schema diferente (referência cruzada para o WorkItem-resposta que o resolveu, por exemplo).

**Conflito conhecido:** se `incident` virar operational state, o schema atual do registry (`kind: incident`) muda. Isso pode quebrar drift guards e auditorias. Decisão precisa ponderar custo vs benefício epistemológico.

### 2.2 `proposal` vs `spec`

`proposal` é pré-decisão; `spec` é trabalho comprometido. O lifecycle parece:

- `proposal` nasce no backlog ou via Ciclo de Fricção → recebe rationale e contexto → ou é **promovida para `spec`** (com gate humano) ou é **descartada** (registrada em `historico.md`).
- `spec` nasce com comprometimento → recebe `decision-brief` (se evidence-driven/mixed) → executa.

**Hipótese a investigar:** `proposal` é **decision object** (objeto pré-decisão), `spec` é **delivery container** (objeto pós-decisão). Compartilham metadado no registry (ambos têm id, título, owner), mas não compartilham lifecycle.

**Conflito conhecido:** hoje já existe `status: Proposed` para specs em estágio inicial. Se `proposal` virar decision object próprio, a fronteira entre "proposal" e "spec.status=Proposed" precisa ser explícita — sob risco de duplicar conceito.

### 2.3 `fix` vs `patch`

A distinção entre os dois é a mais ambígua entre os 7 pilares. Possíveis interpretações observadas:

- **(a) Por intenção:** `fix` = corrige bug de comportamento (havia algo errado); `patch` = ajuste pontual sem bug (atualizar versão, ajustar config, melhorar mensagem).
- **(b) Por urgência:** `patch` = hotfix urgente subset de `fix`; `fix` genérico inclui ambos.
- **(c) Por escopo:** `patch` = micro-mudança (1–2 arquivos); `fix` = mudança maior.
- **(d) Sinônimos informais:** o mesmo conceito sob nomes diferentes, herdado de hábito não-codificado.

**Hipótese a investigar:** **provável duplicação de categoria** (interpretação (d) explica o uso). Se mantidos os dois, é preciso critério objetivo de quando usar qual, sob risco de gerar inconsistência cross-spec.

**Conflito conhecido:** consumidores externos podem ter expectativas culturais diferentes sobre `fix` vs `patch` (semver `PATCH`, hotfix, etc.). A nomenclatura é exposta ao consumidor.

### 2.4 `experiment`

`experiment` tem o lifecycle mais distinto entre os 7 pilares:

- Exige `hypothesis` explícita registrada.
- Exige métricas declaradas antes da execução.
- Termina com outcome `won` / `lost` / `inconclusive` (enum fechado, ADR 0002 §4).
- Output esperado: **aprendizado validado**, não necessariamente código mergeado em produção.
- Pode disparar `spec` (quando ganha) ou ser arquivado (quando perde / inconclusivo).

Tratá-lo como "tipo igual a spec" perde toda essa estrutura.

**Hipótese a investigar:** `experiment` é claramente uma **workflow family** distinta, com artefatos próprios potencialmente necessários (`hypothesis.md`, `findings.md`?) que não existem hoje no template SDD.

**Conflito conhecido:** se `experiment` exigir boilerplates próprios (`hypothesis.md`, `findings.md`), a 0023 precisa decidir se cria esses boilerplates como output ou se isso vira spec dedicada futura. A § "Fora do escopo" da 0023 declara que **não** redesenha boilerplates existentes, mas **pode** criar boilerplates **novos** quando o lifecycle exigir.

### 2.5 `spike`

`spike` é time-boxed por design (vocabulário XP/Scrum, ADR 0001):

- Output é aprendizado técnico (PoC, prototype, estudo).
- Não exige merge de código de produção.
- Pode disparar `spec`, `proposal`, ou nada (descartado com aprendizado registrado).
- Lifecycle curto: time-boxed → estudo → conclusão registrada.

Tratá-lo como "tipo igual a spec" induz overhead (pressão para criar `plan.md`/`tasks.md` para algo que naturalmente é curto).

**Hipótese a investigar:** `spike` também é claramente uma **workflow family** própria, com lifecycle e artefatos diferentes de `spec` — provavelmente apenas `spec.md` + `findings.md` (ou só `spec.md` enriquecido com conclusão).

**Conflito conhecido:** distinção entre `spike` e `experiment` é sutil — ambos investigativos, ambos time-boxed. Hipótese provisória: `spike` é técnico-investigativo (entender uma tecnologia, validar viabilidade); `experiment` é hipótese-mensuração (testar uma teoria com métricas). Mas precisa de critério mais firme.

---

## 3. Possíveis reposicionamentos taxonômicos (hipótese, não decisão)

| Pilar atual  | Categoria provável (hipótese)                             | Confiança | Próximo passo                                                            |
| :----------- | :-------------------------------------------------------- | :-------- | :----------------------------------------------------------------------- |
| `spec`       | workflow family (delivery container)                      | Alta      | Confirmar com casos.                                                     |
| `proposal`   | decision object (pré-decisão)                             | Alta      | Esclarecer fronteira com `spec.status=Proposed`.                         |
| `spike`      | workflow family (time-boxed learning)                     | Alta      | Definir artefatos mínimos (`findings.md`?).                              |
| `experiment` | workflow family (hypothesis-driven com lifecycle próprio) | Alta      | Decidir se cria `hypothesis-boilerplate.md` + `findings-boilerplate.md`. |
| `fix`        | workflow family (delivery mode pequeno)                   | Média     | Esclarecer fronteira com `patch`.                                        |
| `patch`      | workflow family? subset de `fix`? duplicação?             | **Baixa** | Auditar uso real no `historico.md` e no backlog.                         |
| `incident`   | operational state (não workflow family)                   | Alta      | Decidir custo de migrar schema do registry.                              |

**Aviso central:** isto é **rascunho de investigação**. Cada linha tem confiança variável. A decisão final está no `decision-brief.md` futuro da 0023, com mais evidência empírica coletada.

---

## 4. Conflitos transversais a resolver

- **Schema do registry**: se `incident` virar operational state, o `registry.yml` muda (campo `kind` perde "incident"). Isso quebra drift guards existentes (`Pillars.test.ts`). Custo de migração precisa ser ponderado.
- **Continuidade narrativa**: o vocabulário "7 pilares" está enraizado em ADR 0001 + `governance-foundation.md` + `ARCHITECTURE.md` §3. Reposicionar pilares exige atualização cruzada desses artefatos sem ferir o princípio de imutabilidade das specs já fechadas.
- **Boilerplates novos vs alterações pontuais**: se `experiment` e `spike` ganharem artefatos próprios (`hypothesis.md`, `findings.md`), são boilerplates **novos** — permitido pelo escopo da 0023. Mas se `spec-boilerplate.md` precisar mudar para acomodar workflows leves (patches que dispensam decision-brief), isso é alteração pontual ao boilerplate existente — também permitido pelo escopo.
- **Audiência externa**: vocabulário exposto a consumidores futuros do framework (`fix` vs `patch`) tem implicação cultural. Renomear pode atritar com expectativas externas.

---

## 5. Casos concretos do repo que iluminam a investigação

A coletar ao longo da execução da 0023 (esta lista é stub):

- **Sub-blocos da 0021 que poderiam ser specs separadas**: 3.A (Living Documentation schema), 3.B (AST extractor), 3.C (drift guard), 3.D (TemplateEngine). Cada um se comportou quase como spec própria dentro do PR3. Isso é evidência de spec-como-container-universal? Ou de Harness Lock funcional?
- **PRs pequenos recentes** (`fix:`, `chore:`): mapear se nasceram com `spec.md` ou direto como branch curta sem spec. Se direto, é evidência de que workflows leves já funcionam fora do template — só precisamos formalizar.
- **A Spec 0022 como caso central**: planning prematuro documentado em duas tentativas (PR #15 fechado + PR #16 com artefatos arquivados). É o caso concreto mais rico — qualquer rationale de reposicionamento dos pilares pode citá-la.

> **Nota editorial:** este anexo é **vivo durante Stage A**. Cresce conforme novos casos são identificados. Não tentar fechar antes do gate.
