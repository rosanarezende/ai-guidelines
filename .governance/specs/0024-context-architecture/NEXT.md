<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0024 Context Architecture

> **Arquivo de acompanhamento contínuo.** Instanciado no setup. Registra itens que extrapolem o escopo da 0024 e precisem sobreviver até o encerramento. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.governance/specs/roadmap/backlog.md`.

> ## 🔁 Nota de fase — ABSORÇÃO OPERACIONAL (2026-05-31, Checkpoint 2 / Checkpoint 2.1)
>
> A 0024 está em absorção (Stage 1 encerrado; gate fechado). Vocabulário canônico (Checkpoint 2.1): **PR/`#N`** = Pull Request real · **Checkpoint N** = unidade de implementação · **Gate** = ritual de validação (cf. `plan.md § Glossário`). Insights #1–#9 abaixo são da fase de pesquisa (registro). Os aprendizados da fase de absorção entram no **#10** — _candidatos a absorção, ainda não formalizados, a triar numa próxima sessão (não over-modelar)._

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase de Absorção (Stage 2)

- **Enforcement do contrato da cadeia (`[DEC-0024-G06]`)** — CAMADA 1 deferida; promotável a ADR no fechamento (cf. insight #9). 1º candidato nomeado: `decision-trace:check`. **Não construir agora** (dogfood-first).
- **Casa única dos templates (`F-AG04`)** — micro-decisão da owner pendente em Checkpoint 11B (`.core/templates` vs `.ai-guidelines/templates`).
- **Protótipo do Checkpoint 4A (Workflow Provenance)** — preservado em `git stash` (interrompido por ordem de execução, não rejeição). Reaproveitar como referência **somente** quando a sequência chegar ao Checkpoint 4A; não antecipar.
- **Promover o glossário Checkpoint/Gate/PR a convenção framework-wide** — hoje cravado spec-local (`plan.md`). Candidato a refletir em `pr-title-conventions.md` / `governance-foundation.md` numa unidade própria (consumer-facing → exige Gate próprio). **Não** bundlado no Checkpoint 2.1.
- ~~**Apply do `smoke` no ruleset vivo (Checkpoint 2.2)**~~ — **RESOLVIDO (2026-06-01).** Aplicado no apply consolidado do 2.3b (`required` = `repo-validation` + `smoke` + `governance-pr-check`); paridade vivo↔versionado verde. _Lição: o `smoke` ficou ~4 checkpoints "aprovado conceitualmente" mas não-projetado na plataforma — a existência de um checkpoint não garante projeção no estado vivo. Reforça fechar a lacuna no momento, não "para depois"._
- **Paridade via API no CI (Checkpoint 2.2)** — o `GITHUB_TOKEN` default pode não ter `administration:read` para ler o ruleset vivo; o workflow `ruleset-drift` degrada para **INDETERMINADO** (warning, não bloqueia). Promover a token/permissão dedicada **se** a paridade automatizada virar requisito duro. O invariante PRIMÁRIO (producibilidade, no `validate`) **não** depende disso.
- **Paridade topologia↔realidade GitHub via API (hardening futuro — NÃO-bloqueante).** ⚠️ **Separação arquitetural explícita (Checkpoint 2.3b):** os **invariantes locais** de well-formedness (lifecycle-coerência: `github_pr` ⟺ `active`/`concluded`; unicidade; contiguidade de `sequence`) **NÃO vivem mais aqui** — foram **absorvidos** como guard determinístico no `workflowStateSerializer`/`state-yml:check` (`repo-validation`, já required). O que resta neste débito é **só** o que **exige nova camada (rede/API)**: verificar que cada `github_pr` aponta a um PR real/aberto com a branch declarada; reconciliação GitHub↔topologia; validação de commits/branches reais; `topology:check` completo. Análogo à **paridade** do ruleset (2.2) vs. sua **producibilidade** local. **Não é pré-condição** para promover o `governance-pr-check` a `required` (essa pré-condição — well-formedness — já está satisfeita localmente; cf. `[DEC-0024-G07]` + `plan.md` § "Decisões revisitadas" 2026-06-01). Abrir como checkpoint próprio quando priorizado.

---

## 💡 Insights e Descobertas

### 1. Equivalência estrutural entre Hermes skill loop e ai-guidelines governance lifecycle

- **O Contexto**: emergiu na sessão de planejamento da 0024 (2026-05-28) durante análise comparativa via transcrições.
- **O Insight**: Hermes faz `task completion → pattern extraction → skill creation → skill refinement`. ai-guidelines faz `observação → backlog → spec → decision-brief → ADR/regra`. Mesma forma estrutural (pipeline de promoção); Hermes opera em agent skills, ai-guidelines em governance. Implicação: handoff = projeção/lookup; aprendizado vive no lifecycle existente; conflar viola ADR 0018.
- **Ação Sugerida**: alimentar Bloco D (Promoção) do decision-brief; pode virar DEC explícita `[DEC-0024-D02]` cravando "handoff não promove autonomamente".

### 2. Tri-party humano + Claude + ChatGPT iterou em 5 turnos durante a sessão de planejamento

- **O Contexto**: a sessão de abertura desta spec acumulou 5 turnos tri-party distintos sem ritual prévio: (1) ChatGPT como 2ª opinião sobre cláusula anti-paper da ADR 0023; (2) ChatGPT estruturando os 5 eixos de pressão; (3) ChatGPT como **leitor tardio** dos artifacts do PR #30 (cravou `[DEC-0024-D04]`); (4) ChatGPT como **leitor tardio** da iteração D04 (refinou sub-questão dupla + reading hierárquico); (5) ChatGPT como **leitor tardio** do PR #31 mergeado (cravou `[DEC-0024-F04]`). Turnos 3-5 são o mesmo mecanismo cognitivo nomeável — _leitor tardio_, distinto de "2ª opinião genérica" porque vê apenas artefatos cristalizados sem context da construção. Cf. evidence artifact § "Mecanismo cognitivo nomeável — 'leitor tardio' vs 'construtor'".
- **O Insight**: critério de `[1.H.10]` da Spec 0023 ("≥ 2 specs adicionais OU adoção espontânea") já está **satisfeito** pela contagem desta sessão (5 turnos) somada ao caso anterior da Spec 0023 PR5/PR #25. A pergunta para encerramento de Stage 1 deixa de ser _"quando promover tri-party a ADR?"_ e passa a ser **_"qual a formulação correta?"_** — provavelmente cobre `construtor / construtor refinado / leitor tardio` como mecanismo central (mais específico que "tri-party genérico").
- **Ação Sugerida**: considerar promoção formal a ADR no encerramento da Stage 1 desta spec, cobrindo: 3 papéis cognitivos com propriedades distintas; quando convocar leitor tardio (após cristalização de artefato — PR aberto, decision-brief commitado, gate mergeado); antipatterns ("consenso prematuro" via turno único; "review por construtor refinado" que ainda defende decisões em vez de ler frio).

### 3. Gate de CI para validar `state.yml` schema globalmente — SATISFEITO via PR #31

- **O Contexto**: descoberto via review do Copilot no PR #30 (2026-05-28). O `state.yml` inicial desta spec foi commitado com `stage: research` (inválido — schema canônico aceita apenas `discovery|decision|planning|implementation|closing|done`) e `focus`/`next` como strings escalares (inválido — schema exige `ReadonlyArray<string>`). `yarn validate` **não pegou** o bug porque o `parseWorkflowState()` era invocado apenas em runtime.
- **Status**: ✅ **Satisfeito por PR #31** (`fix(governance-ci): adiciona gate state-yml:check para validar schema globalmente`, mergeado em 2026-05-28). Novo script `cli/state-yml-check.mjs` itera `.governance/specs/*` e `.specify/specs/*` validando cada `state.yml` via `parseWorkflowState`; integrado ao chain `yarn validate` após `living-docs:check`.
- **Lição cravada**: pattern "achado lateral em PR de bootstrap → fix imediato em vez de débito empurrado" funcionou — instrução da owner _"como se trata de um teste em um processo importante do workflow, precisamos incluir agora essa correção para evitar empurrar débito com a barriga"_. O caso virou input direto para `[DEC-0024-F04]` (insight #5 abaixo) — generalização do padrão.

### 4. Reading hierárquico dos 5 eixos — observação emergente (não cravar agora)

- **O Contexto**: ChatGPT 4º turno (review da iteração D04) propôs leitura alternativa dos 5 eixos como cadeia de dependências, não como classificação paralela:

  ```text
  Unidades (D04)      → define o objeto
       ↓
  Promoção (D01-D03)  → define o lifecycle
       ↓
  Seleção (A)         → define o que entra
       ↓
  Projeção (E)        → define como aparece
       ↓
  Governança (F)      → define quem autoriza
  ```

  Nessa leitura, `[DEC-0024-D04]` deixa de ser "mais um DEC dentro do Bloco D" e vira **decisão central da spec inteira**.

- **O Insight**: a leitura é coerente arquiteturalmente, mas baseia-se em insight conversacional (5º review tri-party da mesma sessão), não em research consolidada de sistemas externos. Reestruturar os blocos agora violaria o princípio cravado nesta spec ("não congelar ontologia cedo demais"; "DECs começam Open, opções emergem").
- **Ação Sugerida**: **registrar como observação sem ação estrutural**. Critério para promoção: se ≥ 2 research artifacts dos sistemas externos (Hermes/Cursor/Anthropic/Spec Kitty) convergirem em mesma ordem hierárquica, considerar reestruturação dos blocos no encerramento de Stage 1 (junto com publicação do `plan.md` v2). Se não convergirem, leitura fica como modelo interpretativo possível, não ontologia oficial.

### 5. F04 cravado — pergunta sobre invariantes estruturais sistêmicos vs humanos

- **O Contexto**: ChatGPT 5º turno (review do PR #31) generalizou o caso `state.yml`: _"state.yml é apenas o primeiro artefato governado que sofre deste problema? Quais artefatos possuem invariantes estruturais que ainda dependem de comportamento humano em vez de enforcement sistêmico?"_ Cravado como `[DEC-0024-F04]` no Bloco F.
- **O Insight**: candidatos óbvios a investigar (não-exaustivo; research pode expandir/refinar):
  - **`decision-brief.md`** — drift entre headers individuais e tabela "Resumo de status" é hoje responsabilidade humana (template explicitamente nota isso); IDs `[DEC-NNNN-XYZ]` sem validação de unicidade/formato; contrato form B vs C não-validado mecanicamente.
  - **`tasks.md`** — sub-block IDs e state machine de checkboxes (`[ ]` / `[/]` / `[x]`); markers `[COMMIT]`/`[REVIEW]` sem cross-check contra commits/PR state.
  - **`backlog.md`** — estrutura de entries; campos obrigatórios por entry; renumeração de fila Now (humano lembra).
  - **ADRs** — estados (`Proposta` / `Aceita` / `Superseded`); formato header; cross-refs bidirecionais.
  - **Meta-artefatos YAML futuros** (per ADR 0023) — cada um pré-condicionado a ter gate equivalente (anti-paper já cravado).
- **Ação Sugerida**: F04 fica como DEC `Open` aguardando research. Cross-ref forte com a candidata `coverage-rigor-enforcement` no backlog `Candidatas` — quando essa candidata abrir como spec, F04 fornece a lista de invariantes que o escopo deve cobrir. Critério proposto a investigar: _"se um agente pode introduzir drift sem perceber, e o drift é mecanicamente detectável, então é candidato a gate"_.

---

### 6. Elevação da 0024 a spec fundacional de arquitetura de contexto (2026-05-29)

- **O Contexto**: a discussão tri-party (owner + Claude + ChatGPT) desta sessão mostrou que o objeto da 0024 não era handoff, mas a **arquitetura de contexto** inteira. A pergunta da unidade primária de modelagem (`spec` vs `pilar` vs `lifecycle` vs `artefato`) e a validade da taxonomia `deterministic/mixed/evidence-driven` reapareceram em ≥ 2 contextos (cf. obs #7 do preâmbulo do decision-brief).
- **O Insight**: a 0024 foi elevada (decisão da owner) de "uma projeção (handoff)" para **o modelo fundacional do qual as projeções derivam**. Materializado no **Bloco G** (G00 raiz → G05) + inventário arquitetural (`research/2026-05-29-architectural-inventory.md`). Fronteira cravada: **modelo ≠ migração** — a 0024 decide o modelo; migração ampla é Grupo B, faseada.
- **Re-escopa de candidatas (pendente — C3, só após o conjunto de elevação completo)**: `boilerplate-system-modernization` e `runtime-and-template-root-consolidation` têm as **camadas-modelo (Grupo A)** absorvidas pela 0024; as **camadas-execução (Grupo B)** permanecem nelas. `handoff-contracts-formalization` (Grupo A) absorvida na research. `governance-dashboard-and-visual-artifacts` e demais permanecem **Grupo C** (independentes). A edição do `backlog.md` registra isso **após** a validação do inventário.
- **Rename do slug — FEITO (2026-05-30)**: `handoff-as-first-class` → **`context-architecture`** (diretório + branch migrados sob autorização explícita da owner; número 0024 imutável, ADR 0017). Retarget do PR #30 acompanha o rename remoto da branch. Cf. nota no header do `spec.md`.
- **Ação Sugerida**: executar a re-escopa do `backlog.md` (C3) após o commit de elevação; agendar o rename de slug como milestone; priorizar a research do Bloco G (`G00` raiz) com Fonte A + B.

### 7. `decision session` — consumidor/processo arquitetural emergente (hipótese, 2026-05-29)

- **O Contexto**: o dogfooding da própria 0024 revelou que o **owner no gate humano** é um consumidor de contexto não modelado. Fluxo recorrente observado: `research → decision-brief → leitor tardio → visualizações → owner decide → plan/tasks`. Cf. obs #8 do preâmbulo + `[DEC-0024-G05]`.
- **O Insight**: pode existir um processo governado `decision session` (≠ research, ≠ implementação) e uma **família de projeções** derivadas da mesma arquitetura de contexto: `workflow handoff / briefing / decision-session / dashboard / review`. Descoberto por dogfooding real, não especulação — o tipo de achado fundacional que a elevação tornou visível.
- **Ação Sugerida**: a research do Bloco G (G05) trata o decisor humano como consumidor de primeira classe; **não** cravar `decision session` como DEC antes da research (regra 7 — sinal emergente, ainda não inequívoco). Reavaliar promoção quando ≥ 2 projeções da família forem confirmadas como necessárias.
- **Lifecycle adicional descoberto (2026-05-29)**: a 0024 revelou, por dogfooding, um ciclo `Research → Decision Session → Reference Implementation → Generalization`. A **implementação de referência (Stage 2) não é só execução — é o mecanismo de validação arquitetural** das decisões do Bloco G: prova que o modelo (G00-G05) consegue ser materializado **antes** da generalização (migração ampla, Grupo B). Reinterpreta Stage 2: não é "construir algo", é "provar que a arquitetura se materializa". Hipótese; promover a lifecycle/ADR formal só com recorrência (regra 7).

### 8. Fronteira humano→sistema é multi-seam (grounded) + `terminus` como hipótese forte deferida (2026-05-29)

- **O Contexto**: round de Fonte B final (Cursor + opencode) para G00, sob a lente fechada "qual tipo de responsabilidade cruza a fronteira?". Cf. `research/2026-05-29-cursor-opencode.md`.
- **O Insight (grounded, load-bearing)**: a fronteira humano→sistema **não é única** — há ≥2 seams (regras + execução) que se comportam independentemente; "espessura" é **por-seam, não escalar**. "Julgamento cristalizado em governança versionada" no seam de regras é **convenção cross-tool** (`.cursor/rules` / `AGENTS.md` / `CLAUDE.md`) — logo **não separa** governance-first de harness. Isso fechou as perguntas abertas #1 e #2 de G00 e fortaleceu o critério §4.3 (5 sistemas externos).
- **Hipótese forte DEFERIDA (não coroar)**: o separador de classe real _talvez_ seja o **`terminus`** do cruzamento no seam de regras — _artefato governado executável_ (governance-first, sem LLM no runtime, ADR 0018) vs _steering para geração autônoma_ (harness) vs _auto-aprendizado_ (autônomo). É Camada 3 (atraente, grounded-ish, **não falsificada**). **Disciplina (correção tri-party do owner, 2026-05-29)**: não substituir a hipótese elegante anterior (transformação/espessura) por uma nova hipótese elegante (terminus). **Não reabre G00.**
- **Ação Sugerida**: tratar `terminus` como candidata de **G01** (identidade/facetas). Falsificar com: _existe sistema governance-first cujo cruzamento termina em geração autônoma? existe harness cujo cruzamento termina em artefato governado sem LLM?_ O achado multi-seam alimenta G01 (identidade) e G03 (promoção). **Não** cravar como descoberta até falsificação por contraste.

### 9. O contrato da cadeia é CAMADA 2 (declarativo); CAMADA 1 (enforcement) é o maior deferral — nomeado (2026-05-30)

- **O Contexto**: revisão tri-party do contrato cravado (`governance-foundation.md` § "Contrato da cadeia") sob a lente da imagem-norte (`Automação Estrutural → Governança Operacional → Julgamento Humano`; princípio: "a automação não substitui o humano — protege o espaço de decisão humana").
- **O Insight**: o contrato recém-cristalizado é um artefato de **CAMADA 2 (Governança Operacional — regras e contratos)**. Ele articula a arquitetura da imagem para o pipeline de **decisão** (cada fase produz só sua saída, escala em vez de absorver; comparabilidade protege o _input_ do julgamento), mas é **declarativo**: não há **CAMADA 1** que o force. A Spec 0023 já entregou CAMADA 1 para a higiene de **execução** (drift gate, living-docs, `state-yml:check`, `governance-pr-check`) — falta CAMADA 1 para o **contrato de decisão**. Sem ela, o humano/agente ainda carrega a carga de **lembrar e aplicar** o contrato.
- **Mapa dos deferrals nomeados** (todos conscientes, com casa):
  - **Enforcement do contrato da cadeia** (CAMADA 1 p/ decisão) → **deferido**; promotável a ADR no fechamento (cf. `[DEC-0024-G06]`; a constituição diz "sem enforcement, declarativo").
    - **Primeiro candidato nomeado (não desenhado): `decision-trace:check`** — _o `plan.md` v2 só contém design rastreável a uma `[DEC]` `Resolved`_ (cada subseção cita um `[DEC-NNNN-XYZ]` cujo status no "Resumo de status" é `Resolved`). **Maior ROI como 1º experimento:** determinístico (regex/AST sobre `plan.md` × tabela do brief), **reusa a infra de checks** (`living-docs:check` / `state-yml:check` / `governance-pr-check`) e **formaliza regra já declarada** (Checklist pós-gate, item 1). Protege o seam **gate→plano**.
    - **Runner-up:** proxy de comparabilidade — _toda opção, inclusive a recomendada, tem "quando NÃO escolher" não-vazio_ (ataca direto a falha do G00; check de presença determinístico, porém mais difícil pela estrutura variável das opções — tabela vs lista).
    - **Não-primeiros:** simetria semântica plena (resiste a mecanização → fica disciplina CAMADA 2 + leitor tardio até surgir proxy checkável); ordem-de-gate (mais spec-específica).
  - **Interação de decisão / "decision-walk"** (projeção _gate-ready_ que reduz a carga de parsear um brief denso) → obs #10 + `[DEC-0024-G05]`.
  - **Consolidação tri-root de templates** (carga mecânica de editar ≥ 4 cópias, vivida nesta sessão) → `[DEC-0024-G04]` (modelo) + `runtime-and-template-root-consolidation` (execução).
  - **Drift enforcement** (tabela "Resumo de status", coerência header↔tabela) → `[DEC-0024-F04]`.
  - **Taxonomia de promoção** ("quando algo vira regra") → `[DEC-0024-D04]` / `G03`.
- **Ação Sugerida**: tratar a CAMADA 1 do contrato de decisão como trabalho explícito pós-0024 (ADR do contrato + forcing functions), não como pressuposto. **Não construir enforcement agora** (dogfood-first cravado). Sinal de maturidade p/ promover: o contrato sobreviver a uso real antes de virar gate mecânico.

---

### 10. Aprendizados da fase de absorção (2026-05-31) — candidatos a absorção (não formalizados)

> Surgiram do uso real da stack durante os checkpoints de absorção. **Triar numa próxima sessão:** alguns viram guardrail/check, outros finding, outros só nota. **Não over-modelar.**

1. **Drift silencioso SSOT→projeção é o padrão recorrente nº 1.** A mesma forma apareceu 4×: `state.yml`↔`active-specs` (A3), `rules.json`↔`AGENTS.md` (C4), `state.yml`↔`tasks/plan/NEXT/brief` (A2), código↔`ARCHITECTURE.md` (B2). **Sinal:** _toda aresta SSOT→projeção precisa de um gate de sync, ou diverge em silêncio._ Checkpoint 3/Checkpoint 5 são instâncias; vale generalizar (candidato a guardrail-classe ou princípio).
2. **Validação mecânica vs semântica** — todo guardrail deveria declarar seu subconjunto 🤖 (check falha) e 👁 (julgamento humano), como GG-0001. Candidato a regra de autoria de guardrails. _Clean-clone/smoke é o complemento para o que `yarn validate` não pega (correção de distribuição — ex.: Checkpoint 11): `test:smoke` deveria gatear PRs reais que afetam o que o consumidor recebe._
3. **Simplificação cognitiva do gate humano à medida que a automação cresce** — observado ao vivo: o `gate-decidability-check` achou os 4 defeitos do G02 _no lugar do_ owner reler tudo; o gate encolheu para "ratificar a afirmação única / dizer go". **Pattern:** enforcement absorve a parte mecânica do julgamento, deixando ao humano só o julgamento irredutível (coerente com ADR 0021 + imagem das 3 camadas; ainda não nomeado).
4. **Handoff/plano não pode depender de estado local.** O plano executável viveu em `~/.claude/plans/` (efêmero) — não sobrevive a troca de sessão/máquina/agente. **Lição:** carregar sequência + decisões no **repo** (por isso o Checkpoint 2 dobra a sequência no `plan.md`). Reforça F-007/ADR 0022.
5. **Anti-taxonomia é recorrente em todos os níveis** — apareceu em G02 (tipos de spec), guardrails (família GG-\*), e roles de proveniência. **Disciplina:** ao remover uma taxonomia fechada, resistir a recriá-la um nível acima; preferir _propriedade livre + papéis reconhecidos (hints de projeção)_, não enum fechado.
6. **DX do `workflow continue`** projeta branch/spec/estado, mas não a cadeia operacional (quem implementou/auditou/decidiu) — gap que motivou o Checkpoint 4. Operador quer "onde estamos + quem tocou + o que está pendente" num olhar.
7. **"Enforcement previne a classe, não o sintoma"** — GG-0002 protege contra reintrodução do conceito banido, não só corrige o caso atual; o guard entra **antes/junto** da correção (sem janela de regressão).
8. **Reusar "PR" para unidade de implementação foi drift de vocabulário** (Checkpoint 2.1). Chamamos blocos internos de "PR-1…PR-12" enquanto só existe um Pull Request real (`#32`) — colapsando implementação/revisão/integração que a 0023 já separara (`[DEC-0023-M01]`; `review.md` R6: _"drift 'PR6' não existe"_). **Correção:** `PR/#N` = GitHub; `Checkpoint N` = unidade; `Gate` = ritual. **Lição:** ao nomear unidades de trabalho, não sobrecarregar termos do host (PR/branch/issue); reusar linguagem natural sem criar sigla nova. Candidato a nota em `pr-title-conventions.md`.
9. **PRINCÍPIO — "Absorção exige projeção ao ponto de consumo"** (Checkpoint 2.1a; o achado mais forte da investigação). _Uma decisão arquitetural **não está absorvida** enquanto existe só na sua **fonte histórica** (ADR, brief, instância de spec anterior); só está absorvida quando é **projetada para o ponto onde a próxima decisão será tomada** (manual operacional, boilerplate, check)._ Generaliza o item 1 (drift SSOT→projeção): a **ausência de projeção é causa-raiz comprovada** de drift. Instâncias: `state→active-specs`, `rules→AGENTS`, `state→tasks/plan/NEXT`, `código→ARCHITECTURE` e — o caso que gerou o princípio — **`0023→governance-foundation`** (a topologia de PR da 0023 nunca foi projetada para o manual/boilerplate, então a 0024 re-derivou errado no Checkpoint 2.1). **Corrigido (L1):** `governance-foundation § "Topologia de PRs da spec"`. **Candidato forte** a finding/princípio formal (promoção = gate próprio; não vira ADR neste checkpoint).
10. **L2/L3 da topologia — backlog explícito da 0024** (não-crítico após L1 existir; owner, 2026-06-01). Após o L1 (manual = SSOT), falta **projetar a topologia para os pontos de instanciação**: **L2** = bloco "Topologia operacional" no `plan-boilerplate` (todo `plan.md` nasce com o default `unit`/stacked + prompt de desvio justificado); **L3** = item no "Checklist de abertura" do manual. **Ligados ao trabalho de consolidação de templates** (Checkpoint 10/11) — editar boilerplate antes do cutover de root (Checkpoint 11B) colidiria com o tri-root. Abrir como checkpoint próprio quando a consolidação chegar.

11. **Drift `guardrails`→ruleset = instância CONFIRMADA da classe "producibilidade" (Checkpoint 2.2, 2026-06-01).** O ruleset `Main Governance` exigia o status check `guardrails`, **sem produtor desde `12a3a28`** (consolidação `content-guardrails → repo-validation`, Spec 0023 PR6). Drift SSOT→projeção silencioso, **mascarado por admin-bypass** (merges passavam sem o gate real). Descoberto ao investigar o FAIL do Codex no Checkpoint 2.1a — que era **falso positivo ambiente-dependente** (verde no CI oficial e local; vermelho só no sandbox do Codex; mesmo SHA) → segue como **investigação aberta separada** (`workflow-dispatch.test.mjs`), **não** vira correção sem diagnóstico. **Resolvido pela raiz, não pelo sintoma:** **Camada 0** (apply no ruleset vivo: `guardrails`→`repo-validation`) + **Camada 1 / Checkpoint 2.2** (`ruleset:check` — **producibilidade** no `validate` + **paridade** detect-only no `ruleset-drift.yml`; ruleset-as-code; agregador estável `smoke`). Confirma o princípio **#10.9** (absorção exige projeção ao ponto de consumo) e materializa **`[DEC-0024-F04]`** (invariante estrutural que dependia de comportamento humano). **A doc `docs/scripts.md` que descrevia os workflows estava igualmente stale (mesma raiz: projeção não atualizada na consolidação) — sincronizada no 2.2.** Aprendizado de processo: _toda consolidação/rename de workflow que produz um required-context deve reconciliar o ruleset — agora mecanicamente enforçado pela producibilidade._

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item descartado ainda — registrar quando research excluir explicitamente alguma direção investigada.)_
