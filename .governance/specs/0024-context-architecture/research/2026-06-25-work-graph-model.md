---
artifact-kind: pre-coding-review
subject: "ARQUIVO ÚNICO de acompanhamento do modelo do trabalho (grafo) — o modelo em 3 lentes + perguntas abertas (🔴) e decididas (🟢)"
date: 2026-06-25
reviewer: internal
method: assessment
---

# Modelo do trabalho (grafo) — arquivo único de acompanhamento

> **Este é o ÚNICO arquivo de acompanhamento.** (Juntei os dois; o `model-analysis-workbench` foi removido.)
> **🔴 = pergunta aberta · 🟢 = já decidido.** Iteramos aqui, uma de cada vez.
> Regras nossas: **recência vence** (a decisão mais nova supera a antiga) e **conferir o já-decidido antes de
> desenhar**. Não-autoridade; vira insumo da DEC quando fechar.

---

## Parte 1 — O modelo, em 5 lentes (referência)

### Lente 1 · Os tipos: 5 de TRABALHO + 2 FERRAMENTAS (`proposal` · `exploration`)

O que separa um tipo do outro é a **intenção de saída** — _o que o autor quer que aconteça no mundo ao concluir
o item_ (não tamanho/tecnologia/estágio).

> **🟢 Decidido (owner 2026-06-25) · REFINADO (2026-06-27):** o **TRABALHO** são **5 tipos** — `delivery` ·
> `experiment` · `incident` · `fix` · `patch` (entregam **valor de produto**). O **`spike` saiu dos tipos de
> trabalho** e virou **FERRAMENTA** (junto do `proposal`) — instrumentos do ciclo todo que **servem** o trabalho,
> sem entregar valor de produto por si (ver **Lente 4**; **renomeado `spike` → `exploration`**). **Dense ×
> Virtual caiu:** a densidade **escala com o peso de CADA instância**, não por tipo; só os **campos exigidos**
> (hipótese/métricas no experiment; severidade no incident) são por tipo (parte da intenção).

Para cada tipo: **o que entrega · de onde surge · o que exige · abre→investiga→fecha · resultado vem depois? ·
vira outro? · o que o torna único.**

**`delivery`** (ex-`spec`) — _construir o que já foi decidido_

- **Entrega:** muda a **capacidade** do sistema.
- **Exige:** nada além do intent · **densidade escala com o peso** (geralmente densa).
- **Abre→investiga→fecha:** `delivery-brief` **selado** → questions/research (se houver pergunta aberta) → **gate** (a prova é o próprio merge).
- **Resultado depois?** opcional — verificar se a entrega moveu o valor.
- **Vira outro?** não — é **destino** (proposta e experimento-won viram delivery).
- **Único:** o trabalho "padrão"; o valor **é** a capacidade entregue; **comprometido** (fica — _pode_ ser
  removido no futuro, mas isso **não é o core**).

**`experiment`** — _intervir pra aprender sobre uma tese_

- **Entrega:** **qualquer intervenção no produto pra APRENDER** sobre uma tese — A/B (controle × variante) **ou**
  **rollout medido** (liberar pra uma fatia e medir). **Não** é só teste A/B. O valor **é o aprendizado**.
- **Exige:** **hipótese + métricas** (por tipo) · **ideal:** atrás de **feature flag** (pra desligar/remover a
  qualquer hora) · densidade escala com o peso.
- **Abre→investiga→fecha:** `experiment-brief` que **sela a hipótese** → discovery (questions/research; pode disparar `exploration`) → gate no merge — **mas o resultado vem depois**.
- **Resultado depois?** **SIM** — roda um período → **won / lost / inconclusivo**. _(Em growth, **lost > won é
  saudável** — taxa de sucesso alta demais = só ideias óbvias, pouco risco.)_
- **Vira outro?** **won → delivery** (sistematiza), com **flexibilidade**: hoje (com IA) **reaproveita-se bem mais
  o código testado** do que antes (quando won = refatorar muito). `lost` → clean-up; `inconclusivo` → itera.
- **Único:** o **único cujo valor só se conhece depois do merge**, e que se **espera perder com frequência**.

_(↓ O que era `spike` **saiu daqui** — virou a ferramenta **`exploration`**, descrita na seção FERRAMENTAS abaixo, junto do `proposal`.)_

**`incident`** — _conter um problema grave (sem culpa, sem débito)_

- **Entrega:** **contém e documenta** uma fricção grave, com **severidade**. O valor está em **não repetir** (prevenção).
- **Cultura:** **blameless** — não é sobre "quem causou". _(owner: **não** queremos que as pessoas tenham medo de lidar com incidentes.)_
- **Abre (rápido, simples):** um **template simples/interativo** registra o incidente (severidade · o que quebrou
  · status). Esse registro **destrava barreiras com PRAZO** — prioridade de merge, bypass de CI — pra **apagar o
  incêndio sem virar débito** (o bypass **expira**; `GG-0005`).
- **Investiga/corrige:** mitiga → mergeia rápido (com o bypass).
- **Fecha:** **postmortem** (causa-raiz + ações + prevenção). **Leve** (pra dar vontade de fazer) **mas garantido**
  por um **alerta** atrelado ao prazo (pra não despriorizar). É o artefato principal; doc vivo.
- **Vira outro?** não (terminal) — mas **gera prevenção:** um `fix` (correção definitiva), um `patch` (hardening) ou uma `proposal`.
- **Único:** o **único reativo** — age antes, documenta depois.

**`fix`** — _corrigir um bug que o usuário vê_

- **Entrega:** corrige um comportamento **que o usuário percebe**.
- **De onde surge:** **diverso** — bug reportado (cliente/interno, **prioridade menor que um incident**); de uma
  `proposal`; ou **percebido durante** outro trabalho (`patch`/`experiment`/`delivery`).
- **Tamanho:** **varia** — de 1 linha a algo que precisa de **investigação** (uma `exploration`) ou que **cresce e vira
  `delivery`**. ⚠️ Pode **merecer registro próprio**, não só uma linha — **subestimamos o fix** (owner 2026-06-25).
- **Exige:** nada · **densidade escala com o peso** (de 1 linha a registro próprio).
- **Abre→fecha:** registro (leve _ou_ próprio) → commit → verifica.
- **Único:** o discriminador vs `patch` é **"o usuário vê"**; o **tamanho não** define o tipo.

**`patch`** — _manutenção invisível ao usuário_

- **Entrega:** manutenção **que o usuário NÃO vê** (deps, lint, refactor transparente, segurança).
- **De onde surge:** **diverso** (igual ao fix) — necessidade de manutenção (bump de dep, lint, security);
  **dívida técnica percebida durante** outro trabalho (`delivery`/`experiment`); de uma `proposal`. Standalone ou atrelado.
- **Tamanho:** **varia** — de um bump de 1 linha a um **refactor grande / migração arriscada** que precisa de
  **investigação** (uma `exploration`) ou que **cresce e vira `delivery`** (a zona cinza "refactor que passa a mudar capacidade").
  Pode **merecer registro próprio**.
- **Exige:** nada (sem hipótese/severidade — não é experiment nem incident) · **densidade escala com o peso**.
  ⚠️ "não ter hipótese/severidade" **≠** "não ter registro".
- **Abre→fecha:** registro (leve _ou_ próprio) → commit → verifica.
- **Único:** o que o separa do `fix` é **só a visibilidade** (o usuário **não** vê); o tamanho não define o tipo.
  Quando o "refactor transparente" **passa a mudar capacidade**, deixa de ser patch → vira `delivery`.

---

**Fora dos tipos de trabalho — as FERRAMENTAS (Lente 4):** instrumentos do **ciclo todo** que **servem** o trabalho; **não** entregam valor de produto por si. São **duas** — `exploration` (investigação) e `proposal` (intake).

**`exploration`** _(ex-`spike`)_ — _a ferramenta de investigação: provar/responder um ponto antes de entregar valor_

> **🟢 Decidido (owner 2026-06-27):** o que era `spike` **não é tipo de trabalho** — é **ferramenta** (como o `proposal`/`insight`), usada **antes ou durante** o trabalho pra **produzir conhecimento** (valor de **aprendizado**). **Renomeado `spike` → `exploration`** (cobre exploration/POC/pesquisa/benchmark). É **executada** (tem ciclo de vida próprio), mas **não** entrega valor de produto.

- **Entrega:** **prova/responde um ponto** (técnico ou de modelagem) por investigação → **valor de aprendizado** (às vezes robusto: POC, ou templates/base que o trabalho seguinte herda via `derives-from`).
- **De onde surge:** **amplo** — standalone (validar algo / POC), ou dentro de um `delivery`/`experiment`, ou de uma `proposal`.
- **Exige:** um **timebox** · densidade escala com o peso.
- **Abre→investiga→fecha:** a **investigação É a ferramenta em uso** → **prova o ponto** → fecha em `exploration-answer` (ex-`spike-answer`).
- **3 destinos da saída (decidido 2026-06-25):** o eixo é **"tem casa / priorizado agora?"** → (1) **jogável** → morre (PR sem merge; aprendizado → answer); (2) **durável com casa** → promove pro home (ex.: `_templates/`); (3) **valioso sem casa** → **parqueado na pasta da exploration** + uma **`proposal`** aponta pro **backlog** (descongela quando priorizado). O **`exploration-answer`** indexa tudo.
- **Leva a outro?** pode **levar a** `delivery`/`experiment`/`fix`, ou **nada** (descartado).
- **Único:** o único de **PURO aprendizado**; **nasce em qualquer lugar** e **serve qualquer entrega** — por isso **ferramenta, não tipo**.

![exploration (ex-spike) — os 3 destinos da saída (jogável→morre · com casa→promove · valioso sem casa→parqueado + proposal)](../assets/spike-output-fates.svg)

**`proposal`** — _a ferramenta que captura ideias/problemas durante o trabalho_

> **🟢 Decidido (owner 2026-06-25):** `proposal` **não é um tipo de trabalho** — é uma **ferramenta** (como o
> `insight` já é) usada **durante** o trabalho pra capturar uma ideia/problema que você **não pode parar** ou
> **não tem autoridade** pra resolver, num **registry dedicado** que alimenta o backlog. Muda a ADR 0010 (execução depois).

- **Entrega:** registra uma **ideia ou problema** pra não se perder — ainda **sem ciclo formal**.
- **De onde surge:** **qualquer lugar** — percebido durante outro trabalho (delivery/experiment/exploration/patch) e
  aberto **em paralelo** sem travar, ou registrado standalone (ideia de backlog). _(o "trabalho" inclui a ferramenta `exploration`.)_
- **Não percorre o fluxo:** é uma ideia **parada**, esperando triagem — não investiga/decide/executa por si.
- **Triagem (anti-buraco-negro):** status (open/promoted/dismissed) · dono · **disposição obrigatória**
  (promove ou descarta com motivo). Reusa o **padrão** do `insight` (separado dele).
- **Vira outro?** **qualquer tipo** (delivery/experiment/fix/patch) ou **descartado**. Se precisa investigar antes → vira uma `exploration`.
- **Densidade:** **leve por natureza** — não é trabalho ainda, é ideia parada; o peso só aparece **ao promover**
  (no tipo que vira). Leve **porque é pré-trabalho**, não por regra estrutural.
- **Alimenta o backlog:** versão de **1ª classe e unificada** do que hoje está espalhado em `NEXT.md`,
  `insights`/PIT e o artefato `gap` → `roadmap/backlog.md` (ver 🔴 conectar tudo isso).
- **Único:** é o **intake** do sistema; alimenta tudo **promovendo**.

### Lente 2 · O ciclo de vida (momentos pelos quais o trabalho passa)

> 🔴 obrigatório (o framework **reclamaria** se faltar) · 🟡 opcional (apoia, nunca trava) · ✦ **coração** · `nomes` = documento · _itálico_ = ação.

| tipo           | abrir                 | investigar/decidir ✦                | executar   | entregar            | acompanhar               |
| -------------- | --------------------- | ----------------------------------- | ---------- | ------------------- | ------------------------ |
| **delivery**   | 🔴 `delivery-brief`   | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_          | 🟡 _verificar_           |
| **experiment** | 🔴 `experiment-brief` | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_          | 🔴 `experiment-outcome`  |
| **incident**   | 🔴 `incident-brief`   | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge (bypass)_ | 🔴 `incident-postmortem` |
| **fix**        | 🔴 `fix-brief`        | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_          | 🟡 _verificar_           |
| **patch**      | 🔴 `patch-brief`      | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_          | 🟡 _verificar_           |

_(As **ferramentas** (Lente 4) **não** estão na tabela — alimentam o trabalho, não percorrem o ciclo DELE: `proposal` é intake (parado); `exploration` é **executada** e tem **seu próprio ciclo** (abre→investiga→`answer`), descrito na Lente 1. **Sumiu a categoria ⚪ "pula"** — ela só existia por causa da exploration, e mostra o quanto ela era diferente dos trabalhos.)_

> _fazer_ (`executar`, 🔴 sempre): produzir o que realiza o intent — **ação, não documento**. Geralmente **código**; pode ser **doc** (ex.: `exploration` de análise, patch de documentação), **config**, **dados/migração** ou **infra** — depende do tipo + instância.
>
> _merge_ (`entregar`, 🔴 sempre): **todos** os 5 trabalhos merjam a saída; o `incident` merja com **bypass-com-prazo**. _(A ferramenta `exploration` também fecha mergeando o `exploration-answer` + duráveis — só o PoC jogável morre sem merge; ver os 3 destinos na Lente 1.)_

> ✦ **Coração do framework** = `question` → `research` → `decision` (a família **DELIBERAÇÃO**, Lente 4): 🟡 (opcional, sem lint) **mas é onde está o valor** — pular é permitido e você ainda entrega, mas **abre mão dos benefícios** (rastro de decisão, apoio ao julgamento, grafo de raciocínio). O framework **sinaliza o trade-off**, não o esconde.
>
> ✅ **Lente 2 fechada** (decididos na Parte 3) — **REFINADA 2026-06-27:** a `exploration` (ex-spike) saiu da tabela (é ferramenta) e a categoria ⚪ "pula" foi **removida** (só existia por ela). ⚠️ O SVG `../assets/work-types-lifecycle-paths.svg` precisa ser **regenerado** (5 linhas, sem ⚪).

### Lente 3 · As ligações entre trabalhos (o grafo)

A lista de ligações está **fechada: 10 arestas, cada uma com 1 critério único** — elas **conectam as famílias da Lente 4** (grafo completo em [`../assets/lente3-edge-graph.svg`](../assets/lente3-edge-graph.svg)):

| Aresta                        | Categoria    | Critério (o teste único)                                        |
| ----------------------------- | ------------ | --------------------------------------------------------------- |
| `breaks-into`                 | estrutura    | intent/entrega → suas PARTES                                    |
| `derives-from` ⟷ `results-in` | proveniência | B se baseia na SAÍDA de A (consumido × persiste = status do NÓ) |
| `raises`                      | proveniência | trabalho levanta um `proposal`                                  |
| `blocked-by` ⟷ `blocks`       | dependência  | espera um TRABALHO concreto concluir                            |
| `depends-on`                  | dependência  | depende de PLATAFORMA/VERSÃO/build                              |
| `coordinates-with`            | dependência  | compartilham um CONTRATO (simétrica)                            |
| `resolves`                    | investigação | `exploration-answer` FECHA uma `question`                       |
| `supported-by`                | investigação | `decision` se apoia na sua EVIDÊNCIA                            |
| `closed-by`                   | fecho        | trabalho → seu ARTEFATO DE FECHO (answer/outcome/postmortem)    |
| `supersedes`                  | histórico    | `decision` nova substitui a antiga                              |

**Casa de cada aresta — qual DOCUMENTO a ancora** (regra: anota-se **1 lado**, o reverso é **derivado**; **docs de CONTEÚDO — briefs, artefatos de fecho e a cadeia q/r/d (`question`/`research`/`decision`) — não carregam aresta**: quem ancora é o ÍNDICE/MAPA (`registry` · `deliberation.yml`) ou a ESTRUTURA (`intent` · `proposal`)):

| Documento                             | Ancora (anota 1 lado)                                                           | Derivadas (deduz o reverso)          | Nota                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **registry** (work)                   | `blocked-by` · `depends-on` · `coordinates-with` · `derives-from` · `closed-by` | `blocks` · `results-in` · `raises`   | `coordinates-with` é simétrica; `closed-by`/`coordinates-with` são por-kind (ver abaixo)  |
| **exploration** (registry)            | `derives-from` · `closed-by`                                                    | `results-in` · `raises` · `resolves` | **sem agendamento** — um bloqueio que ela acha **vira a RESPOSTA** (conteúdo), não aresta |
| **intent** (`intent.yml`)             | `breaks-into` · `resolves`                                                      | —                                    | `breaks-into` = vista agrupada por status; `resolves` em `open-question.exploration`      |
| **proposal** (`proposal.yml`)         | `raises` (via `raised-by`)                                                      | —                                    | intake; o `raises` do work/exploration é o derivado                                       |
| **deliberation** (`deliberation.yml`) | `supported-by` · `supersedes`                                                   | —                                    | só o MAPA carrega aresta; `question`/`research`/`decision` = conteúdo                     |

**Por-kind — as arestas do work NÃO são universais** (confirmado ao tirar a antiga spike):

- **`closed-by`** → só quem tem **fecho denso**: `experiment` (→ outcome) · `incident` (→ postmortem). `delivery` fecha no **gate** (sem doc); `fix`/`patch` só "done". _(a `exploration` também tem, → answer.)_
- **`coordinates-with`** → principalmente `delivery`/`experiment` (contratos cross-repo); reativos (`incident`/`fix`/`patch`) **raramente**.
- **`blocked-by`/`depends-on`/`derives-from`/`results-in`** → **opcionais a todos os 5** (incident é reativo/urgente → raramente espera).
- _(a lista por-kind dessas diferenças mora no `registry-entry.yml`, junto dos campos próprios de cada kind.)_

Exemplos vivos **não ficam aqui** — moram em `_templates/`, `_archive/repo-simulation-v1/` e `../assets/` (diagramas).

**Cross-repo + camada `intent` (modelo maduro — detalhe na Parte 3 e em [`2026-06-26-cross-repo-feature-graph.md`](2026-06-26-cross-repo-feature-graph.md)):** as arestas cross-repo (`coordinates-with`/`depends-on`) vivem **nas entregas** e resolvem em **contratos** (`coordinates-with` = compartilhar um contrato · `depends-on` = esperar um build/versão). **Acima** dos trabalhos há a camada **`intent`** (objetivo durável) que **`breaks-into`** N trabalhos e se **retroalimenta** via `resolves` + `breaks-into`. Intent **multi-repo** → **registry cross-repo** (plano autorado + banco derivado → dashboard).

### Lente 4 · As famílias de artefatos (a convergência do sistema)

> Acima dos tipos (Lente 1): **3 famílias** de artefatos — é o que começa a **cravar o sistema**.

| Família         | Membros                                                      | O que é                                               | Arquivos próprios                                                                                                                      |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **TRABALHO**    | `delivery` · `experiment` · `incident` · `fix` · `patch` (5) | entrega **valor de PRODUTO**                          | `registry` (índice) + `brief` (abertura) + `closing` (fecho)                                                                           |
| **FERRAMENTAS** | `proposal` · `exploration` _(ex-`spike`)_                    | instrumentos do **ciclo todo**; **servem** o trabalho | `proposal`: só `registry` (intake, não executado) · `exploration`: `registry`+`brief`+`closing` (executada → valor de **aprendizado**) |
| **DELIBERAÇÃO** | `question` · `research` · `decision`                         | o **raciocínio** (q→r→d, o ✦ coração da Lente 2)      | os 3 + um **mapa VIVO** (hoje `decision-brief` → renomear **`deliberation.yml`**; ≈ `state` — lista de questions com status + cursor)  |

**Transversais** (não são família — ligam tudo): **`intent`** (o objetivo, acima do trabalho) · **`state`** (cursor/topologia) · os **`registries`** (índices derivados).

**Os FECHOS** (`exploration-answer` · `experiment-outcome` · `incident-postmortem`) **não são uma 4ª família** — são a **face de CONTEÚDO DE FECHO** de trabalho & exploration, **espelho do `brief`** (abertura ↔ fecho); vivem em `closings/`. Papel especial: são a **ponte** onde a execução **vira conhecimento** que alimenta a deliberação (`answer` → responde uma `question` · `outcome` → vira `decision` won/lost · `postmortem` → vira aprendizado).

**Decidido (owner 2026-06-27):** ✅ `spike` → **`exploration`** · ✅ **fecho = face** (não 4ª família, confirmado). · 🔴 **`deliberation` × `state`:** validar se o `deliberation` (o mapa vivo) **substitui** o `state` na nova modelagem — vai ficando claro **aos poucos na SIMULAÇÃO**. · ✅ **Propagação do rename** `spike`→`exploration` — **feita** nos arquivos (templates + `_org-simulation` + prosa do tracker); falta só os **SVGs** (redraw).

### Lente 5 · As CAMADAS: governança (grafo de registries) × conteúdo

> Insight owner 2026-06-27. As lentes 1-4 falam de tipos/ciclo/arestas/famílias; esta separa **CAMADAS** — e **subsome a rodada dos bancos** (🔴🔥).

A **governança** é um **grafo de REGISTRIES** — o que uma **app/form de intents** criaria/salvaria (num **banco** OU em **arquivos** do repo: backend **plugável**, do dev solo à escala). Os registries: **`intent`** · **work-registries** · **`exploration`-registry** · **`proposal`** · **`deliberation`-map**. Eles **só se comunicam com outros registries** (as arestas da Lente 3) → formam o **board/dashboard** consultável.

O **CONTEÚDO** (briefs · closings/answers · texto do q/r/d) **vive à parte**, **referenciado** pelos registries — é o que se lê ao **abrir** um nó, não o que o grafo **consulta**.

| Camada         | O que é                                         | Onde mora                    | Quem cria                                     |
| -------------- | ----------------------------------------------- | ---------------------------- | --------------------------------------------- |
| **GOVERNANÇA** | grafo de registries (índice + arestas + estado) | banco OU arquivos (plugável) | a app/form (modelamos só **o que ela salva**) |
| **CONTEÚDO**   | briefs · answers · texto do q/r/d               | arquivos (no repo/workspace) | a pessoa, ao **abrir** o nó                   |

**Em aberto (na simulação v2):** quanto a `intent` **embute** (resumo de governança auto-contido) × **referencia** (conteúdo na deliberation/works) — exercitado com **2 variantes** (robusta × enxuta).

---

## Parte 2 — Perguntas em ABERTO (🔴) — o que falta decidir

> _Resolvidos saíram daqui — a decisão vive na **Parte 3** / **Lente 4**: Lente 2 e Lente 3 fechadas · modalidade (`spike`/`proposal` = ferramentas; `spike`→`exploration`) · os ⚠️ de templates (`status` · `severity` · exploration-verdict · vocabulário q/r/d)._

**Deliberação (q/r/d) — a modelagem precisa ser VIVA** _(🔴 owner 2026-06-27)_

- 🔴 **Status de question = VIVO, não binário (sim/não):** um `decision-brief` com buckets `resolved`/`open` **não resolve**. Precisa de uma **LISTA de questions, cada uma com seu status próprio**. Reabrir uma question fechada = **criar um NÓ NOVO** (append-only + `supersedes`), nunca virar o status de volta. O grafo de deliberação **evolui** (nós novos); nada se reescreve.
- 🔴 **MÉTODO = SIMULAÇÃO, não dogfood:** modelar a NOSSA deliberação (dogfood) **confunde** o registro do nosso trabalho com a estrutura do framework. Testa-se num **caso fictício** (estilo `_org-simulation`/`acme-*`). _(o `_dogfood` foi removido por isso.)_
- 🔴 **`deliberation` × `state`:** validar se o **mapa vivo `deliberation.yml`** (lista de questions + cursor) **substitui** o `state` na nova modelagem — fica claro **na simulação**.

**Convergência (Lente 4) — propagação do rename** _(owner 2026-06-27)_

- ✅ **`spike` → `exploration` FEITO nos arquivos:** templates (`exploration-brief`/`exploration-answer` renomeados; `registry-entry` per-kind) + `_org-simulation` (registries, works, ids `exploration-301/302`) + a prosa da Parte 3. _(históricos/benchmark/spec-governance mantêm "spike" — registro fiel.)_
- 🔴 **Falta — os SVGs (precisam de REDRAW, não sed):** `spike-output-fates.svg` (renomear → `exploration-output-fates.svg` + relabel) · `lente3-edge-graph.svg` (relabel `spike-answer`→`exploration-answer`) · `work-types-lifecycle-paths.svg` (**regenerar**: 5 linhas, sem ⚪).

**Frentes de fundo (trabalhos próprios — não desta rodada)**

- 🔴 **`incident` — frente dedicada (owner 2026-06-25, com exemplo real):** desenhar (1) o **template simples/interativo** de registro; (2) o **destravamento com PRAZO** (prioridade de merge + bypass de CI que **expira** → apaga incêndio sem débito, `GG-0005`); (3) o **alerta** que garante o postmortem no prazo; (4) o postmortem **leve** o bastante pra ser feito. Princípio: **blameless** (o oposto do medo).
- 🔴 **Conectar `proposal` ↔ backlog ↔ histórico** (owner 2026-06-25) — a entrada de ideias hoje está **espalhada**: `NEXT.md` (débitos/escopo por-spec), `insights`/PIT (percepções), o artefato `gap` (candidato a backlog) e o `roadmap/backlog.md` (canônico). O `proposal` parece ser a **entrada unificada** que alimenta o backlog → vira trabalho → `history`. Como amarrar tudo? **Backlogs externos = 2ª iteração** (não agora).
- 🔴🔥 **Banco(s) — RODADA DEDICADA de system design (owner 2026-06-26):** o `active-work.aggregate` atual (intent **+** works num arquivo só) **não é sustentável**. Desenhar: **(a)** **separar** os bancos — um só de **intents**, um só de **works**; **(b)** um **banco de `proposals`** dedicado no meta-repo de governança (intake ≠ trabalho); **(c)** o modelo de **grafos que se comunicam** (grafo por repo + grafo de governança → bancos **derivados**) que escale de verdade — 1 arquivo agregado não escala; **(d)** identidade cross-repo + a proveniência (`derives-from`/`results-in`/`raises`, **1-N**) que alimenta dashboards de valor. _(o banco atual é **provisório** até esta rodada.)_

---

## Parte 3 — Já DECIDIDO (🟢) — não reabrir

**Tipos**

- 🟢 `spec` → `delivery` (o nome muda).
- 🟢 MECE é **por intenção de saída** (não por tamanho/tecnologia).
- 🟢 **Promoção polimórfica:** proposta vira **qualquer tipo**; `experiment` won → `delivery`. _(recência vence a ADR antiga.)_
- 🟢 **Tipos de TRABALHO = 5** (delivery/experiment/incident/fix/patch); **`proposal` e `exploration` = FERRAMENTAS, NÃO tipos** (proposal como o `insight`; `spike` movido p/ ferramenta em 2026-06-27 — ver **Lente 4**). _(muda a ADR 0010 — execução depois.)_
- 🟢 **Dense × Virtual caiu** — densidade (pasta/registro próprio) é **por instância** (escala com o peso); só os **campos exigidos** (hipótese/métricas, severidade) são por tipo.
- 🟢 **`fix` vs `patch`** = o usuário **vê** (fix) ou **não vê** (patch).
- 🟢 **`delivery` vs `experiment` = HIPÓTESE:** delivery = capacidade **já decidida** (comprometida); experiment = **hipótese a testar** (aprender; won/lost). A remoção é **probabilidade** (experiment provavelmente removido se perde; delivery _pode_, mas não é o core) — **não** é a linha. _(won > lost é saudável em growth; won→delivery reaproveita código com flexibilidade.)_ **Destinos do resultado:** won → `delivery` · lost → `patch` (clean-up) · inconclusive → polimórfico (`exploration` / novo `experiment` / `patch`).
- 🟢 Explorar **por tipo**, não em "5 classes".
- 🟢 **Os tipos são MECE** (varridos um a um): cada um é uma intenção distinta. As zonas cinza (fix↔patch, fix↔incident, delivery↔experiment, exploration↔experiment) ficam **com a pessoa** — o framework não auto-classifica.
- 🟢 **`incident` = reativo + blameless** — registro rápido **destrava merge/CI com prazo** (sem débito) + **alerta** garante o postmortem (leve). _(detalhe na frente dedicada.)_
- 🟢 **Saída do `exploration` = 3 destinos** (eixo: _tem casa / priorizado agora?_): **jogável**→morre · **durável-com-casa**→promove pro home · **valioso-sem-casa**→**parqueado na pasta do exploration + `proposal`** aponta pro backlog. `exploration-answer` indexa. _(diagrama: `../assets/spike-output-fates.svg`; conecta a frente proposal↔backlog.)_
- 🟢 **Abertura = moldes `<kind>-brief.yml`** (5 trabalho + as ferramentas, 1 por tipo), **todos com o mesmo node de abertura** (o `node` deixa de ser `intent-brief` — ver camada `intent` abaixo), **forma sob medida** por kind (ajuda automação + "percebo se errei o tipo"). `incident` separa **abertura** (`incident-brief`) × **fechamento** (`incident-postmortem`). `registry/<kind>.yml` = **índice** (não abertura). _(materializado em `_templates/` + `registry/<kind>.yml`; **base v0 aprovada 2026-06-25 — conteúdo ainda será refinado**.)_
- 🟢 **Camada `intent` acima dos trabalhos — 3 níveis:** **intake** (`proposal`/`insight`) → **`intent`** (objetivo durável) → **trabalho** (5 tipos; `spike`/`proposal` = ferramentas, Lente 4), cada um com seu `<kind>-brief`. Uma `intent` **dispara N trabalhos de tipos variados** ao longo do tempo e **se retroalimenta** com o que eles aprendem (ex.: intent → `spike` → [retroalimenta] → `experiment` → [retroalimenta] → `delivery`). É o **coração (q→r→d) no nível do objetivo**. **Emergente/por instância:** num trabalho trivial a `intent` **colapsa** no próprio trabalho. A **feature cross-repo** é um caso de `intent` (multi-repo). _(o que era "intent-brief" era só o `<kind>-brief`; "intent" volta pra camada de cima.)_
- 🟢 **A `intent` materializa quando há COORDENAÇÃO** (≥2 trabalhos/devs); colapsa no trabalho quando é solo/trivial — o **gatilho** da camada é a necessidade de coordenar. **Seu valor: declarar os contratos upfront** (api · eventos · componentes) → os devs trabalham **contra os contratos**, em **paralelo**, antes das implementações (**cross-repo resolve em contratos**). Dá **previsibilidade** (caminho crítico); se um contrato é **incerto**, a intent **dispara um exploration** pra resolvê-lo **antes** das deliveries. _(estresse 3-devs: `../assets/feature-3devs-parallelization.svg`.)_
- 🟢 **Retroalimentação SEM aresta nova:** o resultado de um trabalho (ex.: `exploration-answer`) **`resolves`** uma `question`/contrato que a `intent` segura; a intent então **`breaks-into`** o próximo trabalho. A `intent` é a **dona do coração (q→r→d) no nível do objetivo** (carrega as questions/decisions cross-trabalho). Contrato **conhecido** → declara no t0; **incerto** → `exploration` resolve antes de paralelizar.
- 🟢 **Intents vivem na camada de GOVERNANÇA GLOBAL** (por **org / unidade de negócio**), não nos repos: **todas** (single _e_ multi repo) → habilita **cross-referência · padrões · SDD/DDD consistente**. Não briga com "repo vence" (a intent é **governança**, não trabalho; os trabalhos seguem **SSOT no repo** com back-ref `intent: <id>`); o **banco** = agregado **derivado** de todos.
- 🟢 **Governança é CONTRATO-first, backend PLUGÁVEL** (um framework não escolhe a forma — abraça o espectro): a **forma da intent** (objetivo·contratos·toques·back-ref) + **publicar** + **banco=derivado** são **invariantes**; o **backend** tem **knobs INDEPENDENTES** (não uma escada amarrada ao tamanho): _onde as intents moram_ · _como o banco é computado_ · _dashboard_ · _escopo_ — **qualquer combinação vale** (dev solo pode meta-repo + dashboard). Crescer = **trocar um knob, sem re-modelar**. _(diagrama: `../assets/governance-backend-knobs.svg`; exemplos de combinação no `2026-06-26-cross-repo-feature-graph.md`.)_
- 🟢 **`intent` é OPCIONAL/emergente** (benchmark: Jira · Linear · Azure DevOps · SAFe · Shape Up — todos deixam tarefa/bug **standalone**; pai opcional; reativo é **lane separada**): os tipos **reativos** (`incident`/`fix`/`patch`) ficam **sem intent** por padrão e vivem no **banco**; `delivery`/`experiment`/`exploration` rumo a objetivo ficam **sob uma intent**; um trabalho pode ser **adotado** depois. A visibilidade de _tudo_ = o **banco** (= o board). _(benchmark: `2026-06-26-benchmark-intent-vs-standalone-work.md`.)_
- 🟢 **Framework é TOOL-PLUGÁVEL** (facilita adoção): o modelo **mapeia** aos conceitos da indústria — `intent` ≈ epic/initiative/bet · `work` ≈ story/task/bug · `banco` ≈ board. Isso habilita **adapters** (sync/integração com Jira/Linear/Azure/…); times adotam **incremental** (mantêm a ferramenta deles + a camada de governança). É o "contrato-first" estendido pra **integração**, não só storage. _(construir adapters = frente futura.)_
- 🟢 **Forma da `intent` = arquivo `.yml` (dado estruturado) + 1 campo livre `details` (block scalar `|`, opcional).** Provou-se que quase tudo é dado → voltou de `.md`+tags pra **`.yml` puro**. Campos: `node`·`id`·`title`·`status` (`active|paused|done|dropped`)·`sealed`·`created-at`·`closed-at` (só terminal)·`objective` (`goal`/`success-signal`/`out-of-scope`)·`references` (`{type,label,url,note}`)·`target-repos`·`open-questions` (`{id,question,exploration,unlocks}`)·`contracts` (`known`/`pending-exploration`)·`breaks-into`·`details`. **Aprendizado NÃO é campo:** são as `open-questions` respondidas (o `exploration-answer`, no arquivo do exploration, **consumível por grafo**) + `unlocks` ligando a resposta ao `breaks-into`; o per-trabalho mora no arquivo do kind. `status` separa **`paused`** (repriorização, retomável) de **`dropped`** (descarte por decisão) — `abandoned` era ruim. _(`references` nasceu do gap da modelagem-por-produto.)_
- 🟢 **Escopo (BU/time) = ESTRUTURA DE PASTAS na governança, não campo na intent.** A intent não carrega `scope`; a BU/time dona É a **localização** (`acme-governance/business-units/<bu>/teams/<time>/intents/…`); org-wide fica em `intents/`; **solo = pasta única, sem partição**. _(README do `_org-simulation/acme-governance` explica os casos.)_
- 🟢 **Os 6 `<kind>-brief` adotaram a forma `.yml` da intent** (1ª passada): dados estruturados + `objective` (goal/approach/success-signal/done-when) + `details: |` (prosa opcional) + back-ref **`intent:`** (opcional; reativo = vazio) + `references`. Estruturado-mas-escalar sobe pro topo (exploration `timebox`; incident `severity`/`status`/datas de bypass). _(refino detalhado por kind = em curso: o `delivery-brief` **enxugou redundâncias** — `non-goals`→`out-of-scope`; `success-signal`/`acceptance`→`done-when`.)_
- 🟢 **Registries: `registry-entry.yml` (raiz de `_templates/`) é a base canônica — crie `<kind>.yml` a partir dele.** delivery/fix/patch/incident/experiment/**exploration** **não têm template próprio** (o base documenta os extras por kind — incident → severity/status/bypass; experiment → `closed-by`; **exploration → `fate`**; demais → nenhum). Só **`proposal`** (não é work, intake) tem template próprio. **Arestas no base, AGRUPADAS** (bloqueio: `blocked-by`/`blocks` · cross-repo: `depends-on`/`coordinates-with` · proveniência: `derives-from`/`results-in`); **`spawned-by` fundido em `derives-from`** ("de onde veio" — POC de exploration, proposal promovido, trabalho anterior). **REGRA DURA: registry = índice + arestas; CONTEÚDO (textos: question/verdict/timebox/recomendação) mora no brief/answer** — essa regra **dissolveu a divergência do exploration** (o que parecia template próprio era conteúdo vazando pro índice; a base ganhou `intent` + `closed-at` gerais). _(proveniência fechada na Lente 3.)_
- 🟢 **Spike: abertura → fecho, densidade por instância + intent auto-contida.** Abre **leve** (só a entrada no registry) ou **denso** (workspace + `exploration-brief`, p/ POC). Fecha com **`fate`** (`throwaway`|`promoted`|`parked`) + `closed-at` no **registry**; o **`verdict`** (resposta 1 linha) é **conteúdo** → mora no `exploration-answer` (denso) ou na intent. **Consistência intent↔exploration:** a `open-question.question` da intent é **idêntica** à `question` do **`exploration-brief`** (o índice usa `title`, não `question`); p/ **exploration simples** (sem brief) a intent É a casa: carrega a `question` + o **`verdict-inline`**. `resolves`/`raises` são **derivados** (lado intent/proposal), não guardados. Retroalimentação: exploration `done` → preenche `unlocks` (na open-question) + move contrato `pending-exploration`→`known`; os works destravados entram no `breaks-into` quando criados.
- 🟢 **Spike promovido NÃO se deleta — a POC persiste e é absorvida.** Em `fate: promoted`, a saída durável (POC/achado) fica no **workspace do exploration** (`works/exploration_<slug>/poc/`); o trabalho que a productiza referencia via **`derives-from: <repo>/<exploration-id>`**. Um exploration promove pra **`delivery` · `fix` · `patch`** (saídas de código) — **não** pra `experiment` (decisão de negócio). _(`parked` = fica no workspace + `proposal`; `throwaway` = só o código jogável morre, e depois de capturar a resposta.)_
- 🟢 **Experiment = DECISÃO DELIBERADA, podendo nascer em qualquer trabalho (benchmark robusto).** A ideia pode surgir em qualquer lugar — inclusive **durante** um `delivery`/`exploration`, que **surfa** a oportunidade (não auto-promove). Dois caminhos: **(recomendado) diferido** — salva num **`proposal`** → backlog → abre uma **intent própria** (às vezes paralela) [= o _experiment backlog_ ICE/RICE da indústria]; **(permitido, raro) inline** — adiciona à intent atual mesmo nascida pra delivery [= o bottom-up de Spotify/Netflix]. Em ambos: **rigor** (`experiment-brief` `sealed`, hipótese+métricas pré-registradas) e **escolha** (não é todo trabalho; bug óbvio = só conserta). O exploration **não vira** experiment sozinho. _(benchmark: `2026-06-26-benchmark-experiment-origins.md`.)_

**Ciclo de vida**

- 🟢 É um **grafo de estados**, não uma tabela.
- 🟢 **Pausa é derivada** (não é um status guardado).
- 🟢 **`status` = progresso PRÓPRIO do trabalho** (`draft | active | done`). **"Bloqueado" é DERIVADO** (de `blocked-by` + o status dos bloqueadores), igual à pausa — **não** é status guardado nem 6º estado. Logo, uma delivery com `blocked-by` pendente fica **`draft`** (planejada, não iniciada), não `active`. _(kinds reativos têm status próprio à parte: incident `mitigating/mitigated/resolved`; proposal `open/promoted/dismissed`.)_
- 🟢 **A intent mostra o PLANO num lugar só:** o `breaks-into` é uma **vista derivada** dos works, **agrupada por status** (`done`/`active`/`draft`); as `draft` carregam o `blocked-by` que explica o bloqueio. Assim a intent revela **estado + caminho crítico** sem abrir cada work (a fonte continua sendo os works → não viola "anotar uma vez"). Espelha o padrão das `open-questions` (objetos com `verdict-inline`/`unlocks`).
- 🟢 **Fechamento em 2 eixos:** o resultado (o que aconteceu) × a autoridade (o gate humano).
- 🟢 Retomada pelo **cursor** (onde paramos).
- 🟢 **`investigar` + `decidir` = um momento (`investigar/decidir`)** — 5 momentos: abrir → investigar/decidir → executar → entregar → acompanhar. Os artefatos (`question`/`research`/`decision`) seguem distintos **dentro** dele.
- 🟢 **Coração do framework = `question`→`research`→`decision`** — 🟡 (opcional, **sem lint**) **mas é onde está o valor**; pular é permitido (ainda entrega) e **abre mão dos benefícios** (rastro de decisão, apoio, grafo de raciocínio) — o framework **sinaliza o trade-off**, não esconde.
- 🟢 **Cor = enforcement:** 🔴 = reclamaria se faltar · 🟡 = apoia, nunca trava. `investigar/decidir` é 🟡 pra **todos**. _(a antiga ⚪ "pula" saiu com a `exploration` da tabela do ciclo — ver Lente 2.)_
- 🟢 **`acompanhar` é momento real** (pós-merge): **🔴** no `experiment` (`experiment-outcome`, won/lost) e no `incident` (`incident-postmortem`, garantido pelo alerta) · **🟡** no delivery/fix/patch (verificar valor). **Fecha o `stage`** (os 5 momentos mapeiam em deciding/executing). _(a `exploration` é ferramenta — fecha na própria resposta, fora desta tabela; ver Lente 1.)_

**Ligações**

- 🟢 A **lista de ligações já existe** (conjunto fechado) + `coordinates-with`/`depends-on` (entre repos).
- 🟢 **Anotar uma vez** (o sentido contrário o sistema deduz).
- 🟢 **Bloqueio = 2 arestas (`registry-entry`, 1-N):** `blocked-by` (espera um **trabalho** concreto concluir — bloqueio na quebra de tarefas) × `depends-on` (depende de **plataforma/versão/build**); `blocks` = reverso derivado de `blocked-by`. Resolve os "2 sabores de `depends-on`".
- 🟢 **Lente 3 FECHADA — 10 arestas, cada uma com critério ÚNICO** (humano e IA classificam sem confundir): estrutura (`breaks-into`) · proveniência (`derives-from`⟷`results-in`, `raises`) · dependência (`blocked-by`/`blocks`, `depends-on`, `coordinates-with`) · investigação (`resolves`, `supported-by`) · fecho (`closed-by`) · histórico (`supersedes`). **Renomeios:** `grounded-by`→`supported-by` · `verdicted-by`→`closed-by` (genérico: answer/outcome/postmortem) · `promotes-to`→`results-in`. **Fundidos/removidos:** `spawned-by`+`from-spike`→`derives-from`; `promoted-to` saiu (os works declaram `derives-from`; o exploration só marca `fate: promoted`). **Princípio: o dado fica no NÓ, não na aresta.** _(grafo: `../assets/lente3-edge-graph.svg`.)_
- 🟢 As **partes** (decisão, checkpoint) **contam como nós**.
- 🟢 O **fecho** de um trabalho tem ligação (`closed-by` — answer/outcome/postmortem); a **origem** da ideia também (`raises`).
- 🟢 **Proveniência = `derives-from` ⟷ `results-in`** (mesma aresta, 2 direções). `A results-in B` **CRIA o alvo B** por padrão (herda o contexto); **salvo** quando aponta pra um nó **que já existe**. **`consumido × persiste`** (proposal vira / exploration permanece) = **status do NÓ**, não da aresta — por isso `spawned-by`/`promoted-to`/`from-spike` sumiram.
- 🟢 **`coordinates-with`/`depends-on` ficam NAS ENTREGAS** (P2) — nos trabalhos concretos de cada repo (nós **duráveis**), não na ideia; a ideia só **origina**. Resolvem em **contratos** (coordinates-with = compartilhar um contrato; depends-on = esperar um build/versão). _(exemplos: login multi-repo + 3-devs.)_
- 🟢 **Uma ideia em N repos → N entregas** (P3) — uma `delivery`/trabalho por repo que precisa de trabalho; a **feature** é uma `intent` multi-repo que **`breaks-into`** essas entregas (não um repo dedicado; o **banco** agrega).

---

## Próximo (retomar aqui — pós-compactação)

**Como retomar (pra não me perder):** este é o **único tracker**. 🟢 = decidido (Parte 3, **não reabrir**) · 🔴 =
aberto (Parte 2). Regras: **recência vence** · **conferir o já-decidido antes de desenhar** · **uma pergunta por
vez** · **linguagem simples no chat** · **não re-perguntar o respondido** · **docs externos inspiram, NÃO
definem** (e não se versionam/citam). Modelo vivo, não-autoridade.

**Estado:** ✅ **Lentes 1-3 fechadas; Lente 4 (famílias: trabalho/ferramentas/deliberação) em CONVERGÊNCIA.** Lente 1 (5 tipos de trabalho + `proposal`/`exploration` ferramentas). Lente 2 (5 momentos · coração ✦). **Lente 4 (famílias)** + casa-de-cada-aresta + `deliberation.yml` ancora arestas. **Lente 3 = 10 arestas, cada uma com critério único** (estrutura · proveniência · dependência · investigação · fecho · histórico); renomeios `grounded-by`→`supported-by` · `verdicted-by`→`closed-by` · `promotes-to`→`results-in`; `spawned-by`/`from-spike`/`promoted-to` fundidos/derivados; **princípio: o dado fica no NÓ, não na aresta** (grafo: `../assets/lente3-edge-graph.svg`). **Camada `intent`** na governança global por **org/BU = PASTAS** (sem campo `scope`); a intent é **`.yml`** (`objective`/`references`/`open-questions`/`contracts`/`breaks-into`/`details`); o **`breaks-into` = vista agrupada por status** (`done`/`active`/`draft`, as draft com `blocked-by`). **Registries:** `registry-entry.yml` (raiz de `_templates/`) = base canônica; só `proposal` tem template próprio. **Status** = progresso PRÓPRIO (`draft|active|done`); **bloqueado/pausado = DERIVADO**. **Experiment** = decisão deliberada (benchmark), via `proposal`→intent dedicada (recomendado) ou inline.

**Aberto (Parte 2):** a **rodada de system design dos bancos** (🔴🔥, frente dedicada). _(fechados: `severity` do incident → enums EN; vocabulário q/r/d → PT por design.)_

**Frentes de fundo (trabalhos próprios, não desta rodada):** `incident` dedicada (template + bypass-com-prazo + alerta + postmortem) · conectar `proposal`↔backlog↔history · **adapters** (Jira/Linear/Azure — adoção incremental) · **banco(s): rodada dedicada de system design** (separar intents/works · banco de proposals na governança · grafos comunicantes · identidade cross-repo + dashboards) · o **experiment do proativo** (via `prop-001` → intent dedicada) · **completar as deliveries do login** (`draft`→`active`→`done` conforme destravam).

**Contexto (artefatos):** `_templates/` (reorganizado: raiz `intent.yml`·`registry-entry.yml`·`proposal.yml`·`state.yml`; pastas `briefs/`·`closings/`·`deliberation/`) · `../assets/` (diagramas, incl. **`lente3-edge-graph.svg`**) · research: `2026-06-26-cross-repo-feature-graph.md` · `2026-06-26-benchmark-intent-vs-standalone-work.md` · `2026-06-26-benchmark-experiment-origins.md` · `2026-06-27-benchmark-explorations-discovery-modality.md` · **`_org-simulation/`** (7 repos + meta-repo `acme-governance`: intents `.yml`, banco, pastas-de-BU; **`intent-004` login TOTALMENTE quebrado** — 2 explorations `done` + 5 deliveries [2 `active`, 3 `draft`/bloqueadas]; `prop-001` levantada do `exploration-302`; arestas/status consolidados) · `_archive/repo-simulation-v1/` · `2026-06-24-decided-g25-work-flow-model.md` (D1–D9) · `2026-06-24-governed-work-flow-model.md` (§5 ligações).

---

Âncoras: `_archive/repo-simulation-v1/` · decisões em `2026-06-24-decided-g25-work-flow-model.md`, `2026-06-24-governed-work-flow-model.md` (§5 ligações), ADR 0010 (tipos).
