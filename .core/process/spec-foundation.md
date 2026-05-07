# Spec Foundation — Implementação canônica do passo Plan no ciclo RPI

> Este guia é a implementação canônica do passo **Plan** do ciclo RPI
> (ver `../rpi-protocol.md`). Use spec-foundation quando a iniciativa
> merecer persistência em repositório; para ajustes pontuais contidos
> em uma sessão, use plano leve na ferramenta.

## Quando usar spec-foundation

Critério objetivo (**qualquer** verdade → spec-foundation):

- A iniciativa estima **mais de uma sessão** de trabalho.
- **Toca mais de um arquivo** fora de uma feature isolada.
- O resultado precisa **sobreviver a troca de IA, sessão ou colaborador**.

Demais casos (**todas** as condições invertidas) → plano leve (scratchpad na ferramenta, não versionado). Referência cruzada em `../rpi-protocol.md` seção "Quando usar spec-foundation vs plano leve".

---

## Tipos de spec

> **🚧 TODO — migração arquitetural pendente.** O conteúdo desta seção
> deverá migrar para a futura spec **`governance-information-architecture`** (já presente em `roadmap/backlog.md`), que reorganizará a arquitetura de informação do framework (gêneros documentais, fronteira entre `docs/`, `adrs/`, `.core/`, `.specify/`). Esta posição é tática — entregar a Spec 0018 sem bloquear a entrega; a migração futura não bloqueia o uso desta seção pelos consumidores enquanto isso.

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

A Spec 0008 canonizou uma distinção explícita para regras publicadas pelo
baseline. Use esta classificação ao decidir **onde** uma regra nova deve viver:

| Categoria                                                                          | Destino                                                   | Sincronização ao consumidor       |
| :--------------------------------------------------------------------------------- | :-------------------------------------------------------- | :-------------------------------- |
| **Universal de governança IA** (workflow, plan mode, PR collab, environment check) | `.core/rules/global-rules.md` (sempre injetado)           | Mandatory core — sempre vai       |
| **Opt-in de stack/processo** (Quality Gates, TDD, formatter)                       | `.core/rules/opt-in/<tema>/*.md` + `cli/features/opt-in/` | Wizard pergunta; default sugerido |

A distinção **estende a Spec 0005** ("opt-in é exatamente o que varia por
stack") a regras editoriais. Regras puramente de processo/IA que valem para
qualquer consumidor (independente de stack) são universais; o resto é opt-in.

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

## Roadmap: repo-first, integração-friendly

O repositório é a **memória canônica** do roadmap. Ferramentas externas (GitHub Projects, Jira, Linear, etc.) podem ser **camada colaborativa humana** via campo opcional `tracker` nas entradas de `.specify/specs/roadmap/backlog.md`, mas o **resumo mínimo no `backlog.md` é mandatório** — nunca delegar totalmente ao tracker externo.

Motivação: o roadmap precisa ser legível por agentes de IA (sem acesso uniforme a APIs de tracker externo) e sobreviver a mudanças de ferramenta colaborativa. Detalhes do formato (incluindo split `historico.md` × `backlog.md`) em `.specify/templates/roadmap-boilerplate.md`.

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

Regra canônica (Spec 0008 sub-bloco B):

- **Candidatas vivem por slug semântico**, sem número. Ex.:
  `governance-coherence`, `roadmap-adapters`, `quality-harness-engineering`.
- **Número só é alocado** quando a spec sai de candidata e cria branch
  (`feat/spec-XXXX-<slug>`). Recebe o **próximo número sequencial
  disponível**, sem reservar à frente.
- **Reorganizar prioridade = mover linha entre seções** (Now / Next /
  Later), não renumerar.
- **Nunca renumerar** uma spec depois de instanciada. Números em specs
  concluídas/absorvidas permanecem como rastreabilidade histórica.

Motivação: antes da Spec 0008, numeração sequencial fixa forçava
renumeração quando prioridade mudava (ex.: uma candidata renumerada de
0011 para 0013 ao adicionar novas candidatas). Churn editorial sem ganho.

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
- [ ] Pipeline de check + test verde, sempre (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] Se `NEXT.md` existir: migrar débitos relevantes para
      `roadmap/backlog.md` (ou para issues/discussões, conforme o caso) e
      **deletar** `NEXT.md`.
- [ ] `research/`: migrar arquivos de valor seguindo a **Política de Lifecycle** (Seção 4.5): Renomear com prefixo `YYYY-MM-DD-`, mover para `.specify/specs/researchs/<domínio>/` e indexar em `.specify/specs/research-index.md`.
      Nenhum conhecimento (RAG) deve morrer na pasta da spec fechada.
- [ ] Mover a entrada da spec para "Concluídas" em `roadmap/historico.md` mantendo o número como histórico.
- [ ] Remover a entrada da spec da seção "Em execução" em `roadmap/backlog.md`.
- [ ] Status final no `spec.md`: `Done`.
- [ ] **Fechar antes de abrir uma nova spec** — uma sessão, uma spec ativa.
