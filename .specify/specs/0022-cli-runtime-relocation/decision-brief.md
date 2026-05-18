<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0022 CLI Runtime Relocation

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Pendente**
> Última atualização: 2026-05-18 — instanciação da spec com 4 pontos abertos (3 no Bloco A + 1 no Bloco C mandatório).

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação)** para specs `evidence-driven` ou `mixed`. Esta spec é `mixed` — o Bloco A tem decisões macro que exigem gate; a execução pós-gate é determinística.

---

## Legenda canônica de status

| Status     | Significado                                                                                                        |
| :--------- | :----------------------------------------------------------------------------------------------------------------- |
| `Open`     | Ponto criado, sem opções populadas (ainda em research).                                                            |
| `Pendente` | Opções populadas com tradeoffs, aguardando o gate humano.                                                          |
| `Partial`  | Algumas sub-decisões cravadas, outras abertas. Aplica-se apenas a pontos com sub-eixos.                            |
| `Resolved` | Escolha cravada com data + owner. **Imutável** — mudanças posteriores vão para `plan.md` § "Decisões revisitadas". |

---

## Bloco A — Layout e Trade-off Fundamental

### [DEC-0022-A01] Escopo do cutover: "de-arrumação" vs "arquitetural"

**Pergunta:** Esta spec entrega o cutover **arquitetural** completo (substituir orquestradores `.mjs` por casos de uso DDD em `src/app/use-cases/`) ou apenas o cutover **de-arrumação** (mover paths, atualizar imports, sem refatorar conteúdo)?

**Contexto (research):**

- Sessão de design 2026-05-18 (rastreada em commits desta spec) entre Rosana Rezende e Claude Code identificou ambiguidade entre a hipótese da owner ("a Spec 0021 entregaria o cutover completo") e o estado real (coexistência de 41 `.mjs` em `cli/` + 53 `.ts` em `src/`, com `bin` apontando para `cli/`).
- A Spec 0021 entregou apenas uma **fração** do cutover: o `TemplateEngine` em TS (`src/app/use-cases/AssembleArtifact.ts`) substituiu o mirror estático em recipes específicas (sub-bloco 4.C.0). O resto continua mjs.
- Estimativa empírica (Claude Code, baseada em contagem de use cases mjs sem equivalente DDD pronto): cutover arquitetural completo demanda **1-2 semanas** com TDD; cutover de-arrumação demanda **1-2 dias**.
- A Spec 0021 PR #14 já tem 21+ commits, +2103/-493, 86 arquivos. A própria 0021 migrou para `roadmap/backlog.md` o insight "Harness Lock como contrato executável" que sugere quebrar PR quando >2000 LOC ou 2+ critérios de complexidade — empilhar arquitetura completa contraria essa regra que ela mesma criou.

**Opções:**

| Opção | Descrição                                                                                                             | Pró                                                                                                                                | Contra                                                                                                                                              |
| :---- | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Cutover de-arrumação**: move `cli/` para `src/cli/` (ou similar) sem refatorar; 1-2 dias.                           | Cabe na restrição operacional declarada pela owner; entrega valor visível (layout único); deixa porta aberta para refator gradual. | Não resolve a duplicação arquitetural — código mjs continua sendo o runtime, `src/` DDD continua não-plugado em comandos como `init`/`adopt`.       |
| B     | **Cutover arquitetural completo**: refatora cada `.mjs` para use case DDD em TS, troca composition root; 1-2 semanas. | Resolve o problema de fundo; deixa o repo num estado coerente sem fragmentação.                                                    | Não cabe em 1-2 dias; vira mega-PR irrevisável; contradiz a regra Harness Lock que esta arquitetura ela mesma criou; histórico fica difícil de ler. |
| C     | **Híbrido**: relocate + refator parcial (alguns use cases sim, outros não).                                           | Pode entregar mais que (A) sem o tamanho de (B).                                                                                   | Difícil de delimitar; risco alto de virar (B) na prática; deixa estado intermediário esquisito (alguns refatorados, outros não).                    |

**Recomendação inicial (a confirmar pós-gate):** Opção A — cutover de-arrumação. Justificativa: cabe na restrição operacional (1-2 dias) declarada pela owner; entrega o resultado visual buscado (layout único); preserva a regra Harness Lock que a 0021 estabeleceu; deixa o cutover arquitetural para Spec 0023+ com escopo claro e TDD próprio.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A02] Destino exato dentro de `src/`

**Pergunta:** Para onde exatamente vai o conteúdo de `cli/`? Subdiretório de `src/`, ou paths distribuídos por camada DDD?

**Contexto (research):**

- `src/` segue layout DDD: `src/domain/`, `src/app/`, `src/infrastructure/`, `src/cli/`, `src/test-utils/`. Já existe `src/cli/` (criado no sub-bloco 3.C da Spec 0021 com `src/cli/livingDocs.ts`).
- `cli/` mistura papéis: orquestradores (`cli/app/engine.mjs`, `cli/app/install.mjs`, `cli/app/guidance.mjs`), features (`cli/features/core/`, `cli/features/opt-in/`), infraestrutura (`cli/fs/`, `cli/governance/monolith/`), parsing (`cli/cli/args.mjs`), entrypoint (`cli/ai-guidelines-cli.mjs`).
- O alias do `package.json:imports` está organizado por papel (`#app/*`, `#features/*`, `#governance/*`, `#fs/*`, `#cli/*`) — não por camada DDD.

**Opções:**

| Opção | Descrição                                                                                                                       | Pró                                                                                        | Contra                                                                                                                                                                     |
| :---- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `cli/` inteiro vira `src/cli/` (preserva estrutura interna; `src/cli/livingDocs.ts` ganha vizinhos).                            | Move mínimo, rastreável; cada arquivo migra com 1 rename; menos pontos de erro em imports. | `src/cli/` fica grande e mistura camadas (app/features/infrastructure/cli) — mas a 0023 vai refatorar isso então é provisório.                                             |
| B     | Distribui por camada DDD: orquestradores em `src/app/legacy/`, features em `src/cli/features/`, infra em `src/infrastructure/`. | Já começa a arrumar por camada; melhor "lar" semântico desde o início.                     | Mais decisões de path por arquivo; risco maior de erro em imports; o trabalho de classificar arquivos por camada antecipa parte da 0023 sem o TDD próprio — escopo cresce. |
| C     | Move tudo para `src/cli/legacy/` como "quarentena" com plano explícito de refatorar.                                            | Sinaliza intenção (legacy = será refatorado); preserva separação visual mjs vs ts.         | Cria sub-diretório que só existe para sinalizar débito; pode envelhecer mal se a 0023 demorar a sair.                                                                      |

**Recomendação inicial (a confirmar pós-gate):** Opção A — `cli/` inteiro para `src/cli/`. Justificativa: respeita a premissa "as-is" da Opção A do `[DEC-0022-A01]`; tarefa puramente mecânica (mover diretório); evita decisões de path por arquivo; o "lar semântico" certo aparece naturalmente no cutover arquitetural (Spec 0023+), não nesta spec.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A03] Escopo de rebranding textual associado

**Pergunta:** A Spec 0022 inclui também o rebranding textual ("a CLI" → "o `ai-guidelines`") em docs canônicas, ou esse trabalho fica em spec separada?

**Contexto (research):**

- Sessão 2026-05-18 levantou dois problemas distintos: **(1)** duas pastas de código (resolvido por esta spec) e **(2)** o produto ser nomeado como genérico "CLI" em vez do nome próprio publicado `ai-guidelines`.
- Estado textual atual: `README.md` já usa `npx ai-guidelines` corretamente (linha 70); mas `AGENTS.md` linha 12 diz "a CLI em `cli/`", linha 27 diz `yarn guidelines ...`; o `printHelp` do entrypoint mostra `yarn guidelines <init|adopt|...>` (alias dev); os scripts em `package.json` se chamam `guidelines:init/adopt/providers`; `docs/cli/ai-guidelines-cli.md` ecoa "cli" no path; comentários de código falam "a CLI" genericamente.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                                                       | Pró                                                                                           | Contra                                                                                                                                                                             |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | Spec 0022 inclui rebranding textual completo (todos os "a CLI" / "yarn guidelines" / `printHelp` / scripts).                                                                                                                                    | Resolve dois problemas relacionados em um PR.                                                 | Aumenta escopo da 0022; mistura "move de código" com "polish textual"; revisão fica mais difícil; pode ultrapassar 1-2 dias de execução.                                           |
| B     | Spec 0022 inclui apenas rebranding **mínimo necessário** (paths e refs textuais que ficam quebradas após o move, ex.: "a CLI em `cli/`" vira "a CLI em `src/cli/`"). Rebranding amplo vira spec própria (slug provisório `cli-naming-cleanup`). | Mantém a 0022 cirúrgica; deixa o rebranding como decisão narrativa explícita em outra rodada. | Cria pequena dependência: a próxima spec de rebranding depende do merge desta.                                                                                                     |
| C     | Spec 0022 zero rebranding; ela faz só move + atualiza imports. Rebranding inteiro vira spec separada (incluindo paths textuais quebrados).                                                                                                      | Máxima separação de concerns.                                                                 | Estado intermediário esquisito: docs continuam falando "a CLI em `cli/`" enquanto `cli/` raiz não existe mais — leitor fica desorientado entre o merge da 0022 e a próxima rodada. |

**Recomendação inicial (a confirmar pós-gate):** Opção B — rebranding mínimo necessário (refs textuais a paths `cli/...` que ficam mortas após o move; nada além disso). Justificativa: evita estado intermediário esquisito da (C) sem aumentar muito o escopo como (A) faria. Rebranding textual completo vira spec própria com escopo curto (provavelmente algumas horas).

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

## Bloco C — Saúde Técnica e Dívidas Associadas

> **Bloco Mandatório.** Análise da saúde da base de código que implementará a spec.

### [DEC-0022-C01] Saúde arquitetural e dívidas técnicas

**Pergunta:** Qual é o estado de saúde do componente que implementará esta spec, e quais dívidas técnicas existentes podem impactar o escopo?

**Contexto (research):**

- Componente principal afetado: pasta `cli/` inteira (orquestrador `cli/ai-guidelines-cli.mjs`, app `cli/app/`, features `cli/features/`, infraestrutura `cli/fs/`, `cli/governance/`, parsing `cli/cli/args.mjs`).
- Cobertura de testes do `cli/` é alta: a maioria dos arquivos tem `.test.mjs` adjacente (verificável via `find cli -name '*.test.mjs'`); smoke suite cobre via tarball real cross-OS.
- A coexistência `cli/` + `src/` não causa bugs hoje — causa **confusão cognitiva**. Não há "dívida bloqueadora" no sentido técnico; há débito de **layout**.

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

**Recomendação inicial (a confirmar pós-gate):**

- **Sub-eixo 1 — B (Requer Refatoração):** `cli/` está saudável em comportamento mas mistura camadas (app + features + infra + parsing num único path). A refatoração estrutural por camada é justamente o que a Spec 0023+ vai fazer; esta spec só consolida o lar, sem refatorar.
- **Sub-eixo 2 — B (Dívidas Contidas):** A coexistência `cli/` + `src/` é a dívida central da informação arquitetural, e esta spec é o pagamento de uma fração dela (a fração visual/layout). Dívidas residuais ficam contidas em `src/cli/` (alvo da 0023+) e não bloqueiam o escopo desta.
- **Sub-eixo 3 — C (Suíte Formal):** 296 testes unit/integration (Spec 0021 PR #14 baseline) + smoke suite cross-OS cobrindo `init`/`adopt`/`update`/bin-shim via tarball real. Refator de path é seguro.

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
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0022-A01]` | A     | Pendente |
| `[DEC-0022-A02]` | A     | Pendente |
| `[DEC-0022-A03]` | A     | Pendente |
| `[DEC-0022-C01]` | C     | Pendente |

**Status agregado:** Pendente

---

## ✅ Gate fechado

> Bloco final assinado pelo owner quando **todos** os pontos estão `Resolved`. Não preencher antes disso.

- **Data:** [YYYY-MM-DD]
- **Owner:** [@owner]
- **Pontos resolvidos:**
  - [ ] `[DEC-0022-A01]`
  - [ ] `[DEC-0022-A02]`
  - [ ] `[DEC-0022-A03]`
  - [ ] `[DEC-0022-C01]`

---

## Checklist pós-gate

- [ ] **(1)** `plan.md` v2 publicado: cada subseção de design técnico deriva linearmente de um `[DEC-0022-XYZ]` e referencia o ponto explicitamente.
- [ ] **(2)** `tasks.md` v2 publicado: placeholder de Stage 2 substituído por tasks operacionais derivadas do `plan.md` v2; cada sub-bloco cita o `[DEC-0022-XYZ]` que o alimenta.
- [ ] **(3)** Status agregado desta brief mudado para `Resolved` no header e na tabela "Resumo de status".
- [ ] **(4)** Commit atômico marcando o gate: `docs(spec-0022): gate humano fechado — plan v2 + tasks v2 publicados`.
