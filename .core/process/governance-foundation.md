# Governance Foundation — Manual operacional do ciclo Governance-Driven

> **Renomeação 2026-05-17 (Spec 0021 sub-bloco 4.B.1):** este documento se chamava
> `spec-foundation.md` até a Spec 0021. O novo nome reflete que a constituição
> operacional cobre TODA a governança (7 pilares MECE), não apenas specs.
> Decisões arquiteturais estáveis cross-spec foram extraídas para ADRs
> em `.core/governance/adrs/` (sub-bloco 4.B.2) — este arquivo permanece como
> processo vivo: manual de uso do ciclo, lifecycle de artefatos, checklists.

> Este guia é a implementação canônica do passo **Plan** do ciclo RPI
> (ver `../rpi-protocol.md`). Use o ciclo governance-foundation quando a
> iniciativa merecer persistência em repositório; para ajustes pontuais
> contidos em uma sessão, use plano leve na ferramenta.

## Quando usar governance-foundation

Critério objetivo (**qualquer** verdade → governance-foundation):

- A iniciativa estima **mais de uma sessão** de trabalho.
- **Toca mais de um arquivo** fora de uma feature isolada.
- O resultado precisa **sobreviver a troca de IA, sessão ou colaborador**.

Demais casos (**todas** as condições invertidas) → plano leve (scratchpad na ferramenta, não versionado). Referência cruzada em `../rpi-protocol.md` seção "Quando usar governance-foundation vs plano leve".

---

## Tipos de spec

> **Nota da Spec 0021 (4.B.1):** a "🚧 TODO migração arquitetural" que existia aqui
> apontava para a futura spec `governance-information-architecture` — **esta é** essa
> spec. Decisão de placement: a seção "Tipos de spec" é processo vivo de classificação
> operacional e permanece neste documento. Decisões arquiteturais estáveis
> (universal vs opt-in, roadmap repo-first, numeração de specs) foram extraídas
> para ADRs no sub-bloco 4.B.2.

Toda spec declara seu **tipo** no header da `spec.md`, em **campo obrigatório sem default**. O tipo define qual variante de `tasks.md` governa a execução e se o gate humano via `decision-brief.md` é exigido antes da implementação.

**Critério-teste universal** (resposta única para classificar):

> _O design depende de evidência técnica/pesquisa ainda não coletada?_

| Tipo              | Critério-teste             | Workflow                                                                                                          | Exemplo cross-repo                                                                                                                                             |
| :---------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evidence-driven` | Sim — para toda a spec     | Stage 1 (Research → `decision-brief.md` populado → Gate humano `Resolved`) → Stage 2 (Design + Implementação)     | SaaS: redesign de tier de pricing; Library: API design pré-1.0; Infra-as-code: capacity planning; ML pipeline: dataset audit + curatoria                       |
| `deterministic`   | Não — design conhecido     | Single-pass (Setup → Implementação direta, sem `decision-brief.md`)                                               | SaaS: fix de bug com causa mapeada; Library: bump de dependência major com release notes claras; Infra: migração com schema definido; ML: refactor de pipeline |
| `mixed`           | Sim para alguns sub-blocos | Híbrido (Stage 1 + Gate apenas nos sub-blocos `(evidence-driven)`; demais single-pass com cuidado de acoplamento) | Spec que combina threat-model novo (evidence-driven) com migração de schema mapeada (deterministic)                                                            |

**Gate humano via `decision-brief.md`.** Specs `evidence-driven` ou `mixed` exigem o gate canônico antes de cravar design técnico. O gate funciona como freio explícito contra o anti-pattern "começar a desenhar antes de coletar evidência" (acreção pré-research). O artefato vive em `.specify/specs/<slug>/decision-brief.md` e segue o `decision-brief-boilerplate.md` em `.specify/templates/`. Permanece no diretório da spec após o merge como artefato histórico — não migra para `researchs/`.

**Variantes operacionais de `tasks.md`** — uma por tipo, em `.specify/templates/`:

- `tasks-evidence-driven-boilerplate.md` — Stage 1 entre Setup e Implementação A.
- `tasks-deterministic-boilerplate.md` — single-pass, sem Stage 1.
- `tasks-mixed-boilerplate.md` — híbrido com caveat de paralelismo.
- `tasks-boilerplate.md` (genérico) — referência canônica da espinha dorsal de fases.

---

## Contrato da cadeia: research → decision-brief → gate → plano → tasks → implementação

> **Invariante (ADR 0018).** A seta de autoria é `humano → sistema`. Cada fase tem uma **responsabilidade exclusiva**: o contrato define **o que ela entrega**, **o que está proibida de entregar** e **para onde escala** quando descobre algo da alçada de outra fase. Uma fase produzir a saída da fase seguinte é **violação de contrato** — foi exatamente isso no G00 (a research entregou uma _decisão já tomada_, saída do decision-brief). O **julgamento tem um único lugar de autoria: o gate humano.**

| Etapa            | Produz (responsabilidade exclusiva)                                                                                                         | Proibido de produzir                                            | Se descobrir algo fora da alçada → escala para                                                                                                                   |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`           | perguntas + escopo (dentro/fora) + critérios de aceite alto-nível                                                                           | solução / design                                                | descoberta de design vira **pergunta nova**, não resposta                                                                                                        |
| `research`       | entendimento + opções vivas _suficientes para decidir_                                                                                      | **decisão** (conclusão / resposta única)                        | evidência que "elimina tudo" → devolve ao **gate** como `Modo de gate: aceitação` (mostra **por que** as alternativas falham + **o que reabriria**); não decide  |
| `decision-brief` | **comparabilidade** — o espaço de decisão visível: cada opção sobrevivente no **mesmo conjunto mínimo de perguntas** + recomendação bounded | **julgamento** (veredito) **e advocacy** (defender / convencer) | apresenta ao **gate**; nunca crava no lugar do humano                                                                                                            |
| `gate humano`    | **julgamento autorado** (segue ou não a research; vira registro)                                                                            | — _(único lugar de autoria)_                                    | — _(é a autoria; nada a escalar)_                                                                                                                                |
| `plano`          | execução: **como** entregar o que foi aprovado                                                                                              | decisões (reabrir / inventar)                                   | DEC `Resolved` que se mostra inviável → **amendment / nova `[DEC]`** no brief (micro-gate) + nota em "Decisões revisitadas"                                      |
| `tasks`          | trabalho derivado do plano                                                                                                                  | estratégia                                                      | mudança de estratégia → devolve ao **plano** (e este à **DEC** se necessário)                                                                                    |
| `implementação`  | código que executa as tasks                                                                                                                 | governança / expansão de escopo                                 | roteia **por classe** (ver tabela abaixo): premissa caiu → **plano**; decisão inviável → **amendment/DEC**; escopo novo → `NEXT.md`; fato arquitetural → **obs** |

**Perguntas que o contrato responde de imediato:** a research pode decidir? **não.** o plano pode reabrir decisão? **não.** as tasks podem alterar estratégia? **não.** a implementação pode expandir escopo? **não.** quem produz julgamento? **o gate humano.** E quando uma fase descobre algo da alçada de outra? **escala — devolve à fase dona; não bloqueia nem absorve.**

### Mecanismos de escalonamento (devolver, não bloquear nem absorver)

Quando uma fase descobre algo que pertence a outra, a energia **flui de volta à fase dona**, com a evidência junto. O humano é puxado **só onde há julgamento** (gate/DEC) — é assim que o resto da cadeia se auto-organiza sem perder governança. O destino **não depende da fase de origem, e sim da classe da descoberta** — a tabela por fase diz _quem_ escala; esta diz _para onde_. **Reusa primitivos já existentes — não cria artefato novo:**

| Classe da descoberta                                  | Destino canônico (primitivo já existente)                                          | Julgamento humano?    |
| :---------------------------------------------------- | :--------------------------------------------------------------------------------- | :-------------------- |
| Fato arquitetural **não-decisional** (nada a decidir) | **obs** no preâmbulo do brief                                                      | não                   |
| **Premissa de plano caiu** (sem tocar decisão)        | devolve ao **plano** → registra em `plan.md` § "Decisões revisitadas"              | não (plano reexecuta) |
| **Escopo novo** além do aprovado                      | **`NEXT.md`** (débito), até a migração no fechamento                               | não (só registra)     |
| **Falta uma decisão** que nunca foi tomada            | **nova `[DEC-XXXX-NN]`** no decision-brief                                         | sim (micro-gate)      |
| Decisão **`Resolved` existente ficou inviável**       | **amendment** na DEC existente (mesma entry, `(amendment YYYY-MM-DD)`)             | sim (micro-gate)      |
| Evidência que **muda a própria pergunta** (research)  | devolve à **`spec`** (reabre a pergunta); se só muda um finding → gate `aceitação` | sim (muda escopo)     |

> **Regra de altitude:** vence o **destino legítimo mais barato** — só sobe a julgamento (nova DEC / amendment / spec) quando há **julgamento ausente**; caso contrário fica em obs / "Decisões revisitadas" / `NEXT.md`. Distinção-chave: _decisão que nunca existiu_ → **nova DEC**; _decisão `Resolved` que caiu_ → **amendment** (cf. § "O fluxo canônico" + anti-padrão #4).
>
> **Sem enforcement automático (declarativo):** aqui só **declaramos as rotas** — não há gatilho automatizado nem taxonomia de escalonamento. Se as rotas começarem a ganhar sub-tipos por fase, parar e revisar (guard anti-recursão). O comportamento desejado quando isso virar governança executável é **ESCALAR, não BLOQUEAR**.

### Critério de saída da fase de research (a fronteira `research → decision-brief`)

A research **para quando há material suficiente para uma decisão** — não continua até restar uma única resposta. O objetivo não é _descobrir a verdade_; é **tornar uma decisão possível**.

- A falsificação (refutar alternativas) é ótima para entender, mas, levada ao limite, **consome o espaço de decisão**: quando a research entrega `A = impossível · B = impossível · C = sobreviveu`, a decisão já aconteceu antes do brief existir, e o gate vira ratificação (seta invertida).
- Disciplina — **comparabilidade, não advocacy** (o papel do brief é tornar o espaço de decisão **visível**, não convencer): ao refutar, a research **reapresenta cada opção sobrevivente com simetria informacional** — todas respondem ao **mesmo conjunto mínimo de perguntas** (_problema que resolve · benefícios · tradeoffs · riscos · quando escolher · **quando NÃO escolher**_, inclusive a recomendada) — e separa "o que a evidência mostra" de "o que o humano precisa decidir". **Assimetria informacional** (uma opção rica, outra pobre) **já é a decisão tomada** — proibida. Falsificação produz entendimento; o gate produz a decisão.
- **Modos de gate** (a research declara qual entrega ao brief):
  - **`escolha`** — tradeoffs reais sem resposta certa → o humano **arbitra** entre opções vivas.
  - **`aceitação`** — a research convergiu numa identidade/finding → o humano **aceita / rejeita / reenquadra** (não "escolhe entre A/B/C"). Honesto sobre o que está sendo pedido; evita "aceitação disfarçada de escolha" (opções-teatro com todas menos uma já refutadas).
  - _Comparabilidade por modo:_ em **`escolha`**, as opções vivas vão com **simetria** (mesmo conjunto mínimo) para serem comparáveis; em **`aceitação`**, não se força simetria sobre alternativas refutadas — mostra-se **por que falham** e **o que reabriria** (falsificabilidade). Em nenhum modo o espaço de decisão fica invisível.

> Coerência: esta seção **não conflita** com `### O fluxo canônico`, que descreve o _lifecycle dos artefatos de decisão_ (decision-brief/ADR/policy). Esta descreve o **contrato de I/O entre fases** — e precede a discussão de artefatos.

---

## Categorias de regras: universal vs opt-in de stack

> **Princípio canônico:** [`ADR 0015 — Classificação Universal vs Opt-in para Regras Distribuídas`](../governance/adrs/0015-universal-vs-opt-in-rule-classification.md). O ADR captura o porquê da distinção e o critério perene; esta seção captura o como operacional.

Use esta classificação ao decidir **onde** uma regra nova deve viver:

| Categoria                                                                          | Destino                                             | Sincronização ao consumidor       |
| :--------------------------------------------------------------------------------- | :-------------------------------------------------- | :-------------------------------- |
| **Universal de governança IA** (workflow, plan mode, PR collab, environment check) | `.core/rules/top/` e `.core/rules/center/`          | Mandatory core — sempre injetado  |
| **Opt-in de stack/processo** (Quality Gates, TDD, formatter)                       | `.core/rules/base/<tema>/` + `cli/features/opt-in/` | Wizard pergunta; default sugerido |
| **Opt-in por provider de IA** (Claude, Codex, Gemini, Copilot, Cursor)             | `.core/rules/adapters/`                             | Wizard pergunta; default sugerido |

**Critério-teste para classificar** (do ADR 0015):

> "Esta regra valeria para um projeto X em stack Y com processo Z que **não** compartilha convenções com a minha stack/processo?"
>
> - Sim → universal.
> - Depende → opt-in.

---

## Hierarquia de documentos

Toda iniciativa relevante habita uma pasta em `.specify/specs/<slug>/`
contendo:

### `spec.md` — imutável após `In Review`

Captura o **porquê e o contrato** da iniciativa. Após atingir status
`In Review`, só muda por consenso explícito. Conteúdo:

- Problema e motivação.
- Escopo (dentro/fora).
- Decisão de fusão (se aplicável — com critério).
- Critérios de aceite **alto-nível** (observáveis, não operacionais).
- Pesquisa de contexto (referência a `research/`).
- Dependências macro entre specs.

### `plan.md` — vivo durante execução

Captura **como** a iniciativa é entregue. Atualizado conforme o
entendimento técnico evolui. Conteúdo:

- Design e arquitetura por componente/sub-bloco.
- DoD operacional detalhado.
- Estratégia de testes.
- Arquivos modificados (esperado).
- Riscos técnicos concretos.
- **Decisões revisitadas** — registro cumulativo de mudanças de rota
  (data, o que mudou, por quê). Não apaga o histórico.

### `tasks.md` — checklist vivo

Progresso operacional. Marca tasks `[x]` a cada degrau. **Espinha dorsal de execução** (instanciado a partir da variante de boilerplate apropriada ao tipo declarado na `spec.md` — ver § "Templates"):

- **Fase 0 (Setup)**: Bootstrap, criação de branch, instanciação de artefatos, criação do PR em Draft. Em `evidence-driven`/`mixed`, esta fase também inclui **Stage 1** (Research → Gate humano). O sub-bloco encerra obrigatoriamente com um `[COMMIT]` de setup gerado sem perguntar.
- **Fase 1 (Implementação Principal)**: Execução técnica do sub-bloco primário; encerra obrigatoriamente com sugestão de `[COMMIT]` atômico.
- **Fase Extra Condicional (Migração/Hardening/Rollout)**: Adicionada apenas se houver um segundo estágio real. O boilerplate foca na Fase 1 e omite fases implementativas extras a menos que explicitamente necessárias.
- **Fase de Review (Gate de Homologação)**: Empacotamento, pipeline verde, descrição em 3 etapas do PR, **aguardar gate humano formal**.
- **Fase de Encerramento (Pré-Merge)**: Migra research, consolida e deleta `NEXT.md`, atualiza roadmap, status final.

> **Modelo de 3 boundaries (Spec 0023 — `[DEC-0023-M01]`):** as fases de Review e Encerramento acima migraram para artefatos dedicados — **`review.md`** (integration readiness; gates R1–R7, lido pelo runtime) e **`release-log.md`** (log condicional de operações pós-merge). O `tasks.md` torna-se **execution-only** (fecha 100% `[x]` ao fim da execução); os boilerplates já refletem isso. O "Princípio de PR auto-suficiente" abaixo permanece válido (descreve o que o PR deve conter antes do merge); o registro pós-merge propriamente dito vive no `release-log.md`.

> **Princípio de PR auto-suficiente:** o merge não dispara nenhum trabalho adicional. Antes do merge, o PR já deve conter: status `Done (PR #N — YYYY-MM-DD)` em `spec.md`, entrada completa em `roadmap/historico.md`, remoção de `roadmap/backlog.md§Em execução`, `research-index.md` atualizado com as pesquisas migradas, `CHANGELOG.md` com a release publicada (não em `[Unreleased]`) e bump da `version` em `package.json`. Se o agente encontrar pendências durante o merge ("falta atualizar histórico", "faltou o changelog"), elas eram para ter sido cobertas na Fase 4 — abrir hotfix ou commit pré-merge é uma falha do checklist, não comportamento esperado.

> **Sequência canônica para specs com publish em registry externo (npm, PyPI, Maven, etc.):**
>
> 1. Fase 4 (encerramento pré-merge) completa — `historico.md` populado, `NEXT.md` deletado, status `Done` em `spec.md`.
> 2. **Gate humano de merge** (4.8) → squash merge no `main`.
> 3. Owner faz `git checkout main && git pull` localmente.
> 4. Owner roda o publish a partir do `main` atualizado (`npm publish --access public`, equivalente em PyPI/Maven, etc.).
> 5. Owner cria tag anotada `v<X.Y.Z>` no commit-novo de `main` (gerado pelo squash) e faz `git push origin v<X.Y.Z>`.
> 6. **Fase 5 — Release Sync (obrigatória, ver `tasks.md` da spec):** agente cria branch curta `release/v<X.Y.Z>-sync` a partir de `main` e abre mini-PR que:
>    - cita o SHA real do commit publicado em `historico.md` da spec correspondente;
>    - registra `tag v<X.Y.Z>`, `version: <X.Y.Z>`, link do registry público e data;
>    - opcionalmente, ajusta badges/links externos no `README.md`.
>      Squash merge regular após gate humano.
>
> **Nunca publicar antes do merge** se o repo usa **squash merge** (default do GitHub, padrão deste repo): squash gera commit-novo em `main`, fazendo qualquer tag colocada em commit pré-merge ficar órfã da história principal. Em repositórios com merge commit não-squash, a sequência inversa (publish → merge) é tecnicamente segura, mas a sequência canônica acima vale para ambos — é a mais simples de operar, auditar e reverter.

> **Bloqueio de nova spec por Release Sync pendente:** enquanto a Fase 5 (Release Sync) da spec mais recente estiver pendente, **nenhuma nova spec pode entrar em execução**. Estende a regra "uma sessão, uma spec ativa" ao ciclo completo de release. Operacionalmente: enquanto a Fase 5 não for mergeada, `roadmap/backlog.md` mantém entrada em `§ Bloqueadores cross-spec` com a Release Sync pendente. Specs em `Now`/`Next` que dependam do release publicado podem aguardar; specs ortogonais aguardam por disciplina (evita acumular fluxos paralelos de release).

> **Lição operacional cravada na Spec 0020 (npm-publication, 2026-05-08):** sequência foi reordenada antes do publish irreversível após erro de sequência detectado pelo owner (a sequência original colocava publish antes do merge, o que tornaria a tag órfã). O padrão de Mini-PR de Release Sync e a regra de bloqueio acima nasceram como resposta direta a essa dor.

### `NEXT.md` — obrigatório contínuo

Backlog de débitos adiados da spec. Política:

- **Sempre criar** na instanciação da spec.
- **Análise contínua**: ao final de cada fase, o agente deve analisar se discussões, tradeoffs ou itens descartados geraram débitos conscientes (riscos não mitigados, dependências para specs futuras) e registrá-los.
- **Se o item ainda será resolvido antes do merge desta própria spec**, ele **não** vai para `NEXT.md`: registre em `tasks.md`.
- **Se o item explicitamente vazou do escopo**, ele entra em `NEXT.md` até a migração final.
- **Deletar no encerramento pré-merge** (fase final do `tasks.md`), migrando débitos para `roadmap/backlog.md` (ou issues/discussões).
- Nunca sobreviver a uma spec fechada.

### `research/` — conhecimento de apoio

Pesquisas, benchmarks, auditorias, transcrições elaboradas durante a execução da spec.

**Política de Lifecycle (Migração Centralizada com Taxonomia):**
Ao fechar a spec, arquivos com valor reutilizável devem ser:

1. Renomeados para incluir a data atual como prefixo: `YYYY-MM-DD-nome-original.md`.
2. Movidos fisicamente para a **biblioteca central de pesquisas**, no escopo `<domínio>` (ex: `governance/`, `architecture/`, `oss/`). Não crie pastas por spec. **Canônico (ADR 0019):** `.governance/specs/research-library/<domínio>/`. **Legado:** `.specify/specs/researchs/<domínio>/` — **só leitura/migração; research nova nasce no canônico, nunca no legado.**
3. Indexados no `research-index.md` da root correspondente — `.governance/specs/research-index.md` (canônico) ou `.specify/specs/research-index.md` (legado).
   A pasta `research/` local da spec pode ser deletada se não restar nada de útil (ou mantida apenas para rascunhos sem valor histórico).

---

## Topologia de PRs da spec (stack · landing · integração)

> **Como os PRs de uma spec se organizam e aterrissam.** Consolida [`ADR 0020`](../governance/adrs/0020-governance-precede-execution.md) (governança precede execução; PRs _stacked_; merge ponta a ponta), [`ADR 0024`](../governance/adrs/0024-draft-ready-mergeable-distinct-states.md) (Draft≠Ready≠Mergeable; modos de aterrissagem) e `[DEC-0023-M01]` (modelo de 3 fronteiras). **Não decide nada novo** — projeta doutrina já ratificada para o ponto onde o `plan.md` é escrito. (Esta seção nasceu da própria causa-raiz que diagnosticou sua ausência: ver `0024 § Topologia operacional`.)

- **Unidade de implementação ≠ veículo GitHub.** A unidade de trabalho da spec é o **checkpoint** (ou fase); o **PR / `#N`** é o veículo do GitHub. Um checkpoint pode virar um PR próprio; checkpoints coesos podem caber num PR. **Nunca** rotular unidade interna como "PR-N" (conflita com Pull Request real — cf. `review.md` R6 da 0023).
- **PRs são _stacked_, não independentes.** Os PRs de uma spec formam uma **stack linear**: cada PR de execução tem o anterior (ou o PR de governança/bootstrap) como **base branch** (ADR 0020 §3). Não se abrem PRs independentes off-`main` para a mesma spec.
- **Default de aterrissagem = `unit`** (ADR 0024). No fim, o **PR terminal de implementação** é o veículo (carrega o diff acumulado por construção); os demais — e o Integration PR — são encerrados via **`landed-via reconciliation`** (Closed com `landed-via: #<veículo> @ <SHA>`, não rejeitados). Resultado: **um SHA canônico** em `main`; rollback = 1 `git revert`.
- **`sequential` é override de escolha humana explícita** — só quando os PRs são reversíveis isoladamente, deps fracas, deploy parcial aceitável. **Nunca default, nunca auto-detectado** do tipo da stack.
- **Merge em `main` = evento único ao fim.** Nenhum PR da stack — **nem o bootstrap** — mergeia isoladamente antes do fim. _"Thinking PR isolado não representa software pronto; representa contrato pendente de execução; a unidade de release é a stack inteira, mergeada como unidade"_ (ADR 0020).
- **3 fronteiras (`[DEC-0023-M01]`):** `tasks.md` = execução (execution-only) · `review.md` = prontidão de integração (gates **R1–R7** liberam o **Integration PR**; **R8** = merge authorization explícita do owner para a stack inteira) · `release-log.md` = pós-merge. O **Integration PR** (`[🔗] [Integration]`) **homologa a convergência _antes_ do merge único — não é veículo de aterrissagem.**
- **O Gate humano de um PR decide o próximo movimento** (tipicamente: avançar / abrir o próximo PR _stacked_), **não** é merge em `main`. O merge é o evento único do fim, sob R8.

---

## Decisões: decision-brief, ADR e policy

Decisões durante a vida de uma spec moram em **três artefatos distintos** com responsabilidades MECE. Confundir um pelo outro produz drift editorial: decision-brief que vira lixo após o gate, ADR que vira relatório de execução, policy que reabre princípio em cada PR.

### O fluxo canônico

```
Setup da spec → [decision-brief.md instanciado, se evidence-driven/mixed]
       │
       ▼
Stage 1 (research)
       │
       │   Pergunta arquitetural emerge
       │   → [DEC-XXXX-NN] entry no decision-brief (opções A/B/C + recomendação)
       │
       ▼
Gate humano → owner escolhe → entry vira "Resolvido"
       │
       │   Se a decisão é princípio cross-spec/perene
       │   → draft de ADR em `.specify/specs/<id>/adrs/` (lar local)
       │
       │   Se a decisão é operacional (threshold, lista, mecanismo)
       │   → arquivo em `.core/process/<topic>-policy.md`
       │
       │   Se a decisão é spec-específica (não vira princípio nem policy)
       │   → fica só no decision-brief, vive ali pra sempre
       │
       ▼
Execução / Implementação
       │
       │   Decisão NOVA emerge mid-spec → amendment no decision-brief
       │   (nova entry [DEC-XXXX-NN], mesma forma, status "Resolvido (amendment YYYY-MM-DD)")
       │
       ▼
Pré-merge (Fase F)
       │
       │   ADRs locais promovidas → `.core/governance/adrs/` com próximo número global
       │   Policy docs permanecem em `.core/process/` (já são globais)
       │   decision-brief.md fica no diretório da spec como artefato histórico permanente
       │
       ▼
Merge
```

### Quando cada um nasce

| Artefato                                   | Quando nasce                                                          | Vive em                     | Sobrevive ao merge?              |
| :----------------------------------------- | :-------------------------------------------------------------------- | :-------------------------- | :------------------------------- |
| `decision-brief.md`                        | Setup de spec `evidence-driven`/`mixed`                               | `.specify/specs/<id>/`      | Sim — artefato histórico fixo    |
| ADR local                                  | Quando princípio cross-spec emerge durante execução                   | `.specify/specs/<id>/adrs/` | Promovida ao lar global no merge |
| ADR global                                 | Promoção de ADR local OU criação direta para princípios estabelecidos | `.core/governance/adrs/`    | Sim — sobrevive a tudo           |
| Policy (`.core/process/<topic>-policy.md`) | Quando ADR aceita gera operacionalização tática                       | `.core/process/`            | Sim — evolui sem reabrir ADR     |

### Critério-teste para classificar o conteúdo

| Sintoma do conteúdo                                                 | Artefato correto            |
| :------------------------------------------------------------------ | :-------------------------- |
| "Avaliei opções A/B/C e escolhi X em sessão de gate"                | decision-brief              |
| "Princípio arquitetural que rege N specs futuras independentemente" | ADR                         |
| "Threshold numérico, lista de exceções, mecanismo configurável"     | Policy em `.core/process/`  |
| "Mudança concreta aplicada nesta spec específica"                   | commit message + tasks.md   |
| "Pesquisa de mercado / benchmark / análise comparativa"             | `.specify/specs/researchs/` |

### Anti-padrões a rejeitar no review

1. **ADR que vira lixo no fim da spec.** Sintoma: cita sub-bloco/fase como cronograma. Correção: reescrever como princípio perene ou rebaixar para nota histórica.
2. **decision-brief que carrega princípio perene.** Sintoma: leitor 2 anos depois precisa do brief para entender por que o sistema é assim. Correção: extrair para ADR; brief mantém apenas "como chegamos lá".
3. **Policy embutida em ADR.** Sintoma: ADR muda toda vez que threshold muda. Correção: ADR captura princípio (cobertura é piso, não meta); policy captura número.
4. **Decisão mid-spec sem registro.** Sintoma: mudança de rota só vive no histórico do Git e na memória do agente. Correção: amendment no decision-brief, mesma forma, datado.
5. **Princípio criado sem evidência.** Sintoma: ADR sem opções avaliadas A/B/C e sem origem em decision-brief. Correção: princípios precisam ter sido considerados frente a alternativas — caso contrário, é dogma, não decisão.
6. **Uma fase invade a responsabilidade da fase seguinte.** Forma geral da falha do G00: a research entregou uma _decisão_ (saída do decision-brief), não _opções_; o gate ratificou em vez de decidir (seta `humano → sistema` invertida). O mesmo invariante vale por toda a cadeia: plano que reabre decisão, tasks que mudam estratégia, implementação que expande escopo. Correção: cada fase entrega **só sua saída**; ao descobrir algo da alçada de outra, **escala (devolve à fase dona), não absorve nem bloqueia** (ver § "Contrato da cadeia" → "Mecanismos de escalonamento"). Sintoma canônico na fronteira `research → decision-brief`: research que elimina alternativas até restar uma — ela **para quando a decisão é possível**, não quando resta uma resposta; reabrir as sobreviventes com **simetria informacional** (mesmo conjunto mínimo de perguntas, inclusive "quando NÃO escolher") e declarar o modo de gate (`escolha`/`aceitação`); o brief **torna comparável, não convence**.
7. **Projeção/affordance reificada como entidade/capability de 1ª classe.** Antes de propor **nova entidade, capability, Intent, estado persistido ou artefato governado**, aplicar a **lente projeção-vs-entidade**: _isto é entidade de 1ª classe, ou projeção de algo mais fundamental (já derivável de outra fonte — topologia, port/adapter, consolidação, comando existente)?_ Sintoma: a projeção-tratada-como-entidade exige **sincronização manual entre cópias paralelas**; toda evolução do mecanismo real deixa a cópia para trás. **Critério decisivo:** se colapsar na entidade-mãe **não remove** drift, cópia paralela, sincronização manual ou decisão antecipada desnecessária, então é só **renomear** — não reificar. (Mesma capability em duas superfícies — humana e CLI/IA — é legítimo, não reificação.)

### Casos limites

- **Decisão tomada em sessão colaborativa humano-agente (sem stage 1 formal).** Pode acontecer mid-spec quando emerge nova pergunta. **Tratamento**: amendment no decision-brief (forma idêntica, com `Data / Owner` marcando o momento da sessão e o método — ex. "resposta via AskUserQuestion"). Não pular o registro.
- **Decisão pequena e operacional (qual flag passar para o build).** **Tratamento**: nem decision-brief nem ADR — só commit message. Critério: se a decisão não tem alternativas reais avaliadas, não é decisão de governança, é escolha técnica.
- **Princípio já estabelecido em spec anterior, sendo formalizado tardiamente.** **Tratamento**: ADR direta em `.core/governance/adrs/` com nota de origem histórica no header. Não precisa decision-brief retroativo (a "decisão" já foi tomada na spec original; agora só está sendo documentada).

---

## Roadmap: repo-first, integração-friendly

> **Princípio canônico:** [`ADR 0016 — Roadmap Repo-First com Tracker Externo como Camada Colaborativa Opcional`](../governance/adrs/0016-repo-first-roadmap.md). O ADR captura o porquê da escolha (memória portável agnóstica a tracker e a IA); esta seção captura o como operacional.

O repositório é a **memória canônica** do roadmap. Trackers externos (GitHub Projects, Jira, Linear) entram via campo opcional `tracker:` nas entradas de `backlog.md` — mas o **resumo mínimo no repo é mandatório**. Se o tracker está presente sem resumo no repo, é falha de contrato.

Detalhes do formato (split `historico.md` × `backlog.md`, campos obrigatórios) em [`.specify/templates/roadmap-boilerplate.md`](../../.specify/templates/roadmap-boilerplate.md).

---

## Templates

Boilerplates canônicos em `.specify/templates/`:

**Núcleo da spec** (sempre):

- `spec-boilerplate.md`
- `plan-boilerplate.md`
- `next-boilerplate.md` (instanciado apenas quando há débitos conscientes)

**Variantes de `tasks.md`** (escolha conforme o tipo declarado no header da `spec.md`):

- `tasks-boilerplate.md` — variante genérica de referência (espinha dorsal de fases).
- `tasks-evidence-driven-boilerplate.md` — Stage 1 + Gate humano antes da Implementação A.
- `tasks-deterministic-boilerplate.md` — single-pass, sem Stage 1.
- `tasks-mixed-boilerplate.md` — Stage 1 condicional para sub-blocos `(evidence-driven)`.

**Gate humano** (apenas para `evidence-driven` ou `mixed`):

- `decision-brief-boilerplate.md` — artefato canônico do gate Stage 1 → Stage 2.

**Roadmap e meta** (instanciados uma vez por repositório):

- `roadmap-boilerplate.md` — formato de `roadmap/historico.md` + `roadmap/backlog.md`.
- `research-index-boilerplate.md` — formato de `.specify/specs/research-index.md`.
- `project-config-boilerplate.md` — config local não-versionada.

Instanciar a partir destes arquivos ao abrir uma spec (ver checklist de
abertura abaixo).

---

## Numeração de specs

> **Princípio canônico:** [`ADR 0017 — Numeração de Specs: Slug Semântico Até Branch, Sem Reserva Futura`](../governance/adrs/0017-spec-numbering-slug-to-branch.md). O ADR captura o porquê (separar identidade de prioridade; estabilidade após instanciação); esta seção captura o como operacional.

Regra prática:

- **Candidatas vivem por slug semântico**, sem número. Ex.: `governance-coherence`, `roadmap-adapters`, `quality-harness-engineering`.
- **Número alocado uma vez**, no ato de `git checkout -b feat/spec-XXXX-<slug>`. Próximo sequencial disponível, sem reservar à frente.
- **Reorganizar prioridade = mover linha entre seções** (Now / Next / Later), não renumerar.
- **Nunca renumerar** após instanciação. Specs concluídas/canceladas/absorvidas mantêm numeração como rastreabilidade histórica; lacunas são honest historical artifact.

---

## Princípios da Escrita

- **Agnosticismo**: a spec deve ser útil tanto para um desenvolvedor humano
  quanto para um agente de IA atuando sozinho.
- **BR ID**: use identificadores como `[BR-FEATURE-01]` para mapear regras
  de negócio que serão testadas via TDD.
- **Contratos**: defina interfaces de input/output antes de escrever
  qualquer código.

## Guardrails dogfoodados (`GG-*`)

> **Guardrail** = regra operacional descoberta por **dogfooding** que reduz trabalho humano recorrente e é aplicada automaticamente por um **check que pode falhar** (ADR 0021: enforcement > awareness). Origem empírica: fonte `DOGFOOD-*` (`.core/rules/_meta/sources-taxonomy.md`).
>
> **Estado: INTERNO (experimento da Spec 0024).** Guardrails **não** são projetados a consumidores — não vivem em `rules.json`/`AGENTS.md`; vivem **aqui** (constituição) + um check em `cli/`. Promoção a consumer-facing é decisão futura, condicionada a o mecanismo provar valor ao longo dos PRs.

### [GG-0001] Decidibilidade de gate antes do mérito

**Origem:** `DOGFOOD-0024` (reforma de `[DEC-0024-G00]` e `[DEC-0024-G02]`, 2026-05-31). **Enforcement:** `cli/governance/gate-decidability-check.mjs` (gate `gate-decidability:check`, agregado em `yarn validate`). **Projeção (seam):** checklist no `decision-brief-boilerplate.md`.

Antes de discutir o **mérito** de uma decisão, verifique se o gate é **decidível**. Um `[DEC]` não-resolvido só está pronto para o gate se tiver, **todos**:

1. uma **afirmação única** (não um feixe de asserções); _(👁 julgamento)_
2. **"o que está sendo aceito"**; _(🤖 check)_
3. **"o que NÃO está sendo aceito"**; _(🤖)_
4. **concorrentes considerados** — por que as alternativas falham + o que reabriria; _(🤖)_
5. **arquitetura separada de implementação** (a decisão não embute migração/execução); _(👁 heurístico)_
6. **exatamente um ato de gate** (sem "aceitar X + autorizar a migração"); _(🤖)_
7. **nenhum status `Open`** (o DEC nasce `Pendente`). _(🤖)_

Itens 🤖 falham o check mecanicamente; 👁 são heurísticos/julgamento humano, projetados como checklist no seam do gate. Faltando qualquer um, o gate **não está pronto** — corrija a **forma** antes do **mérito**. Benchmark vivo: o `G02` pré-reforma falha (sem concorrentes; ato combinado); o `G00`/`G02` reformados passam.

---

## SDD Guardrails

- **Validação Humana Obrigatória**: Agentes de IA devem **obrigatoriamente** exigir validação humana do `spec.md` ANTES de gerar o `plan.md` e `tasks.md`. Isso impede decisões de design arquitetural unilaterais não supervisionadas.
- Não comece a codar sem um `plan.md` aprovado pelo humano.
- Commits devem ser incrementais e referenciar o progresso das `tasks.md`.
- Uma spec ativa **por sessão de trabalho / contribuidor**: feche a spec
  anterior **da sua sessão** antes de abrir uma nova. Specs em paralelo conduzidas por outros contribuidores ou outras sessões **são permitidas** em repos OSS — a regra é por sessão de trabalho, não por repositório (cf. research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../../.specify/specs/researchs/governance/2026-04-29-concurrency-best-practices.md)
  e linha "uma sessão, uma spec ativa" no Checklist de fechamento abaixo). Specs concorrentes **dentro da mesma sessão** competem por contexto e arriscam divergência editorial.

---

## Checklist de abertura

- [ ] Ler `.specify/specs/roadmap/backlog.md`: confirmar que a candidata
      está listada — se não estiver, adicionar entrada por slug em
      "Now/Next/Later" conforme prioridade.
- [ ] Ler `.specify/specs/research-index.md` identificando pesquisa
      existente aplicável.
- [ ] Alocar próximo número sequencial disponível (olhar pastas existentes
      em `.specify/specs/`).
- [ ] Criar pasta `.specify/specs/<numero>-<slug>/` e instanciar arquivos
      a partir dos boilerplates:
  - `spec.md` (obrigatório — header inclui campo **Tipo de spec**: `evidence-driven` | `deterministic` | `mixed`).
  - `plan.md` (obrigatório).
  - `tasks.md` (obrigatório — escolher variante alinhada ao Tipo de spec: `tasks-evidence-driven-`, `tasks-deterministic-` ou `tasks-mixed-boilerplate.md`).
  - `decision-brief.md` (obrigatório se Tipo de spec ∈ {`evidence-driven`, `mixed`}; omitido se `deterministic`).
  - `NEXT.md` (apenas se já antecipa débitos conscientes; pode ser criado mais tarde).
- [ ] Criar branch `feat/spec-<numero>-<slug>` a partir de `main`.
- [ ] Status inicial no `spec.md`: `Draft`.

## Checklist de fechamento

> **Princípio:** tudo abaixo acontece **na branch, antes do merge**. O merge é o ato de encerramento — não existe "commit de encerramento pós-merge" para governança de spec. Um PR autossuficiente chega ao merge já em estado final; `main` nunca recebe trabalho pendente.

Ao concluir uma spec, antes de autorizar o merge (gate R9 do `review.md`):

- [ ] Todas as tasks de Fase 1 e Fase 2 (Implementação A e B) marcadas `[x]` em `tasks.md`.
- [ ] Pipeline canônico verde (ex.: `yarn validate` — agrega format:check + build + test + living-docs:check; substitua pelo equivalente do stack do consumidor).
- [ ] Se `NEXT.md` existir: migrar débitos relevantes para `roadmap/backlog.md` e **deletar** `NEXT.md` na branch. Não esvaziar, não renomear — deletar.
- [ ] `research/`: migrar arquivos de valor para `.governance/specs/research-library/<domínio>/` com prefixo `YYYY-MM-DD-` e indexar no `research-index.md`. Nenhum conhecimento deve morrer na pasta da spec fechada.
- [ ] Mover a entrada da spec para "Concluídas" em `roadmap/historico.md`.
- [ ] Remover a entrada da spec da seção "Em execução" em `roadmap/backlog.md`.
- [ ] Status final no `spec.md`: `Done`.
- [ ] `state.yml`: `stage: done`, campo `next:` vazio ou ausente.
- [ ] `release-log.md` T0 preenchido com o que é conhecido antes do merge (data, owner, stack, versão alvo). Campos que dependem do merge (SHA, tag, run URL) ficam para confirmação pós-CI — isso é bookkeeping, não trabalho de spec.
- [ ] Gate R9 marcado `[x]` no `review.md`: evidência de que a branch está em estado final.
- [ ] **Fechar antes de abrir uma nova spec** — uma spec ativa por vez.
