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

Demais casos (**todas** as condições invertidas) → plano leve (scratchpad
na ferramenta, não versionado). Referência cruzada em `../rpi-protocol.md`
seção "Quando usar spec-foundation vs plano leve".

---

## Categorias de regras: universal vs opt-in de stack

A Spec 0008 canonizou uma distinção explícita para regras publicadas pelo
baseline. Use esta classificação ao decidir **onde** uma regra nova deve viver:

| Categoria                                                                          | Destino                                             | Sincronização ao consumidor       |
| :--------------------------------------------------------------------------------- | :-------------------------------------------------- | :-------------------------------- |
| **Universal de governança IA** (workflow, plan mode, PR collab, environment check) | `.core/rules/global-rules.md` (sempre injetado)     | Mandatory core — sempre vai       |
| **Opt-in de stack/processo** (Quality Gates, TDD, formatter)                       | `.core/rules/<feature>.md` + `cli/features/opt-in/` | Wizard pergunta; default sugerido |

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

Progresso operacional. Marca tasks `[x]` a cada degrau.

- Fase 0: Setup e research.
- Fase 1: Execução (dividida em sub-blocos quando aplicável).
- Fase 2: Validação cruzada e PR.
- Fase 3: Encerramento.

### `NEXT.md` — temporário-mandatório

Backlog de débitos adiados. Política:

- **Criar** quando a spec gerar débitos conscientes que não entram no
  escopo desta entrega.
- **Deletar no encerramento** (Fase 3), migrando débitos para
  `roadmap/backlog.md` (ou issues/discussões, conforme o caso).
- Nunca sobreviver a uma spec fechada — `NEXT.md` órfão é AI-slop.

### `research/` — conhecimento de apoio

Pesquisas, benchmarks, auditorias, transcrições elaboradas durante a execução da spec. 

**Política de Lifecycle (Migração Centralizada com Taxonomia):**
Ao fechar a spec, arquivos com valor reutilizável devem ser:
1. Renomeados para incluir a data atual como prefixo: `YYYY-MM-DD-nome-original.md`.
2. Movidos fisicamente para a pasta central `.specify/specs/researchs/<domínio>/`, onde `<domínio>` deve ser o escopo da pesquisa (ex: `governance/`, `architecture/`, `oss/`). Não crie pastas por spec.
3. Indexados em `.specify/specs/research-index.md`.
A pasta `research/` local da spec pode ser deletada se não restar nada de útil (ou mantida apenas para rascunhos sem valor histórico).

---

## Templates

Boilerplates canônicos em `.specify/templates/`:

- `spec-boilerplate.md`
- `plan-boilerplate.md`
- `tasks-boilerplate.md`
- `next-boilerplate.md`

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
- Uma spec ativa por vez: **feche a spec anterior antes de abrir uma nova**.
  Specs concorrentes competem por contexto e arriscam divergência editorial.

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
  - `spec.md` (obrigatório)
  - `plan.md` (obrigatório)
  - `tasks.md` (obrigatório)
  - `NEXT.md` (apenas se já antecipa débitos adiados)
- [ ] Criar branch `feat/spec-<numero>-<slug>` a partir de `main`.
- [ ] Status inicial no `spec.md`: `Draft`.

## Checklist de fechamento

Ao concluir uma spec e fazer merge para `main`:

- [ ] Todas as tasks de Fase 1 e Fase 2 marcadas `[x]` em `tasks.md`.
- [ ] `yarn check && yarn test` verdes.
- [ ] Se `NEXT.md` existir: migrar débitos relevantes para
      `roadmap/backlog.md` (ou para issues/discussões, conforme o caso) e
      **deletar** `NEXT.md`.
- [ ] `research/`: migrar arquivos de valor para `.specify/specs/researchs/<número-nome-da-spec>/` e indexar em
      `.specify/specs/research-index.md` com link + resumo curto.
      Nenhum conhecimento (RAG) deve morrer na pasta da spec fechada.
- [ ] Mover a entrada da spec para "Concluídas" em `roadmap/historico.md` mantendo o número como histórico.
- [ ] Remover a entrada da spec da seção "Em execução" em `roadmap/backlog.md`.
- [ ] Status final no `spec.md`: `Done`.
- [ ] **Fechar antes de abrir uma nova spec** — uma sessão, uma spec ativa.
