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

> **Modelo de 3 boundaries (Spec 0023 — `[DEC-0023-M01]`):** as fases de Review e Encerramento acima estão migrando para artefatos dedicados — **`review.md`** (integration readiness; gates R1–R7, lido pelo runtime) e **`closure.md`** (log de operações pós-merge). O `tasks.md` torna-se **execution-only** (fecha 100% `[x]` ao fim da execução); os boilerplates já refletem isso. A reconciliação completa desta seção e do "Princípio de PR auto-suficiente" abaixo com o modelo (incl. o papel pós-merge do `closure.md`) é débito de fechamento da 0023 — ver `.governance/specs/0023-workflow-runtime/`.

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
2. Movidos fisicamente para a pasta central `.specify/specs/researchs/<domínio>/`, onde `<domínio>` deve ser o escopo da pesquisa (ex: `governance/`, `architecture/`, `oss/`). Não crie pastas por spec.
3. Indexados em `.specify/specs/research-index.md`.
   A pasta `research/` local da spec pode ser deletada se não restar nada de útil (ou mantida apenas para rascunhos sem valor histórico).

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

Ao concluir uma spec e fazer merge para `main`:

- [ ] Todas as tasks de Fase 1 e Fase 2 (Implementação A e B) marcadas `[x]` em `tasks.md`.
- [ ] Pipeline canônico verde, sempre (ex.: `yarn validate` no `ai-guidelines` — agrega format:check + build + test + living-docs:check; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] Se `NEXT.md` existir: migrar débitos relevantes para
      `roadmap/backlog.md` (ou para issues/discussões, conforme o caso) e
      **deletar** `NEXT.md`.
- [ ] `research/`: migrar arquivos de valor seguindo a **Política de Lifecycle** (Seção 4.5): Renomear com prefixo `YYYY-MM-DD-`, mover para `.specify/specs/researchs/<domínio>/` e indexar em `.specify/specs/research-index.md`.
      Nenhum conhecimento (RAG) deve morrer na pasta da spec fechada.
- [ ] Mover a entrada da spec para "Concluídas" em `roadmap/historico.md` mantendo o número como histórico.
- [ ] Remover a entrada da spec da seção "Em execução" em `roadmap/backlog.md`.
- [ ] Status final no `spec.md`: `Done`.
- [ ] **Fechar antes de abrir uma nova spec** — uma sessão, uma spec ativa.
