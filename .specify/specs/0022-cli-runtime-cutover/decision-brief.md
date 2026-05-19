<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0022 CLI Runtime Cutover (DDD + TDD + BDD)

> Spec: [`./spec.md`](./spec.md) — _ver aviso editorial naquele arquivo_
> Plan: ~~[`./plan.md`](./plan.md)~~ → [`./plan.archived.md`](./plan.archived.md) _(arquivado por invalidação metodológica)_
> Tasks: ~~[`./tasks.md`](./tasks.md)~~ → [`./tasks.archived.md`](./tasks.archived.md) _(arquivado por invalidação metodológica)_
> Status agregado: **Suspenso — historical pre-discovery framing artifact**
> Última atualização: 2026-05-18 — reclassificado durante sessão de recalibração metodológica.

> ⚠️ **Aviso editorial — historical pre-discovery framing artifact (sessão 2026-05-18)**
>
> Este `decision-brief.md` foi escrito **antes do discovery arquitetural correto**. As 6 perguntas que ele contém (`[DEC-0022-A01]` a `[DEC-0022-C01]`) **embutem framing CLI-first/runtime-assumption/command-centricity** — todas pressupõem implicitamente que a arquitetura-alvo é "portar a CLI atual para TypeScript DDD" preservando os comandos como bounded contexts.
>
> A sessão 2026-05-18 revelou que essa premissa pode estar errada. CLI pode ser apenas fonte histórica de comportamento, não a arquitetura correta. As perguntas reais sobre "o que é runtime governance-first?", "quais são os bounded contexts reais do sistema?", "specs continuam centrais ou viraram uma capability entre várias?" **não cabem nesta brief** porque ela já assumiu respostas implícitas.
>
> **Por que está preservado:**
>
> - Como **evidência da evolução do pensamento** — mostra o estado intermediário do framing antes da recalibração metodológica.
> - Como **registro de tensões reais percebidas** — várias das tensões aqui descritas (Harness Lock, ordem de cutover, bridge durante transição) são genuínas, mesmo que as opções A/B/C oferecidas embutam premissas a serem revistas.
> - Como **insumo para a Spec 0023** — quando o lifecycle novo for definido, este documento serve como caso concreto de "decision-brief que nasceu cedo demais".
>
> **Por que NÃO deve ser usado como input válido para execução:**
>
> - As perguntas têm framing enviesado; respondê-las com Resolved cravaria as premissas implícitas como decisão.
> - O gate humano sobre esta brief está **suspenso**, não pendente — não deve ser assinado.
> - O lifecycle novo (Spec 0023) deve **redesenhar** o que esta brief deveria ter sido. As perguntas certas só emergem após `research.md` real.
>
> **Como ler este arquivo:** como artifact histórico de aprendizagem metodológica, NÃO como gate canônico operável.

---

## Legenda canônica de status

| Status     | Significado                                                                                                        |
| :--------- | :----------------------------------------------------------------------------------------------------------------- |
| `Open`     | Ponto criado, sem opções populadas (ainda em research).                                                            |
| `Pendente` | Opções populadas com tradeoffs, aguardando o gate humano.                                                          |
| `Partial`  | Algumas sub-decisões cravadas, outras abertas. Aplica-se apenas a pontos com sub-eixos.                            |
| `Resolved` | Escolha cravada com data + owner. **Imutável** — mudanças posteriores vão para `plan.md` § "Decisões revisitadas". |

---

## Bloco A — Estrutura do Cutover

### [DEC-0022-A01] Estrutura Harness Lock — número de sub-PRs

**Pergunta:** Em quantos sub-PRs o cutover é executado? Cada sub-PR é uma unidade revisável, sem quebrar o consumidor entre PRs.

**Contexto (research):**

- Sessão 2026-05-18 confirmou que a 0022 vai durar **bem mais que 1-2 dias** (estimativa ~1 semana, possivelmente 2-3) e foi escolhida a estrutura Harness Lock multi-PR.
- A regra Harness Lock que o próprio repo descreve (insight migrado da 0021 para `roadmap/backlog.md`): "3 PRs (mínimo): Domain/Contracts, Topology/Migration, Consolidation/Docs/Smoke" ou "5 PRs (modelo tipo 0021): Domain Memory Foundation, Topology Migration Layer, Executable Intelligence Runtime, Governance Consolidation, Final Homologation".
- Comandos a migrar: `init`, `adopt`, `update`, `providers`, `check-budget`. Mais features residuais (`cli/features/core/`, `cli/governance/monolith/`, `cli/fs/`).
- `AdoptWorkspace.ts` em `src/app/use-cases/` já existe (entregue pela 0021), apenas não está plugado no comando `adopt` real.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                                             | Pró                                                                 | Contra                                                                                      |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| A     | **3 sub-PRs (mínimo Harness Lock)**: PR1 setup + wiring + `adopt`; PR2 `init` + `update` + `providers` + `check-budget`; PR3 cleanup + remoção de `cli/`.                                                                             | Estrutura clássica do framework; menos overhead de revisão.         | PR2 fica grande (4 comandos novos em TDD); difícil revisar com profundidade.                |
| B     | **5 sub-PRs (granular)**: PR1 setup + auditoria + `adopt` (use case pronto); PR2 `init` (mais complexo, wizard); PR3 `update` + `providers` (idempotentes); PR4 `check-budget` + features residuais; PR5 cleanup + remoção de `cli/`. | Cada PR foca em 1-2 comandos; revisão profunda; risco baixo por PR. | Mais cerimônia (5 reviews); coordenação entre PRs.                                          |
| C     | **6+ sub-PRs (ultra granular)**: cada comando vira seu próprio PR + PRs separados para features residuais + cleanup.                                                                                                                  | Máxima granularidade; cada PR é trivial de revisar.                 | Cerimônia excessiva; risco de fadiga de revisão; cutover demora mais por causa de overhead. |

**Recomendação inicial (a confirmar pós-gate):** Opção B — 5 sub-PRs. Justificativa: balanceia revisão profunda com custo de cerimônia; permite que cada PR tenha foco claro (1-2 comandos) e seja revisável sem fadiga; alinha com o modelo "5 PRs tipo 0021" que o próprio framework descreve para specs que tocam runtime + contrato + topologia simultaneamente.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A (3 PRs)
  - [ ] B (5 PRs)
  - [ ] C (6+ PRs)
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A02] Ordem de cutover dos comandos

**Pergunta:** Em que ordem os comandos publicados são migrados? A ordem impacta complexidade do bridge e tempo até o primeiro PR mergeado.

**Contexto (research):**

- `adopt` tem use case DDD pronto em `src/app/use-cases/AdoptWorkspace.ts` (entregue pela 0021); falta só plugar.
- `init` é o mais complexo (wizard interativo, gera múltiplos arquivos: AGENTS.md, CLAUDE.md, GEMINI.md, .aiexclude, .openai/, .gptignore, .claudeignore, .gitattributes, .github/workflows/, .specify/templates/). Wraps `adopt` internamente.
- `update` re-aplica baseline pós-upgrade (idempotente, headless).
- `providers` adiciona/atualiza arquivos de adapters de IA (subset do `init`).
- `check-budget` é um relatório (read-only, sem efeitos colaterais).

**Opções:**

| Opção | Descrição                                                                                                                                               | Pró                                                                                                 | Contra                                                                                        |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| A     | **Mais fácil → mais difícil**: `adopt` (pronto), depois `check-budget` (read-only), depois `providers`, depois `update`, depois `init` (mais complexo). | Primeira merge rápida (validação do approach); aprendizado incremental; bridge cresce gradualmente. | `init` (o comando mais usado) fica por último; consumidor demora a sentir benefício.          |
| B     | **Pelo entrypoint primário**: `init` (mais usado), depois `adopt`, depois resto.                                                                        | Consumidor sente diferença cedo.                                                                    | `init` é o mais complexo — começar por ele atrasa primeira merge; bridge pode ficar instável. |
| C     | **Dependência interna**: respeitar grafo de chamadas. `adopt` é base (init usa); migrar adopt → init → update → providers → check-budget.               | Respeita dependências naturais; bridge é mais limpo.                                                | `check-budget` (mais fácil) fica por último.                                                  |

**Recomendação inicial (a confirmar pós-gate):** Opção C — ordem por dependência interna. Justificativa: respeita o grafo de chamadas (init chama adopt); reduz complexidade do bridge entre `cli/` e `src/cli/` durante a transição; cada PR tem dependências claras dos anteriores. Adicionalmente, opcionalmente intercalar `check-budget` cedo (PR4 da opção B em A01) por ser read-only — útil como "exercício rápido" do approach.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A (fácil → difícil)
  - [ ] B (init primeiro)
  - [ ] C (por dependência)
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A03] Estratégia de bridge durante o cutover

**Pergunta:** Como `cli/` e `src/cli/` coexistem entre os sub-PRs? O entrypoint do `bin` muda quando? Comandos parcialmente migrados rodam por qual caminho?

**Contexto (research):**

- O `package.json:bin` aponta hoje para `cli/ai-guidelines-cli.mjs`. Esse arquivo faz parsing de argv e despacha para `cli/app/engine.mjs`, `cli/app/install.mjs`, etc.
- Composição root atual está em `cli/`. Composição root nova fica em `src/cli/` (precedente: `src/cli/livingDocs.ts`).
- Durante o cutover, alguns comandos estarão migrados, outros não.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                                                                      | Pró                                                                                                                                          | Contra                                                                                                            |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A     | **`bin` muda só no final**: `bin` continua apontando para `cli/ai-guidelines-cli.mjs` durante todo o cutover. Conforme cada comando é migrado, o despacho em `cli/` delega para o use case em `src/` via wrapper fino. PR final troca o `bin` e remove `cli/`. | Bridge centralizado em 1 lugar (cli/ai-guidelines-cli.mjs); fácil de raciocinar; ponto único de falha.                                       | `cli/ai-guidelines-cli.mjs` precisa de pequenas adaptações a cada PR.                                             |
| B     | **`bin` muda já no PR1**: PR1 cria `src/cli/ai-guidelines.ts` como novo entrypoint que despacha. Para comandos não-migrados, ele chama o mjs em `cli/` via subprocess ou import dinâmico. Cada PR seguinte migra um comando, removendo o fallback.             | Composition root nova existe desde o PR1; menos refator no `cli/` legado; arquitetura final aparece cedo.                                    | Bridge envolve duas camadas (TS → mjs); pode ter sutilezas de path/import; risco de regressão no consumidor cedo. |
| C     | **Branch paralela com flag**: variável de ambiente (`AI_GUIDELINES_RUNTIME=ts                                                                                                                                                                                  | mjs`) decide qual caminho é usado. Migrações vão acontecendo "atrás da flag"; quando todos os comandos estiverem em src/, a flag é removida. | Permite A/B testing real; consumidor "early adopter" pode testar caminho TS antes de virar default.               | Cerimônia alta; flag esquecida vira débito; smoke tests precisam cobrir ambos os caminhos. |

**Recomendação inicial (a confirmar pós-gate):** Opção A — `bin` muda só no PR final. Justificativa: ponto único de bridge centralizado em `cli/ai-guidelines-cli.mjs`; ele se torna progressivamente um "router" que delega para `src/`; quando todos os comandos forem use cases em `src/`, o último PR substitui esse router por `src/cli/ai-guidelines.ts` e deleta `cli/`. Simples de raciocinar e revisar.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A (bin no final)
  - [ ] B (bin no PR1)
  - [ ] C (flag de ambiente)
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A04] Estratégia de testes — TDD + BDD por use case

**Pergunta:** Para cada use case migrado, qual é a granularidade dos testes? TDD nos use cases (testes primeiro, código depois), BDD nos smokes (comportamento ponta-a-ponta), ou ambos com regra clara?

**Contexto (research):**

- O modelo DDD em `src/` já tem padrão: cada use case tem `.test.ts` adjacente cobrindo cenários unitários com adapters in-memory (test doubles). Smoke tests vivem em `tests/smoke/` e exercitam o tarball real cross-OS.
- TDD significa: escrever teste vermelho → fazer passar com mínimo de código → refatorar. Aplica-se ao nível de use case.
- BDD aqui significa: cenários "Dado/Quando/Então" capturados em smoke tests com comportamento observável do consumidor.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                                                                                                 | Pró                                                                                               | Contra                                                                                                    |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| A     | **TDD nos use cases + smoke unchanged**: cada novo use case em `src/app/use-cases/X.ts` nasce de TDD (`X.test.ts` adjacente, red → green → refactor). Smoke tests existentes em `tests/smoke/` permanecem inalterados — eles continuam validando comportamento ponta-a-ponta via tarball. | Padrão simples; alinha com o que a 0021 já fez nos 10 use cases existentes.                       | Smoke não "narra" comportamento explicitamente em PT-BR/EN; BDD fica implícito.                           |
| B     | **TDD + BDD nos smokes**: além de TDD por use case, refatorar smoke tests existentes para usar linguagem Gherkin-like ("Dado um diretório vazio / Quando rodo `npx ai-guidelines init` / Então o arquivo X é criado com conteúdo Y"). Cada comando ganha um smoke BDD próprio.            | Comportamento ponta-a-ponta documentado em linguagem narrativa; serve como spec viva do produto.  | Mais trabalho (refatorar smokes); risco de over-engineering para um cutover que só replica comportamento. |
| C     | **TDD apenas — BDD vira spec própria**: cada use case nasce de TDD. Smoke tests continuam como estão (assertion-based, sem narrativa). BDD vira spec separada (futura), focada em transformar a suíte de smoke em documentação viva do produto.                                           | Mantém escopo desta spec cirúrgico (só TDD); BDD fica como melhoria separada com decisão própria. | Não "fecha" a narrativa do produto no mesmo momento que o cutover acontece.                               |

**Recomendação inicial (a confirmar pós-gate):** Opção A — TDD nos use cases, smoke tests permanecem. Justificativa: alinha com o padrão dos 10 use cases existentes (que a 0021 escreveu em TDD); BDD narrativo é boa ideia mas vira spec própria para não inflar o escopo desta. A spec.md já tem "BDD" no título por compromisso com testes ponta-a-ponta, que **os smoke tests existentes já são** — só não usam sintaxe Gherkin. Se a owner quiser BDD-narrativo, é a Opção B (com aumento de prazo); se quiser BDD-narrativo em outra spec, é a Opção C.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A (TDD + smoke unchanged)
  - [ ] B (TDD + smoke refeito BDD)
  - [ ] C (TDD; BDD vira spec própria)
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

### [DEC-0022-A05] Tratamento de features residuais em `cli/`

**Pergunta:** Features de runtime em `cli/features/core/`, `cli/governance/monolith/`, `cli/fs/` que não são "comandos" mas são usadas por eles (ex.: `pointers.mjs`, `templates.mjs`, `rules-builder.mjs`, `file-system.mjs`). Cada uma vira use case próprio em DDD? Vira serviço de domínio? Vira adapter de infraestrutura? Fica como utility module em `src/`?

**Contexto (research):**

- Algumas features são **policy** (regras de negócio puras) — ex.: `managed-block` writer (decide quando reescrever bloco no `AGENTS.md`). Lar natural: `src/domain/` ou `src/app/use-cases/`.
- Outras são **mechanism** (mecânica de IO sem regra de negócio) — ex.: `file-system.mjs`, `io.mjs`. Lar natural: `src/infrastructure/`.
- Outras são **builders** (compilação) — ex.: `rules-builder.mjs` que compila markdown para JSON. Lar natural: `src/infrastructure/` ou um sub-bounded-context.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                                            | Pró                                                                        | Contra                                                                                                     |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| A     | **Classificar cada feature individualmente**: para cada arquivo em `cli/features/`, `cli/governance/`, `cli/fs/`, decidir lar DDD (domain/app/infrastructure) com justificativa. PR dedicado a "features residuais" no Harness Lock. | Cada feature ganha lar semanticamente correto; arquitetura final coerente. | Trabalho de classificação demora; risco de discussão prolongada sobre cada arquivo.                        |
| B     | **Lar default = `src/infrastructure/`**: assumir que qualquer feature mjs sem classificação clara vai para `src/infrastructure/legacy/` como utility module. Refator semântico fica para spec futura.                                | Decisão rápida; cutover progride; lar semântico vira débito explícito.     | `src/infrastructure/legacy/` pode envelhecer mal; débito acumula.                                          |
| C     | **Decidir junto com cada use case dependente**: quando migrar o comando `init`, decidir lar das features que ele consome; quando migrar `update`, decidir lar das que `update` consome. Sem PR dedicado a features residuais.        | Decisão acontece no contexto real; lar emerge da necessidade.              | Pode duplicar features se 2 comandos usam a mesma feature e classificam diferente; coordenação necessária. |

**Recomendação inicial (a confirmar pós-gate):** Opção A — PR dedicado a features residuais com classificação individual. Justificativa: a arquitetura DDD pede que cada feature tenha lar semântico correto; classificar no contexto do uso (Opção C) cria risco de inconsistência cross-PR; default infraestrutura (Opção B) cria débito que vai morar em `legacy/` para sempre. A Opção A respeita o investimento DDD da 0021.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A (classificar individualmente)
  - [ ] B (default infrastructure/legacy/)
  - [ ] C (decidir junto com use case dependente)
- **Justificativa / Ressalvas:** >
  [A preencher pelo owner.]
- **Data / Owner:** [YYYY-MM-DD] / @rosanarezende

---

## Bloco C — Saúde Técnica e Dívidas Associadas

> **Bloco Mandatório.**

### [DEC-0022-C01] Saúde arquitetural e dívidas técnicas

**Pergunta:** Qual é o estado de saúde dos componentes que esta spec vai tocar, e quais dívidas técnicas pré-existentes podem impactar o escopo?

**Contexto (research):**

- **Componentes principais afetados**: pasta `cli/` inteira (será eliminada), `src/app/use-cases/` (ganha 4-5 novos use cases), `src/cli/` (ganha composition root), `src/infrastructure/` (ganha adapters de IO migrados).
- **Cobertura de testes hoje**: alta. 296 testes unit/integration baseline (Spec 0021 PR #14). Smoke suite cross-OS validando `init`/`adopt`/`update`/bin-shim via tarball real.
- **Padrões DDD existentes**: a 0021 estabeleceu o padrão (10 use cases em `src/app/use-cases/` com adapters in-memory para teste, adapters reais em `src/infrastructure/`). Novos use cases seguem o mesmo padrão.
- **Débitos conhecidos**: a coexistência `cli/` + `src/` é a dívida central — esta spec é o pagamento. Não há "dívidas bloqueadoras" no sentido de "código não funciona".

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

- **Sub-eixo 1 — B (Requer Refatoração):** `cli/` está saudável em comportamento mas é o oposto de DDD (mistura camadas; orquestração, features e infraestrutura no mesmo path). `src/` está saudável e DDD-aligned. A migração é refatoração tática estrutural (de cli/ para src/ por camada) — não re-arquitetura.
- **Sub-eixo 2 — B (Dívidas Contidas):** A coexistência `cli/` + `src/` é a dívida central; esta spec é o pagamento. Não há dívidas bloqueadoras no sentido técnico (todos os testes passam, runtime funciona).
- **Sub-eixo 3 — C (Suíte Formal):** 296 testes unit/integration + smoke cross-OS dá segurança alta para refatoração. Cada migração via TDD adiciona testes próprios. Risco de regressão controlado.

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
| `[DEC-0022-A04]` | A     | Pendente |
| `[DEC-0022-A05]` | A     | Pendente |
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
  - [ ] `[DEC-0022-A04]`
  - [ ] `[DEC-0022-A05]`
  - [ ] `[DEC-0022-C01]`

---

## Checklist pós-gate

- [ ] **(1)** `plan.md` v2 publicado: cada subseção de design técnico deriva linearmente de um `[DEC-0022-XYZ]` e referencia o ponto explicitamente.
- [ ] **(2)** `tasks.md` v2 publicado: tasks operacionais derivadas do `plan.md` v2; cada sub-bloco cita o `[DEC-0022-XYZ]` que o alimenta.
- [ ] **(3)** Status agregado desta brief mudado para `Resolved` no header e na tabela "Resumo de status".
- [ ] **(4)** Commit atômico marcando o gate: `docs(spec-0022): gate humano fechado — plan v2 + tasks v2 publicados`.
