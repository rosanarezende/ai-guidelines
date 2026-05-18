<!-- ai-guidelines-template: roadmap-boilerplate v=1 -->

# Roadmap — Boilerplate

> Formato canônico dos 2 arquivos que compõem o roadmap do projeto, vivos em
> `.specify/specs/roadmap/`. Decisão Spec 0008 sub-bloco B (research migrado para
> `.specify/specs/researchs/oss/2026-04-26-roadmap-format-benchmarks.md`):
> migração de arquivo único `ROADMAP.md` para pasta `roadmap/` com split
> passado vs presente-futuro; candidatas vivem por slug (sem número).
>
> **Princípio "repo-first, integração-friendly" + campo `tracker`:** fonte
> canônica em `.core/process/governance-foundation.md` (Spec 0018 promove o princípio
> à constituição). Este boilerplate apenas aplica.

Instancie estes 2 arquivos em `.specify/specs/roadmap/` (já criados pela
Spec 0008 no repo atual; este boilerplate documenta o formato para
projetos novos que adotarem o framework ou para referência editorial).

---

## Arquivo 1 — `.specify/specs/roadmap/historico.md`

Captura o passado: specs concluídas, absorvidas, superseded, canceladas ou
migradas. Conteúdo imutável após fechamento da spec correspondente.

### Estrutura

```markdown
# Histórico — <nome-do-projeto>

Este arquivo registra specs concluídas e absorvidas. É leitura de contexto
histórico, não roadmap de execução — o presente/futuro vive em `backlog.md`.

---

## Specs concluídas

Em ordem cronológica reversa. Número mantido como rastreabilidade.

- **spec XXXX** — <título curto> (`.specify/specs/XXXX-<slug>/`) — **Done** (<data>).
  - <bullet curto destacando entrega principal>
  - <bullet curto destacando entrega secundária>

---

## Specs absorvidas

Specs propostas que foram fundidas em outra spec. Rastreabilidade via
ponteiro para a spec absorvedora.

- **spec XXXX** — <título original> → absorvida em **spec YYYY** (<slug>),
  sub-bloco Z. Critério de fusão: <referência ao critério>.
  Detalhes em `.specify/specs/YYYY-<slug>/spec.md`.
```

### Regras

- Nunca edite retroativamente uma entrada de `historico.md`. Entradas são
  snapshots do estado no momento do fechamento.
- Novos fechamentos são adicionados ao topo da seção correspondente.
- Se uma spec absorve outra, registre em "Specs absorvidas" com ponteiro
  para a absorvedora.

---

## Arquivo 2 — `.specify/specs/roadmap/backlog.md`

Captura presente e futuro: specs em execução, próximas na fila, candidatas
por slug, bloqueadores cross-spec e itens oportunistas sem spec. Vivo —
atualizado sempre que prioridade ou estado mudam.

### Estrutura

```markdown
# Backlog — <nome-do-projeto>

Este arquivo é o backlog vivo do repositório. Captura specs em execução,
próximas na fila, candidatas, bloqueadores cross-spec e itens oportunistas.

**Regra de ouro:** nada aqui entra em execução sem nova spec
(`.specify/specs/<slug>/`). Este arquivo é leitura obrigatória antes de
abrir spec nova ou fechar uma spec existente.

**Política repo-first, integração-friendly:** o repositório é a memória
canônica. Ferramentas externas (GitHub Projects, Jira, Linear, etc.) podem
ser camada colaborativa humana via campo opcional `tracker` nas entradas
abaixo, mas o resumo mínimo no `backlog.md` é mandatório. Detalhes em
`.core/process/governance-foundation.md`.

---

## Em execução

Specs atualmente em branch ativa. Formato enxuto.

- **spec XXXX** — <título curto> (<branch> → PR #NNN).
  <breve estado da entrega>

---

## Now (próxima fila, ordem importa)

Specs ou candidatas priorizadas para iniciar em seguida. Ordem indica
prioridade.

- **<slug>** (ou **spec XXXX-<slug>** se já numerada) — <título curto>
  <contexto mínimo: fonte do insight, sinal de "está na hora",
  pré-requisitos críticos>
  - **tracker:** `<link opcional ao GitHub Issue/Project/Jira/Linear>`

---

## Next (depois, ordem flexível)

Specs ou candidatas que entram na fila depois de esgotado o Now. Ordem
pode ser reorganizada sem renumeração.

- **<slug>** — <título curto>
  <contexto mínimo>

---

## Later (gatilho específico)

Specs ou candidatas que aguardam um gatilho externo (adoção, incidente,
decisão estratégica). Documente o gatilho explícito.

- **<slug>** — <título curto>
  **Gatilho:** <descrição>
  **Não fazer antes de:** <critério negativo>

---

## Bloqueadores cross-spec

Decisões ou trabalho que bloqueiam múltiplas specs. Cada bloqueador lista
as specs impactadas.

### <N>. <Nome do bloqueador>

**Impacta:** <spec A, spec B>.
**Contexto:** <por que bloqueia>.
**Ação pendente:** <o que precisa acontecer para destravar>.

---

## Itens oportunistas (sem spec)

Ideias, insights e débitos pequenos que ainda não justificam uma spec
dedicada. Podem virar spec futura ou ser abandonados conforme o contexto
evolua.

- **<título curto>**: <descrição 1-2 linhas>. <fonte opcional>.

---

## Regras de uso

1. Nada aqui entra em execução sem nova spec dedicada em `.specify/specs/<slug>/`.
2. Ao fechar uma spec (status Done), revisar seu `NEXT.md`: migrar itens ainda
   relevantes para este arquivo; depois **deletar** o `NEXT.md` da spec.
3. Ao abrir spec nova: ler este arquivo primeiro, referenciar itens relevantes
   no `spec.md` da nova spec (não duplicar conteúdo).
4. Se um item oportunista virar prioridade, promover para spec própria — não
   executar ad-hoc.
5. Bloqueadores cross-spec ficam aqui, não dentro de `NEXT.md` de specs
   individuais (evita duplicação).
6. Candidatas vivem por **slug semântico**; número só na criação da branch.
   Reorganizar prioridade = mover entre seções, não renumerar.
```

### Regras

- Candidatas usam apenas slug; número só na criação da branch.
- Reorganizar prioridade = mover a linha entre seções (Em execução / Now /
  Next / Later); nunca renumerar.
- Quando uma spec for concluída, migrar a entrada para `historico.md` e
  remover de `backlog.md`.
- Campo `tracker` é opcional. Quando presente, é link para tracker externo
  (Issue, Project, Jira, Linear). O resumo no `backlog.md` é **sempre**
  mandatório — nunca delegar totalmente ao tracker externo (princípio
  repo-first; ver `.core/process/governance-foundation.md`).

---

## Migração de `ROADMAP.md` legado

Projetos que ainda tenham `.specify/specs/ROADMAP.md` (formato pré-Spec 0008) devem migrar dividindo o conteúdo:

- **"Specs concluídas"** + specs marcadas como **"absorvidas"** → `historico.md`.
- **"Specs propostas" ativas** + **"Bloqueadores cross-spec"** + **"Itens
  oportunistas"** → `backlog.md`.

Depois deletar `ROADMAP.md` e atualizar referências em `AGENTS.md`,
`.core/templates/AGENTS-core.md.tmpl`, `README.md`, `CONTRIBUTING.md`,
`.core/process/governance-foundation.md`, `.core/process/rpi-protocol.md` e
demais templates SDD que citem o caminho antigo.
