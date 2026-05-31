<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Pendente** <!-- Pendente | Partial | Resolved -->
> Última atualização: [YYYY-MM-DD] — [nota curta sobre o que mudou nesta atualização]

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação)** para specs `evidence-driven` ou `mixed` (cf. `.core/process/governance-foundation.md` § "Tipos de spec"). Specs `deterministic` não instanciam este arquivo.
>
> **O que faz:** apresenta opções com tradeoffs antes do gate humano e registra decisões validadas após o gate. Não substitui ADRs (decisões arquiteturais cross-spec) — é spec-level. **Permanece no diretório da spec após o merge** como artefato histórico (não migra para `researchs/`).

---

## Contrato research · decision-brief · gate

> **[MANDATÓRIO]** Fonte canônica: `governance-foundation.md` § "Contrato da cadeia". Este boilerplate **reflete** o contrato; em caso de divergência, a constituição vence. Regra-mãe: **cada fase é proibida de produzir a saída da fase seguinte** — a research **não decide**; o brief **não julga**; o julgamento só nasce no gate.
>
> Nasceu de uma falha real (Spec 0024, 2026-05-29): uma DEC foundational chegou ao gate com as alternativas já refutadas pela própria research — o humano ratificaria, não decidiria.

1. **Entrada do brief = opções vivas, não uma decisão.** Se a research chegou com alternativas já refutadas (`A/B impossíveis · C sobreviveu`), ela produziu uma _decisão_ (proibido) e o contrato foi violado **a montante** (fronteira `research → decision-brief`): pare e reabra as opções sobreviventes com **simetria informacional** (mesmo conjunto mínimo de perguntas) antes do gate.
2. **Comparabilidade, não advocacy — o brief torna o espaço de decisão visível, não convence.** Sem alternativas reais avaliadas, não é decisão — é dogma (governance-foundation, anti-padrão #5). Cada DEC apresenta as opções sobreviventes com **simetria informacional**: todas respondem ao **mesmo conjunto mínimo de perguntas** (_problema que resolve · benefícios · tradeoffs · riscos · quando escolher · **quando NÃO escolher**_, inclusive a recomendada). Assimetria (uma opção rica, outra pobre) **já é a decisão tomada** — proibida.
3. **A recomendação inicial não colapsa a decisão.** É _bounded_, marcada "a confirmar pós-gate", e **deve nomear o que tornaria uma alternativa certa** (sob qual evidência/objetivo a owner escolheria outra coisa). Recomendação ≠ veredito. **Em modo `aceitação`, a recomendação bounded colapsa no próprio finding** — não se adiciona linha "Recomendação inicial" (seria advocacy-para-aceitação); use a **Forma D**.
4. **A seta de autoria é `humano → sistema` (ADR 0018).** O julgamento é AUTORADO pelo humano no gate. Sinal de inversão (research autora → humano ratifica): **pare e reabra a decisão.**
5. **Declare o `Modo de gate`:** `escolha` (tradeoffs reais → humano arbitra) | `aceitação` (research convergiu num finding → humano aceita / rejeita / reenquadra). Nomear o modo evita "aceitação disfarçada de escolha".
6. **Descoberta fora da alçada → escala, não absorve.** Se mid-spec emergir algo que exige julgamento (ex.: decisão `Resolved` que se mostra inviável), abrir **amendment / nova `[DEC]`** (mesma forma, datada) — nunca reabrir ou decidir por conta. Rota canônica em `governance-foundation.md` § "Mecanismos de escalonamento".

---

## Legenda canônica de status

> **Reforma 2026-05-31 (DOGFOOD-0024 / GG-0001):** `Open` foi **abolido** — pergunta aberta **não é decisão**. Um `[DEC]` **nasce `Pendente`** (já decidível); enquanto não converge + exige julgamento, a pergunta vive em `research/findings.md`, **não** como DEC.

| Status     | Significado                                                                                                        |
| :--------- | :----------------------------------------------------------------------------------------------------------------- |
| `Pendente` | DEC decidível, aguardando o gate humano (ver checklist GG-0001 abaixo).                                            |
| `Partial`  | Algumas sub-decisões cravadas, outras abertas. Aplica-se apenas a pontos com sub-eixos.                            |
| `Resolved` | Escolha cravada com data + owner. **Imutável** — mudanças posteriores vão para `plan.md` § "Decisões revisitadas". |

**Status agregado da brief** (campo no header):

- `Pendente` enquanto nenhum ponto saiu de `Pendente`.
- `Partial` quando ≥ 1 ponto está `Resolved` mas há outros não-resolvidos.
- `Resolved` quando **todos** os pontos estão `Resolved` — gatilho do checklist pós-gate.

---

## Checklist de decidibilidade do gate (GG-0001)

> **[MANDATÓRIO antes do gate]** Guardrail dogfoodado (`DOGFOOD-0024`; regra [`.core/rules/base/governance/gate-decidability.md`](../../.core/rules/base/governance/gate-decidability.md)). Antes de discutir o **mérito** de um `[DEC]` não-resolvido, confirme que ele é **decidível**. O subconjunto mecânico é enforced por `yarn gate-decidability:check` (agregado em `yarn validate`): itens 🤖 **falham o check**; itens 👁 são julgamento humano projetado aqui.

- [ ] 👁 **Afirmação única** — o DEC pede para aceitar **uma** coisa (não um feixe de asserções).
- [ ] 🤖 **"O que está sendo aceito"** — presente e _bounded_.
- [ ] 🤖 **"O que NÃO está sendo aceito"** — presente.
- [ ] 🤖 **Concorrentes considerados** — por que cada alternativa falha + o que reabriria.
- [ ] 👁 **Arquitetura separada de implementação** — a decisão não embute migração/execução.
- [ ] 🤖 **Um único ato de gate** — sem "aceitar X **+** autorizar a migração" (dois atos colados).
- [ ] 🤖 **Sem status `Open`** — o DEC nasce `Pendente`.

Se algum item falha, o gate **não está pronto**: corrija a **forma** da decisão antes do **mérito**.

---

## Convenção de IDs

- **Formato:** `[DEC-NNNN-XYZ]` — `NNNN` = número da spec; `X` = letra do bloco do `plan.md` (A, B, …); `YZ` = sequência ordinal de 2 dígitos (`01`, `02`, …).
- **Sub-eixos** dentro de um ponto não recebem ID próprio por default — o ponto-pai é o citável. Use `[DEC-NNNN-XYZ.W]` apenas se a prática mostrar que sub-eixos precisam ser citados isoladamente cross-artefato (raro).
- **Pontos derivados** durante Stage 1 (research expôs pergunta nova): abrir novo ponto com **nota de origem** (qual research/discussão motivou a abertura) e **manter sequência ordinal sem reusar gaps** de pontos descartados.
- Após `Resolved`, **nunca editar o ponto retroativamente** — mudanças vão para `plan.md` § "Decisões revisitadas".

---

## Estrutura por ponto — duas formas aceitas

A brief aceita duas formas de estruturar um ponto, escolhidas pelo autor conforme a complexidade da decisão. Pontos da mesma brief podem coexistir em formas diferentes.

### Forma B (padrão) — para pontos com 1 dimensão de escolha

```markdown
### [DEC-NNNN-XYZ] [Título curto da decisão]

**Pergunta:** [pergunta única que o ponto responde].

**Modo de gate:** `escolha` | `aceitação` <!-- `escolha` = tradeoffs reais, humano arbitra; `aceitação` = research convergiu num finding, humano aceita/rejeita/reenquadra. Ver Contrato §5. -->

**Contexto (research):**

- [Cross-ref para o(s) research(es) que alimentam o ponto, com § específico quando aplicável.]
- [Observação editorial relevante, se houver.]

**Opções (modo `escolha`)** — cada opção sobrevivente responde ao **mesmo conjunto mínimo** (simetria informacional; Contrato §2). Assimetria = decisão já tomada.

#### Opção A — [nome]

- **Problema que resolve:** [...]
- **Benefícios:** [...]
- **Tradeoffs:** [...]
- **Riscos:** [...]
- **Quando escolher:** [...]
- **Quando NÃO escolher:** [...] <!-- obrigatório, inclusive na opção recomendada -->

#### Opção B — [nome]

[mesmo conjunto mínimo — os 6 campos acima]

<!-- Forma compacta opcional p/ decisões simples: tabela com colunas = conjunto mínimo (Problema · Benefícios · Tradeoffs · Riscos · Quando escolher · Quando NÃO escolher). NUNCA Pró/Contra — 2 dimensões omitem "quando NÃO escolher", o mecanismo anti-advocacy do contrato. -->

**Recomendação inicial (a confirmar pós-gate):** [Opção X — justificativa baseada em evidência convergente em ≥ 1 research]. **O que tornaria outra opção certa:** [sob qual evidência/objetivo a owner escolheria diferente — Contrato §3].

<!-- Opcional — incluir apenas quando há evidência convergente em ≥ 1 research que aponte para uma opção dominante. Sem evidência convergente, omitir esta linha. Recomendação ≠ veredito (Contrato §3). -->

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
- **Justificativa / Ressalvas:** >
  [Texto livre — owner registra a razão da escolha e ressalvas relevantes para Stage 2.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]
```

### Forma C (decomposta) — para pontos compostos por múltiplas dimensões

```markdown
### [DEC-NNNN-XYZ] [Título curto da decisão]

**Pergunta:** [pergunta meta que o ponto responde].

**Modo de gate:** `escolha` | `aceitação` <!-- por sub-eixo se divergirem; ver Contrato §5. -->

**Contexto (research):**

- [Cross-refs aos research(es) relevantes.]

**Princípio guia (decisão de framing):** _[opcional — registra framing prévio que orienta os sub-eixos.]_

**Eixos a decidir:**

1. **[Sub-eixo 1]** — [pergunta específica do sub-eixo]
2. **[Sub-eixo 2]** — [pergunta específica do sub-eixo]
3. **[...]**

#### Sub-eixo 1 — [nome]

[Opções no **conjunto mínimo** do Contrato §2 — Problema · Benefícios · Tradeoffs · Riscos · Quando escolher · Quando NÃO escolher — uma por opção. **Nunca Pró/Contra.**]

**Recomendação inicial (a confirmar pós-gate):** [Opção X — justificativa]. _Opcional, mesma regra da forma B._

#### Sub-eixo 2 — [nome]

[Mesma estrutura: tabela ou lista de opções + Recomendação inicial opcional.]

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — [nome] (marque com `x`):**
  - [ ] A
  - [ ] B
- **Sub-eixo 2 — [nome] (marque com `x`):**
  - [ ] A
  - [ ] B
- **Justificativa / Ressalvas:** >
  [Texto livre cobrindo a composição final das escolhas.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]
```

### Forma D (convergência) — para pontos em modo `aceitação`

Use quando a research **convergiu num finding** (uma identidade/conclusão sobreviveu à falsificação) e o gate **aceita / rejeita / reenquadra** — não escolhe entre opções vivas. Em `aceitação` **não há "Recomendação inicial"**: o finding É a convergência; recomendá-lo seria advocacy-para-aceitação (Contrato §3 + `governance-foundation.md` § "Modos de gate"). As alternativas refutadas **não vão a tabela de simetria** — mostra-se **por que falham** e **o que reabriria** (falsificabilidade).

```markdown
### [DEC-NNNN-XYZ] [Título curto da decisão]

**Pergunta:** [pergunta que o ponto responde].

**Modo de gate:** `aceitação`

**O finding (o que se pede para aceitar):**

> [formulação exata, citável, do que convergiu]

**O que está sendo aceito (bounded):** [os limites positivos do finding]

**O que NÃO está sendo aceito:** [o que fica fora / deferido — evita aceitar tacitamente mais do que o finding]

**Por que as alternativas falham + o que reabriria** (falsificabilidade — NÃO Pró/Contra):

- **[Alternativa A]:** refutada porque [...]. _Reabre se:_ [...].
- **[Alternativa B]:** refutada porque [...]. _Reabre se:_ [...].
- **[finding] falsificável por:** [...].

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Ato (marque um):**
  - [ ] **Aceitar** — [o finding]
  - [ ] **Rejeitar** — registrar o que falhou (reabre research)
  - [ ] **Reenquadrar** — aceitar com ajuste (registrar o ajuste)
- **Justificativa / Ressalvas:** >
  [owner registra a razão + ressalvas relevantes para Stage 2.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]
```

**Diretriz para escolher a forma:** **B** = uma dimensão de escolha (modo `escolha`); **C** = múltiplas decisões **independentes** (modo `escolha`; status pode ficar `Partial`); **D** = a research **convergiu** e o gate é de `aceitação` (não há opções vivas a arbitrar — há um finding a aceitar/rejeitar/reenquadrar).

---

## Blocos da brief

> Os pontos `[DEC-NNNN-*]` são organizados em **blocos** que espelham os blocos de implementação do `plan.md`. Especs single-bloco usam apenas Bloco A.

## Bloco A — [nome do bloco no plan]

[Pontos `[DEC-NNNN-AYY]` em forma B ou C, conforme complexidade.]

### [DEC-NNNN-A01] [Título curto]

[Conteúdo do ponto na forma B ou C — ver templates acima.]

### [DEC-NNNN-A02] [Título curto]

[...]

## Bloco B — [nome do bloco no plan]

[Pontos `[DEC-NNNN-BYY]` em forma B ou C.]

### [DEC-NNNN-B01] [Título curto]

[...]

## Bloco C — Saúde Técnica e Dívidas Associadas

> **Bloco Mandatório.** O objetivo é forçar a análise sobre a saúde da base de código que implementará a spec, prevenindo que dívidas técnicas não-mapeadas comprometam a entrega.

### [DEC-NNNN-C01] Saúde arquitetural e dívidas técnicas

**Pergunta:** Qual é o estado de saúde do componente que implementará esta spec, e quais dívidas técnicas existentes podem impactar o escopo?

**Contexto (research):**

- A análise de saúde técnica é um pré-requisito para um planejamento de implementação realista.
- Identificar dívidas técnicas relevantes no Stage 1 permite que o escopo da spec seja ajustado (se necessário) para pagá-las, em vez de acumular mais complexidade sobre uma base frágil.

**Eixos a decidir:**

1. **Saúde Arquitetural:** Qual é o diagnóstico do componente principal afetado?
2. **Dívidas Técnicas:** Existem dívidas pré-existentes que a spec irá exacerbar?
3. **Estratégia de Validação e Qualidade:** A estratégia de validação do projeto é suficiente para uma refatoração segura?

#### Sub-eixo 1 — Saúde Arquitetural

| Opção | Descrição                                                                                                                                                                                                   |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Saudável:** A arquitetura do componente é clara, coesa e pronta para absorver as novas funcionalidades sem atritos significativos.                                                                        |
| B     | **Requer Refatoração:** O componente funciona, mas sua estrutura interna é confusa, acoplada ou carece de padrões claros. A implementação exigirá uma refatoração tática.                                   |
| C     | **Requer Re-arquitetura:** A fundação do componente é fundamentalmente falha ou inadequada para os novos requisitos. A implementação segura exige um redesenho completo antes da entrega de novas features. |

#### Sub-eixo 2 — Dívidas Técnicas

| Opção | Descrição                                                                                                                                                                                          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Nenhuma Dívida Relevante:** Nenhuma dívida técnica existente impacta diretamente o escopo desta spec.                                                                                            |
| B     | **Dívidas Contidas:** Existem dívidas, mas elas podem ser isoladas ou contornadas. O plano de implementação deve registrá-las.                                                                     |
| C     | **Dívidas Bloqueadoras:** Dívidas existentes (ex: dependências obsoletas, falta de testes) tornam a implementação insegura ou impraticável. O escopo da spec **deve ser expandido** para pagá-las. |

#### Sub-eixo 3 — Estratégia de Validação e Qualidade

| Opção | Descrição                                                                                                                                                                              |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Validação Ad-hoc:** A qualidade é garantida principalmente por validação manual e testes não estruturados. Mudanças exigem um ciclo de QA manual extensivo.                          |
| B     | **Checagens Automatizadas:** O projeto utiliza ferramentas como linters, checagem de tipos e/ou análise estática, mas não possui uma suíte de testes de comportamento.                 |
| C     | **Suíte de Testes Formal:** Uma suíte de testes automatizados (unitários, integração, etc.) é parte central do fluxo de trabalho, permitindo refatorações com maior grau de segurança. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Saúde Arquitetural (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Sub-eixo 2 — Dívidas Técnicas (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Sub-eixo 3 — Estratégia de Validação e Qualidade (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Texto livre cobrindo a composição final das escolhas e o impacto no plano de implementação.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

---

## Resumo de status

> Tabela manual mantida pelo autor. Atualizar a cada mudança de status. **Drift entre headers individuais e esta tabela bloqueia o gate** — a coerência é responsabilidade humana (não há script de geração nesta versão).

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-NNNN-A01]` | A     | Pendente |
| `[DEC-NNNN-A02]` | A     | Pendente |
| `[DEC-NNNN-B01]` | B     | Pendente |
| `[DEC-NNNN-C01]` | C     | Pendente |

**Status agregado:** [Pendente | Partial | Resolved] — atualizar conforme o estado consolidado da tabela acima e refletir no campo do header.

---

## ✅ Gate fechado

> Bloco final assinado pelo owner quando **todos** os pontos estão `Resolved`. **Não preencher** antes disso. Após a assinatura, executar imediatamente o **Checklist pós-gate** abaixo (atômico — mesmo commit).

- **Data:** [YYYY-MM-DD]
- **Owner:** [@owner]
- **Pontos resolvidos:**
  - [ ] `[DEC-NNNN-A01]`
  - [ ] `[DEC-NNNN-A02]`
  - [ ] `[DEC-NNNN-B01]`
  - [ ] `[DEC-NNNN-C01]`

---

## Checklist pós-gate

> **[MANDATÓRIO]** Após assinatura do gate, executar os 4 passos abaixo de forma atômica. Stage 2 (Fase 1+ do `tasks.md`) **não inicia** sem este checklist completo.

- [ ] **(1)** `plan.md` v2 publicado: cada subseção de design técnico deriva linearmente de um `[DEC-NNNN-XYZ]` e referencia o ponto explicitamente. Rotas não derivadas da brief são rejeitadas como acreção pré-research.
- [ ] **(2)** `tasks.md` v2 publicado: placeholder de Stage 2 substituído por tasks operacionais derivadas do `plan.md` v2; cada sub-bloco cita o `[DEC-NNNN-XYZ]` que o alimenta.
- [ ] **(3)** Status agregado desta brief mudado para `Resolved` no header e na tabela "Resumo de status".
- [ ] **(4)** Commit atômico marcando o gate (mensagem-padrão sugerida: `docs(spec-NNNN): gate humano fechado — plan v2 + tasks v2 publicados`).
