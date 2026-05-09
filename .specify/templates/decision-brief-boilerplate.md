<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Open** <!-- Open | Pendente | Partial | Resolved -->
> Última atualização: [YYYY-MM-DD] — [nota curta sobre o que mudou nesta atualização]

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação)** para specs `evidence-driven` ou `mixed` (cf. `.core/process/spec-foundation.md` § "Tipos de spec"). Specs `deterministic` não instanciam este arquivo.
>
> **O que faz:** apresenta opções com tradeoffs antes do gate humano e registra decisões validadas após o gate. Não substitui ADRs (decisões arquiteturais cross-spec) — é spec-level. **Permanece no diretório da spec após o merge** como artefato histórico (não migra para `researchs/`).

---

## Legenda canônica de status

| Status     | Significado                                                                                                        |
| :--------- | :----------------------------------------------------------------------------------------------------------------- |
| `Open`     | Ponto criado, sem opções populadas (ainda em research).                                                            |
| `Pendente` | Opções populadas com tradeoffs, aguardando o gate humano.                                                          |
| `Partial`  | Algumas sub-decisões cravadas, outras abertas. Aplica-se apenas a pontos com sub-eixos.                            |
| `Resolved` | Escolha cravada com data + owner. **Imutável** — mudanças posteriores vão para `plan.md` § "Decisões revisitadas". |

**Status agregado da brief** (campo no header):

- `Open` enquanto nenhum ponto saiu de `Open`/`Pendente`.
- `Partial` quando ≥ 1 ponto está `Resolved` mas há outros não-resolvidos.
- `Resolved` quando **todos** os pontos estão `Resolved` — gatilho do checklist pós-gate.

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

**Contexto (research):**

- [Cross-ref para o(s) research(es) que alimentam o ponto, com § específico quando aplicável.]
- [Observação editorial relevante, se houver.]

**Opções:**

| Opção | Descrição | Pró   | Contra |
| :---- | :-------- | :---- | :----- |
| A     | [...]     | [...] | [...]  |
| B     | [...]     | [...] | [...]  |

<!-- Alternativa em vez da tabela: lista bulleted (autor escolhe — D9.C). Use tabela para ≥ 3 opções; lista quando há 2 opções (tabela superdimensiona). -->

**Recomendação inicial (a confirmar pós-gate):** [Opção X — justificativa baseada em evidência convergente em ≥ 1 research].

<!-- Opcional — incluir apenas quando há evidência convergente em ≥ 1 research que aponte para uma opção dominante. Sem evidência convergente, omitir esta linha. -->

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

**Contexto (research):**

- [Cross-refs aos research(es) relevantes.]

**Princípio guia (decisão de framing):** _[opcional — registra framing prévio que orienta os sub-eixos.]_

**Eixos a decidir:**

1. **[Sub-eixo 1]** — [pergunta específica do sub-eixo]
2. **[Sub-eixo 2]** — [pergunta específica do sub-eixo]
3. **[...]**

#### Sub-eixo 1 — [nome]

| Opção | Descrição | Pró   | Contra |
| :---- | :-------- | :---- | :----- |
| A     | [...]     | [...] | [...]  |
| B     | [...]     | [...] | [...]  |

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

**Diretriz para escolher entre B e C:** use **B** quando o ponto tem uma única dimensão de escolha; use **C** quando o ponto se decompõe em decisões **independentes** que podem ser resolvidas em momentos diferentes (status do ponto pode ficar `Partial` enquanto algumas sub-decisões aguardam mais research).

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

| ID               | Bloco | Status |
| :--------------- | :---- | :----- |
| `[DEC-NNNN-A01]` | A     | Open   |
| `[DEC-NNNN-A02]` | A     | Open   |
| `[DEC-NNNN-B01]` | B     | Open   |
| `[DEC-NNNN-C01]` | C     | Open   |

**Status agregado:** [Open | Pendente | Partial | Resolved] — atualizar conforme o estado consolidado da tabela acima e refletir no campo do header.

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
