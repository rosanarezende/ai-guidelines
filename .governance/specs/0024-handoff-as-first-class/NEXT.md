<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0024 Handoff as First-Class

> **Arquivo de acompanhamento contínuo.** Instanciado no setup. Registra itens que extrapolem o escopo da 0024 e precisem sobreviver até o encerramento. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.governance/specs/roadmap/backlog.md`.

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1 (Implementação)

_(Stage 2 ainda não iniciado — Fase 0 evidence-driven em curso)_

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

## ✂️ Itens descartados deliberadamente

_(Nenhum item descartado ainda — registrar quando research excluir explicitamente alguma direção investigada.)_
