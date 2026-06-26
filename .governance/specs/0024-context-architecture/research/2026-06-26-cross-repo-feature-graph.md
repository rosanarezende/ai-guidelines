---
artifact-kind: research
subject: "modelo cross-repo do grafo de trabalho — feature multi-repo, arestas nas entregas, e onde mora a informação de uma feature (feature-intent + banco + dashboard). Estresse via uma arquitetura de micro-frontends (anonimizada)."
date: 2026-06-26
reviewer: internal
method: assessment
---

# Grafo de trabalho cross-repo — feature multi-repo (estresse via micro-frontends)

> **Não-autoridade.** Insumo da **Lente 3** (ligações) do `2026-06-25-work-graph-model.md` e da frente
> **identidade cross-repo + banco + dashboards de valor**. Em divergência, vence o tracker / `state.yml` / gates.
> **Anonimizado:** o exemplo se inspira numa arquitetura de micro-frontends real, mas **nomes, URLs e a empresa não
> aparecem** — só os aprendizados, com nomes genéricos `acme-*`.

## Por que este doc

A modelagem cross-repo emergiu rica numa sessão de exploração e os 3-4 bullets que tínhamos no tracker eram rasos
demais pra reconstruir o valor depois de uma compactação. Aqui fica o registro denso; o tracker só aponta pra cá.

## O exemplo — uma arquitetura de micro-frontends (abstraída)

- **Host / shell:** entrega o HTML com **pontos de montagem** e carrega um **runtime loader**; orquestra quais MFEs
  renderizam e onde; repassa o **contexto** (dados do backend) aos MFEs.
- **Plataforma de MFEs (`acme-mfe-platform`):** o **registry + runtime + CLI** — descobre e carrega cada MFE **por
  nome**, versionado (semver + SRI), de forma **lazy/assíncrona**. É o **substrato**: todos rodam sobre ela.
- **Design system ("commons"):** componentes compartilhados, consumidos pelos MFEs.
- **Micro-frontends:** apps independentes (decorados com um HOC tipo `Connect()`, montados via `renderAt()`), com
  **deploy independente**.
- **Backend:** endpoints + o contexto/dados que o host injeta.

## Os 6 repos (anonimizados)

| repo                 | papel                                                        |
| -------------------- | ------------------------------------------------------------ |
| `acme-mfe-platform`  | a **plataforma** (registry + runtime + CLI) — **substrato**  |
| `acme-design-system` | componentes compartilhados ("commons")                       |
| `acme-api`           | backend (endpoints + contexto)                               |
| `acme-shell`         | o **host/coração** que orquestra e monta os MFEs             |
| `acme-mfe-identity`  | MFEs A — login, signup, conta                                |
| `acme-mfe-growth`    | MFEs B — dashboard, billing (outros, não tocados pelo login) |

## A tarefa "login" decomposta

A feature se **quebra** (`breaks-into`) numa `delivery` por repo que precisa de trabalho — **diagrama:**
`../assets/feature-multirepo-login.svg`.

| repo                 | trabalho                                                        |
| -------------------- | --------------------------------------------------------------- |
| `acme-api`           | **delivery:** auth endpoints (login/token/sessão)               |
| `acme-design-system` | **delivery/patch:** componentes do formulário (se faltarem)     |
| `acme-mfe-identity`  | **delivery:** o MFE de login (UI, `Connect()`)                  |
| `acme-mfe-support`   | **delivery:** MFE de ajuda — **sob demanda** + **proativo**     |
| `acme-shell`         | **delivery:** rota + mount dos MFEs + repassar contexto de auth |
| `acme-mfe-platform`  | **nenhum** (só é usada; salvo se precisar de capacidade nova)   |

### A camada de suporte (a fricção)

Na página de login entra um **MFE de ajuda** (`acme-mfe-support`, em outro repo) que pode ser acionado **a qualquer
tempo** (o usuário pede ajuda) **ou de forma direcionada** (o suporte/IA **aborda** o usuário ao perceber que ele
**falhou várias vezes** numa etapa). Isso cria uma aresta **inédita**: `coordinates-with` **MFE↔MFE** — o login
**emite sinais de falha** e o suporte **reage**. Não é dependência de entrega; é coordenação operacional entre dois
trabalhos vivos.

**Mecanismo da comunicação MFE↔MFE (abstraído):** **pub/sub** sobre um **barramento de eventos** provido pela
plataforma — o login faz `emit(canal, mensagem, payload)` (ex.: `login:step-failed`) e o suporte faz `listen` no
mesmo `canal:mensagem`. **Acoplamento frouxo:** nenhum chama o método do outro; ambos só concordam num **contrato**
`(canal, mensagem, payload)`. **Mudar esse contrato** é o ponto real de coordenação cross-repo.

## As arestas (cross-repo) — todas NAS entregas

- `acme-mfe-identity` **depends-on** `acme-api` (precisa dos endpoints) e **depends-on** `acme-design-system`.
- `acme-mfe-support` **depends-on** `acme-design-system` (consome) e **coordinates-with** `acme-mfe-identity`.
- `acme-shell` **depends-on** os dois MFEs (não monta o que não existe) e **coordinates-with** `acme-api` (contexto).
- **Todos depends-on** `acme-mfe-platform` (a plataforma).

A **ideia "login"** só **origina** (`breaks-into`); a **"feature login"** é uma **view derivada** que agrega as
deliveries. Nenhum nó único atravessa repos — cada trabalho vive no seu, ligado por arestas.

## Achados pra Lente 3

1. **Coordenação/dependência vivem NAS entregas** (nós duráveis em cada repo), não na ideia — reforça a **P2**.
   Inclui o caso novo `coordinates-with` **MFE↔MFE**.
2. **Dois sabores de `depends-on`** (🔴 sub-pergunta nova):
   - **plataforma/versão** — sobre `acme-mfe-platform` (e o DS como lib): **estável, não-por-tarefa**;
   - **entrega** — `acme-mfe-identity` → `acme-api`: **espera um trabalho concreto ficar pronto**.
   - Vale distinguir os dois? (afeta caminho crítico e o que bloqueia o quê.)
3. **1 ideia → N entregas** (prepara a **P3**): uma `delivery` por repo com trabalho; a feature = view derivada.
4. **Cross-repo resolve em CONTRATOS:** `coordinates-with` = **compartilhar um contrato** (login↔suporte: o contrato
   de eventos pub/sub; api↔web: o contrato da API; MFE↔DS: a API do componente) — **acoplamento frouxo**.
   `depends-on` = **esperar um build/versão**. O que muda numa coordenação é o **contrato**, não o método do outro.

## Onde mora a informação da feature (o ponto central)

**Requisito:** a feature deve **nascer já declarando todos os pontos que vai tocar** — pra **paralelizar** o trabalho
e dar **previsibilidade**.

A feature tem **duas faces:**

- **Plano** (autorado, no nascimento): os pontos planejados (repos × trabalhos). Habilita paralelização + previsão.
- **Atual** (derivado): o agregado dos trabalhos que **existem** em cada repo. Alimenta o **dashboard ao vivo**.

**Opções avaliadas:**

- **(a) um repo dedicado por feature → NÃO.** Peso + **2ª SSOT** (a definição duplicaria os trabalhos reais → drift).
  Princípio decidido: **o repo vence; o agregado é projeção**.
- **(b) só os grafos por-repo agregando → sim, mas só pro lado _atual_.** Cada repo **publica** seu grafo; uma camada
  agrega por `feature-id` + arestas com ids namespaceados → é o **banco** (`active-work.aggregate.yml`, view derivada
  `features`). Mas (b) **sozinho não dá** o "nascer com todos os pontos" — não dá pra derivar trabalho inexistente.

**Síntese (proposta, NÃO cravada):**

- Um **`feature-intent`** (plano **leve**, cross-repo) **nasce** declarando os pontos e **semeia** (`breaks-into`) os
  trabalhos em cada repo → paralelização + previsibilidade.
- Ele **não** mora num repo de feature; mora numa **camada cross-repo** (a do banco/registry).
- Cada repo **publica** seu grafo; a camada **compõe** a feature (**plano × atual**); o **dashboard** mostra quem
  depende de quem e onde está o gargalo.
- **Analogia:** _a plataforma-de-MFEs está pros MFEs assim como um **registry-de-trabalho** está pros trabalhos_ —
  cada repo se "registra"/publica; a camada compõe.
- **Novo nível no modelo:** a **feature (cross-repo)** com seu **próprio intent**, **acima** do trabalho por-repo.

## O que isso virou (modelo maduro) + o backend plugável

A síntese acima **amadureceu** (ver tracker, Parte 3):

- A `feature-intent` generalizou pra uma **camada `intent`** (objetivo durável, dispara N trabalhos + se retroalimenta) — a feature cross-repo é **um caso** dela.
- As intents vivem numa **camada de governança global** (por **org / unidade de negócio**) — **todas** (single _e_ multi repo) → cross-referência · padrões · **SDD/DDD** consistente. Não briga com "repo vence" (a intent é governança; o trabalho é SSOT no repo, com back-ref).
- **Governança é contrato-first, backend PLUGÁVEL:** a **forma da intent** + **publicar** + **banco=derivado** são invariantes; o **backend** tem **knobs independentes** (não uma escada amarrada ao tamanho). _(diagrama: `../assets/governance-backend-knobs.svg`.)_

### Os knobs (independentes)

- **onde as intents moram:** pasta no repo · meta-repo git · store/serviço.
- **como o banco é computado:** script local · gerado no CI · serviço ao vivo.
- **dashboard:** nenhum · gerado (periódico) · ao vivo (serviço).
- **escopo:** único · org · BU (multi-tenant).

### Exemplos de combinação (qualquer combinação vale — não é escada)

| cenário                                       | intents moram     | banco           | dashboard        | escopo |
| --------------------------------------------- | ----------------- | --------------- | ---------------- | ------ |
| **solo mínimo** (1-2 repos)                   | pasta no repo     | script local    | —                | único  |
| **solo turbinado**                            | meta-repo         | gerado no CI    | gerado           | único  |
| **open-source / comunidade**                  | meta-repo público | gerado no CI    | gerado (público) | org    |
| **time sem CI ainda**                         | meta-repo         | script (manual) | sob demanda      | único  |
| **híbrido** (autoria simples + consulta rica) | pasta no repo     | serviço ao vivo | ao vivo          | org    |
| **empresa, 1 BU**                             | meta-repo         | gerado no CI    | gerado           | org    |
| **enterprise multi-BU**                       | store / serviço   | serviço ao vivo | ao vivo          | BU     |

> O **híbrido** prova a independência: intents **simples** (arquivos nos repos) + agregação/consulta **rica** (serviço). Crescer = **trocar um knob**, sem re-modelar.

## Em aberto (não cravado)

- ✅ **Resolvidos desde então (ver tracker, Parte 3):** arestas **nas entregas** (P2 reforçada) · `coordinates-with`/`depends-on` = **contratos** · a camada **`intent`** + a **governança global** (por org/BU) + o **backend contrato-first plugável** · estresse 3-devs (`../assets/feature-3devs-parallelization.svg`).
- 🔴 **Dois sabores de `depends-on`** (plataforma/versão × entrega) — distinguir?
- 🔴 **Todo trabalho tem uma intent?** (ou só objetivos que valem; trivial colapsa → aparece só no banco) — rodada dedicada.
