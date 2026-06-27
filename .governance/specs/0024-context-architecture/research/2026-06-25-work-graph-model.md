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

## Parte 1 — O modelo, em 3 lentes (referência)

### Lente 1 · Os 6 tipos de trabalho (+ `proposal` como ferramenta)

O que separa um tipo do outro é a **intenção de saída** — _o que o autor quer que aconteça no mundo ao concluir
o item_ (não tamanho/tecnologia/estágio).

> **🟢 Decidido (owner 2026-06-25):** são **6 tipos de trabalho** — `delivery` · `experiment` · `spike` ·
> `incident` · `fix` · `patch` (coisas que você **faz**). O **`proposal` saiu dos tipos**: é uma **ferramenta de
> intake** (no fim da lente). **E o Dense × Virtual caiu:** a **densidade** (pasta/registro próprio) **escala com
> o peso de CADA instância**, não é fixa por tipo — qualquer tipo vai de "1 linha" a "registro próprio". Só os
> **campos exigidos** (hipótese/métricas no experiment; severidade no incident) são por tipo (parte da intenção).

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
- **Abre→investiga→fecha:** `experiment-brief` que **sela a hipótese** → discovery (questions/research; pode disparar spikes) → gate no merge — **mas o resultado vem depois**.
- **Resultado depois?** **SIM** — roda um período → **won / lost / inconclusivo**. _(Em growth, **lost > won é
  saudável** — taxa de sucesso alta demais = só ideias óbvias, pouco risco.)_
- **Vira outro?** **won → delivery** (sistematiza), com **flexibilidade**: hoje (com IA) **reaproveita-se bem mais
  o código testado** do que antes (quando won = refatorar muito). `lost` → clean-up; `inconclusivo` → itera.
- **Único:** o **único cujo valor só se conhece depois do merge**, e que se **espera perder com frequência**.

**`spike`** — _provar um ponto antes de entregar valor_

- **Entrega:** **prova/responde um ponto** (técnico ou de modelagem) por investigação — parecido com o que
  fazemos _aqui_ agora, mas **intra-spec**.
- **De onde surge:** **amplo** — pode ser **standalone** (uma tarefa gera um spike só pra validar algo / fazer
  uma POC), ou nascer dentro de um `delivery`/`experiment`, ou de uma `proposal`.
- **Exige:** um **timebox** · densidade escala com o peso.
- **Abre→investiga→fecha:** a **investigação É o trabalho** (pode gerar código jogável) → **prova o ponto**.
- **Resultado depois?** não.
- **Como fechar (a explorar):** registrar o fechamento **sem dar merge** no código testado — ex.: um **PR de
  investigação fechado sem merge** que só **registra as descobertas** (pra ninguém re-investigar o mesmo ponto;
  e dar base a uma análise futura). O conhecimento vai pro **repo**, não some num PR deletável.
- **Vira outro?** **provavelmente, mas nem sempre** — pode concluir que algo **não funciona** e o código ser
  **descartado**. Quando dá certo, pode sair um `delivery`/`experiment`/`fix` (a explorar).
- **Único:** prova um ponto **antes** de entregar valor; pode **nascer em qualquer lugar** e **levar a qualquer entrega**.

> **Quando o spike gera conteúdo — 3 destinos (decidido 2026-06-25):** o eixo **não** é "durável × jogável", é **"tem casa / priorizado agora?"** → (1) **jogável** → morre (PR sem merge; aprendizado → answer); (2) **durável com casa** → promove pro home (ex.: `_templates/`), answer indexa; (3) **valioso mas sem casa** → **parqueado na pasta do spike** (o valor **não se rascunha**) + uma **`proposal`** (leve) aponta pro **backlog** → quando priorizado, promove (descongela). O **`spike-answer`** é o índice de tudo. _(conecta a frente `proposal`↔backlog.)_

![Spike — os 3 destinos da saída (jogável→morre · com casa→promove · valioso sem casa→parqueado + proposal)](../assets/spike-output-fates.svg)

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
- **Tamanho:** **varia** — de 1 linha a algo que precisa de **investigação** (um spike) ou que **cresce e vira
  `delivery`**. ⚠️ Pode **merecer registro próprio**, não só uma linha — **subestimamos o fix** (owner 2026-06-25).
- **Exige:** nada · **densidade escala com o peso** (de 1 linha a registro próprio).
- **Abre→fecha:** registro (leve _ou_ próprio) → commit → verifica.
- **Único:** o discriminador vs `patch` é **"o usuário vê"**; o **tamanho não** define o tipo.

**`patch`** — _manutenção invisível ao usuário_

- **Entrega:** manutenção **que o usuário NÃO vê** (deps, lint, refactor transparente, segurança).
- **De onde surge:** **diverso** (igual ao fix) — necessidade de manutenção (bump de dep, lint, security);
  **dívida técnica percebida durante** outro trabalho (`delivery`/`experiment`); de uma `proposal`. Standalone ou atrelado.
- **Tamanho:** **varia** — de um bump de 1 linha a um **refactor grande / migração arriscada** que precisa de
  **investigação** (spike) ou que **cresce e vira `delivery`** (a zona cinza "refactor que passa a mudar capacidade").
  Pode **merecer registro próprio**.
- **Exige:** nada (sem hipótese/severidade — não é experiment nem incident) · **densidade escala com o peso**.
  ⚠️ "não ter hipótese/severidade" **≠** "não ter registro".
- **Abre→fecha:** registro (leve _ou_ próprio) → commit → verifica.
- **Único:** o que o separa do `fix` é **só a visibilidade** (o usuário **não** vê); o tamanho não define o tipo.
  Quando o "refactor transparente" **passa a mudar capacidade**, deixa de ser patch → vira `delivery`.

---

**Fora dos 6 tipos — a ferramenta de intake:**

**`proposal`** — _a ferramenta que captura ideias/problemas durante o trabalho_

> **🟢 Decidido (owner 2026-06-25):** `proposal` **não é um tipo de trabalho** — é uma **ferramenta** (como o
> `insight` já é) usada **durante** o trabalho pra capturar uma ideia/problema que você **não pode parar** ou
> **não tem autoridade** pra resolver, num **registry dedicado** que alimenta o backlog. Muda a ADR 0010 (execução depois).

- **Entrega:** registra uma **ideia ou problema** pra não se perder — ainda **sem ciclo formal**.
- **De onde surge:** **qualquer lugar** — percebido durante outro trabalho (delivery/experiment/spike/patch) e
  aberto **em paralelo** sem travar, ou registrado standalone (ideia de backlog).
- **Não percorre o fluxo:** é uma ideia **parada**, esperando triagem — não investiga/decide/executa por si.
- **Triagem (anti-buraco-negro):** status (open/promoted/dismissed) · dono · **disposição obrigatória**
  (promove ou descarta com motivo). Reusa o **padrão** do `insight` (separado dele).
- **Vira outro?** **qualquer tipo** (delivery/experiment/spike/patch/fix) ou **descartado**. Se precisa investigar antes → vira `spike`.
- **Densidade:** **leve por natureza** — não é trabalho ainda, é ideia parada; o peso só aparece **ao promover**
  (no tipo que vira). Leve **porque é pré-trabalho**, não por regra estrutural.
- **Alimenta o backlog:** versão de **1ª classe e unificada** do que hoje está espalhado em `NEXT.md`,
  `insights`/PIT e o artefato `gap` → `roadmap/backlog.md` (ver 🔴 conectar tudo isso).
- **Único:** é o **intake** do sistema; alimenta tudo **promovendo**.

### Lente 2 · O ciclo de vida (momentos pelos quais o trabalho passa)

> 🔴 obrigatório (o framework **reclamaria** se faltar) · 🟡 opcional (apoia, nunca trava) · ⚪ pula · ✦ **coração** · `nomes` = documento · _itálico_ = ação.

| tipo           | abrir                 | investigar/decidir ✦                | executar   | entregar                    | acompanhar               |
| -------------- | --------------------- | ----------------------------------- | ---------- | --------------------------- | ------------------------ |
| **delivery**   | 🔴 `delivery-brief`   | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_                  | 🟡 _verificar_           |
| **experiment** | 🔴 `experiment-brief` | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_                  | 🔴 `experiment-outcome`  |
| **spike**      | 🔴 `spike-brief`      | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge (`spike-answer`)_ | ⚪                       |
| **incident**   | 🔴 `incident-brief`   | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge (bypass)_         | 🔴 `incident-postmortem` |
| **fix**        | 🔴 `fix-brief`        | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_                  | 🟡 _verificar_           |
| **patch**      | 🔴 `patch-brief`      | 🟡 `question`·`research`·`decision` | 🔴 _fazer_ | 🔴 _merge_                  | 🟡 _verificar_           |

_(O `proposal` **não** está aqui — é a ferramenta de intake que **alimenta** esses 6, não percorre o ciclo.)_

> _fazer_ (`executar`, 🔴 sempre): produzir o que realiza o intent — **ação, não documento**. Geralmente **código**; pode ser **doc** (ex.: spike de análise, patch de documentação), **config**, **dados/migração** ou **infra** — depende do tipo + instância.
>
> _merge_ (`entregar`, 🔴 sempre): **todos** merjam a saída — inclusive o `spike` (merja o `spike-answer` + duráveis). O que **não** merja é só o **código-PoC jogável** do spike (morre — ver 3-destinos). O `incident` merja com **bypass-com-prazo**.

> ✦ **Coração do framework** = `question` → `research` → `decision`: 🟡 (opcional, sem lint) **mas é onde está o valor** — pular é permitido e você ainda entrega, mas **abre mão dos benefícios** (rastro de decisão, apoio ao julgamento, grafo de raciocínio). O framework **sinaliza o trade-off**, não o esconde.
>
> ✅ **Lente 2 FECHADA** (decididos na Parte 3). O SVG `../assets/work-types-lifecycle-paths.svg` está **regenerado** desta tabela.

### Lente 3 · As ligações entre trabalhos (o grafo)

A lista de ligações está **fechada: 10 arestas, cada uma com 1 critério único** (grafo completo em [`../assets/lente3-edge-graph.svg`](../assets/lente3-edge-graph.svg)):

| Aresta                        | Categoria    | Critério (o teste único)                                        |
| ----------------------------- | ------------ | --------------------------------------------------------------- |
| `breaks-into`                 | estrutura    | intent/entrega → suas PARTES                                    |
| `derives-from` ⟷ `results-in` | proveniência | B se baseia na SAÍDA de A (consumido × persiste = status do NÓ) |
| `raises`                      | proveniência | trabalho levanta um `proposal`                                  |
| `blocked-by` ⟷ `blocks`       | dependência  | espera um TRABALHO concreto concluir                            |
| `depends-on`                  | dependência  | depende de PLATAFORMA/VERSÃO/build                              |
| `coordinates-with`            | dependência  | compartilham um CONTRATO (simétrica)                            |
| `resolves`                    | investigação | `spike-answer` FECHA uma `question`                             |
| `supported-by`                | investigação | `decision` se apoia na sua EVIDÊNCIA                            |
| `closed-by`                   | fecho        | trabalho → seu ARTEFATO DE FECHO (answer/outcome/postmortem)    |
| `supersedes`                  | histórico    | `decision` nova substitui a antiga                              |

**Casa de cada aresta — qual DOCUMENTO a ancora** (regra: anota-se **1 lado**, o reverso é **derivado**; **docs de CONTEÚDO — briefs e artefatos de fecho — não carregam aresta**: quem referencia é o índice/estrutura):

| Documento                                         | Arestas ancoradas                                                                                         | Observação                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **registry** (índice do work)                     | `blocked-by`/`blocks` · `depends-on` · `coordinates-with` · `derives-from`/`results-in` · **`closed-by`** | trabalho↔trabalho (+ work→plataforma + ref ao artefato de fecho); `blocks`/`results-in` derivados              |
| **intent** (`intent.yml`)                         | `breaks-into` · `resolves`                                                                                | `breaks-into` = vista agrupada; `resolves` ancorado em `open-question.spike` (o work deriva)                   |
| **proposal** (`proposal.yml`)                     | `raises`                                                                                                  | ancorado em `raised-by`; o `raises` do work é derivado                                                         |
| **decision** (`decision.md`)                      | `supported-by` · `supersedes`                                                                             | `decision` **não é work** (não tem registry-entry)                                                             |
| **artefato de fecho** (answer/outcome/postmortem) | _(nenhuma — é só CONTEÚDO)_                                                                               | quem o referencia é o `registry` (via `closed-by`); o doc não carrega aresta (back-ref p/ leitura = gerado/A+) |

Exemplos vivos **não ficam aqui** — moram em `_templates/`, `_archive/repo-simulation-v1/` e `../assets/` (diagramas).

**Cross-repo + camada `intent` (modelo maduro — detalhe na Parte 3 e em [`2026-06-26-cross-repo-feature-graph.md`](2026-06-26-cross-repo-feature-graph.md)):** as arestas cross-repo (`coordinates-with`/`depends-on`) vivem **nas entregas** e resolvem em **contratos** (`coordinates-with` = compartilhar um contrato · `depends-on` = esperar um build/versão). **Acima** dos trabalhos há a camada **`intent`** (objetivo durável) que **`breaks-into`** N trabalhos e se **retroalimenta** via `resolves` + `breaks-into`. Intent **multi-repo** → **registry cross-repo** (plano autorado + banco derivado → dashboard).

---

## Parte 2 — Perguntas em ABERTO (🔴) — o que falta decidir

> _(As que eu tinha listado mas **já estavam respondidas** foram removidas — eram erros meus.)_

> _(A **Lente 2** saiu daqui — está **fechada** na Parte 3.)_

**Lente 3** _(quase fechada — na Parte 3: ligações nas entregas · 1 ideia→N entregas · camada `intent` · governança global · contrato-first/knobs · intent opcional · tool-plugável)_

- ✅ **`depends-on` — RESOLVIDO (os 2 sabores viram 2 arestas):** **`blocked-by`** = espera um **trabalho** concreto concluir (bloqueio na quebra de tarefas) · **`depends-on`** = depende de **plataforma/versão/build** (estável, não-por-tarefa). **`blocks`** = o reverso de `blocked-by` (derivado; basta anotar 1 lado). Vivem no `registry-entry` (1-N). **Lente 3 fechada.**

**Lente 1 — modalidade: `spike`/`proposal` são FERRAMENTAS, não work-items?** _(🔴 em PESQUISA — owner 2026-06-27; benchmark: [`2026-06-27-benchmark-spikes-discovery-modality.md`](2026-06-27-benchmark-spikes-discovery-modality.md))_

- 🔴 **Reframe (owner):** `proposal` e `spike` são **ferramentas disponíveis o ciclo INTEIRO (e antes dele)**, não unidades de entrega → talvez **não sejam work-items**. Separá-los deixa os **work-items = entregas de valor** (com densidades variadas) e as ferramentas **ortogonais**. (`proposal` já saiu como ferramenta de intake; `spike` seria a de **investigação**.)
- 🔴 **Valor do spike (correção da owner):** spike **entrega valor SIM — valor de APRENDIZADO** (não "nenhum valor"); às vezes com **robustez** (POC) ou **gerando templates/base** pro trabalho seguinte (que declara `derives-from`). Muda o **tipo** de valor (produto × aprendizado), não a existência.
- 🔴 **Eixo de modalidade (a fechar):** valor de **produto** (`delivery`·`experiment`·`incident`·`fix`·`patch`) × **ferramentas** (`proposal` intake · `spike`/`discovery` investigação). `experiment` **fica no valor** (no `won` prova valor desde o dia 0 — não é descartável). `spike` é o único de **só aprendizado** → mora **entre** delivery e experiment e **atrela-se a qualquer um**.
- 🔴 **Onde mora a incerteza (3 lares — modelar a flexibilidade):** _upstream_/negócio (shaping, antes de definir a tarefa) · no **limiar** de uma tarefa · **durante** o dev. Só exercitamos o _upstream_ (login); falta o "spike nasce no meio de uma delivery".
- 🔴 **Nome:** "spike" é estreito (sonda XP); cobre spike·POC·pesquisa·benchmark → guarda-chuva candidato **`discovery`**/`exploration`.
- _(tudo isto = **alvo de pesquisa, não definição** — owner. Próximo: workbench + 2ª rodada de benchmark.)_

**Templates (⚠️ pontos a fechar — também marcados nos próprios moldes em `_templates/`)**

> Vários fecham **sozinhos** ao avançarmos nas lentes/frentes; os demais atacamos 1 a 1.

- ✅ **`status` — RESOLVIDO (ver Ciclo de vida):** progresso próprio = `draft | active | done`; **bloqueado/pausado são DERIVADOS** (não status guardados).
- ✅ **`incident.severity` — RESOLVIDO:** **enums controlados em EN** (regra do repo: nomes/enums em inglês, só texto livre em PT). `severity: low|medium|high|critical` (bate com o enum do código); o `status` próprio do incident (separado do LifecycleStatus) também em EN: `mitigating|mitigated|resolved`. Mesmo alinhamento aplicado ao `proposal.status` (`open|promoted|dismissed`).
- ✅ **`spike` verdict — resolvido** (Parte 3): `verdict` (resposta 1 linha) + `fate` (throwaway|promoted|parked) + `closed-at`; spike simples espelha em `verdict-inline` na intent.
- ✅ **Vocabulário q/r/d — RESOLVIDO (decisão: manter PT por design):** os templates `question`/`decision`/`research` usam vocabulário **conceitual** em PT (`mode: escolha|aceitação`, `status: aberta|resolvida`). **A linha:** enums do **work-graph** (severity · status-do-work · kind · fate) = vocabulário de máquina → **EN**; o q→r→d é a **camada de raciocínio humano** (o coração) → PT **por design** — exceção _explícita_, não vazamento. _(o "A+" governa a GERAÇÃO de arestas forward, não a língua dos enums → não bloqueia a escolha.)_
- _(já cobertos por frentes existentes: bypass-com-prazo do incident · intake↔backlog do proposal · PR-sem-merge do spike.)_

**Frentes de fundo (abertas, mas são trabalhos próprios — não desta rodada)**

- ✅ **`spike` fechamento — RESOLVIDO (Parte 3):** `fate` (`throwaway`|`promoted`|`parked`); a POC durável persiste no workspace + `derives-from` absorve; o código jogável morre só **depois** de capturar a resposta. **Demonstrado:** spike → `proposal` (`prop-001`, levantada pelo `spike-302`, `promote-to: experiment`) → **experiment** (abre quando priorizada, em intent dedicada — a **decisão de negócio**).
- 🔴 **`incident` — frente dedicada (owner 2026-06-25, com exemplo real):** desenhar (1) o **template simples/interativo** de registro; (2) o **destravamento com PRAZO** (prioridade de merge + bypass de CI que **expira** → apaga incêndio sem débito, `GG-0005`); (3) o **alerta** que garante o postmortem no prazo; (4) o postmortem **leve** o bastante pra ser feito. Princípio: **blameless** (o oposto do medo).
- 🔴 **Conectar `proposal` ↔ backlog ↔ histórico** (owner 2026-06-25) — a entrada de ideias hoje está **espalhada**: `NEXT.md` (débitos/escopo por-spec), `insights`/PIT (percepções), o artefato `gap` (candidato a backlog) e o `roadmap/backlog.md` (canônico). O `proposal` parece ser a **entrada unificada** que alimenta o backlog → vira trabalho → `history`. Como amarrar tudo? **Backlogs externos = 2ª iteração** (não agora).
- 🔴🔥 **Banco(s) — RODADA DEDICADA de system design (owner 2026-06-26):** o `active-work.aggregate` atual (intent **+** works num arquivo só) **não é sustentável**. Desenhar: **(a)** **separar** os bancos — um só de **intents**, um só de **works**; **(b)** um **banco de `proposals`** dedicado no meta-repo de governança (intake ≠ trabalho); **(c)** o modelo de **grafos que se comunicam** (grafo por repo + grafo de governança → bancos **derivados**) que escale de verdade — 1 arquivo agregado não escala; **(d)** identidade cross-repo + a proveniência (`derives-from`/`results-in`/`raises`, **1-N**) que alimenta dashboards de valor. _(o banco atual é **provisório** até esta rodada.)_

---

## Parte 3 — Já DECIDIDO (🟢) — não reabrir

**Tipos**

- 🟢 `spec` → `delivery` (o nome muda).
- 🟢 MECE é **por intenção de saída** (não por tamanho/tecnologia).
- 🟢 **Promoção polimórfica:** proposta vira **qualquer tipo**; `experiment` won → `delivery`. _(recência vence a ADR antiga.)_
- 🟢 **6 tipos de trabalho** (delivery/experiment/spike/incident/fix/patch); **`proposal` = ferramenta de intake, NÃO um tipo** (como o `insight`). _(muda a ADR 0010 — execução depois.)_
- 🟢 **Dense × Virtual caiu** — densidade (pasta/registro próprio) é **por instância** (escala com o peso); só os **campos exigidos** (hipótese/métricas, severidade) são por tipo.
- 🟢 **`fix` vs `patch`** = o usuário **vê** (fix) ou **não vê** (patch).
- 🟢 **`delivery` vs `experiment` = HIPÓTESE:** delivery = capacidade **já decidida** (comprometida); experiment = **hipótese a testar** (aprender; won/lost). A remoção é **probabilidade** (experiment provavelmente removido se perde; delivery _pode_, mas não é o core) — **não** é a linha. _(won > lost é saudável em growth; won→delivery reaproveita código com flexibilidade.)_ **Destinos do resultado:** won → `delivery` · lost → `patch` (clean-up) · inconclusive → polimórfico (`spike` / novo `experiment` / `patch`).
- 🟢 Explorar **por tipo**, não em "5 classes".
- 🟢 **Os 6 são MECE** (varridos tipo a tipo): cada um é uma intenção distinta. As zonas cinza (fix↔patch, fix↔incident, delivery↔experiment, spike↔experiment) ficam **com a pessoa** — o framework não auto-classifica.
- 🟢 **`incident` = reativo + blameless** — registro rápido **destrava merge/CI com prazo** (sem débito) + **alerta** garante o postmortem (leve). _(detalhe na frente dedicada.)_
- 🟢 **Saída do `spike` = 3 destinos** (eixo: _tem casa / priorizado agora?_): **jogável**→morre · **durável-com-casa**→promove pro home · **valioso-sem-casa**→**parqueado na pasta do spike + `proposal`** aponta pro backlog. `spike-answer` indexa. _(diagrama: `../assets/spike-output-fates.svg`; conecta a frente proposal↔backlog.)_
- 🟢 **Abertura = 6 moldes `<kind>-brief.md`** (1 por tipo), **todos com o mesmo node de abertura** (o `node` deixa de ser `intent-brief` — ver camada `intent` abaixo), **forma sob medida** por kind (ajuda automação + "percebo se errei o tipo"). `incident` separa **abertura** (`incident-brief`) × **fechamento** (`incident-postmortem`). `registry/<kind>.yml` = **índice** (não abertura). _(materializado em `_templates/` + `registry/<kind>.yml`; **base v0 aprovada 2026-06-25 — conteúdo ainda será refinado**.)_
- 🟢 **Camada `intent` acima dos trabalhos — 3 níveis:** **intake** (`proposal`/`insight`) → **`intent`** (objetivo durável) → **trabalho** (6 tipos, cada um com seu `<kind>-brief`). Uma `intent` **dispara N trabalhos de tipos variados** ao longo do tempo e **se retroalimenta** com o que eles aprendem (ex.: intent → `spike` → [retroalimenta] → `experiment` → [retroalimenta] → `delivery`). É o **coração (q→r→d) no nível do objetivo**. **Emergente/por instância:** num trabalho trivial a `intent` **colapsa** no próprio trabalho. A **feature cross-repo** é um caso de `intent` (multi-repo). _(o que era "intent-brief" era só o `<kind>-brief`; "intent" volta pra camada de cima.)_
- 🟢 **A `intent` materializa quando há COORDENAÇÃO** (≥2 trabalhos/devs); colapsa no trabalho quando é solo/trivial — o **gatilho** da camada é a necessidade de coordenar. **Seu valor: declarar os contratos upfront** (api · eventos · componentes) → os devs trabalham **contra os contratos**, em **paralelo**, antes das implementações (**cross-repo resolve em contratos**). Dá **previsibilidade** (caminho crítico); se um contrato é **incerto**, a intent **dispara um spike** pra resolvê-lo **antes** das deliveries. _(estresse 3-devs: `../assets/feature-3devs-parallelization.svg`.)_
- 🟢 **Retroalimentação SEM aresta nova:** o resultado de um trabalho (ex.: `spike-answer`) **`resolves`** uma `question`/contrato que a `intent` segura; a intent então **`breaks-into`** o próximo trabalho. A `intent` é a **dona do coração (q→r→d) no nível do objetivo** (carrega as questions/decisions cross-trabalho). Contrato **conhecido** → declara no t0; **incerto** → `spike` resolve antes de paralelizar.
- 🟢 **Intents vivem na camada de GOVERNANÇA GLOBAL** (por **org / unidade de negócio**), não nos repos: **todas** (single _e_ multi repo) → habilita **cross-referência · padrões · SDD/DDD consistente**. Não briga com "repo vence" (a intent é **governança**, não trabalho; os trabalhos seguem **SSOT no repo** com back-ref `intent: <id>`); o **banco** = agregado **derivado** de todos.
- 🟢 **Governança é CONTRATO-first, backend PLUGÁVEL** (um framework não escolhe a forma — abraça o espectro): a **forma da intent** (objetivo·contratos·toques·back-ref) + **publicar** + **banco=derivado** são **invariantes**; o **backend** tem **knobs INDEPENDENTES** (não uma escada amarrada ao tamanho): _onde as intents moram_ · _como o banco é computado_ · _dashboard_ · _escopo_ — **qualquer combinação vale** (dev solo pode meta-repo + dashboard). Crescer = **trocar um knob, sem re-modelar**. _(diagrama: `../assets/governance-backend-knobs.svg`; exemplos de combinação no `2026-06-26-cross-repo-feature-graph.md`.)_
- 🟢 **`intent` é OPCIONAL/emergente** (benchmark: Jira · Linear · Azure DevOps · SAFe · Shape Up — todos deixam tarefa/bug **standalone**; pai opcional; reativo é **lane separada**): os tipos **reativos** (`incident`/`fix`/`patch`) ficam **sem intent** por padrão e vivem no **banco**; `delivery`/`experiment`/`spike` rumo a objetivo ficam **sob uma intent**; um trabalho pode ser **adotado** depois. A visibilidade de _tudo_ = o **banco** (= o board). _(benchmark: `2026-06-26-benchmark-intent-vs-standalone-work.md`.)_
- 🟢 **Framework é TOOL-PLUGÁVEL** (facilita adoção): o modelo **mapeia** aos conceitos da indústria — `intent` ≈ epic/initiative/bet · `work` ≈ story/task/bug · `banco` ≈ board. Isso habilita **adapters** (sync/integração com Jira/Linear/Azure/…); times adotam **incremental** (mantêm a ferramenta deles + a camada de governança). É o "contrato-first" estendido pra **integração**, não só storage. _(construir adapters = frente futura.)_
- 🟢 **Forma da `intent` = arquivo `.yml` (dado estruturado) + 1 campo livre `details` (block scalar `|`, opcional).** Provou-se que quase tudo é dado → voltou de `.md`+tags pra **`.yml` puro**. Campos: `node`·`id`·`title`·`status` (`active|paused|done|dropped`)·`sealed`·`created-at`·`closed-at` (só terminal)·`objective` (`goal`/`success-signal`/`out-of-scope`)·`references` (`{type,label,url,note}`)·`target-repos`·`open-questions` (`{id,question,spike,unlocks}`)·`contracts` (`known`/`pending-spike`)·`breaks-into`·`details`. **Aprendizado NÃO é campo:** são as `open-questions` respondidas (o `spike-answer`, no arquivo do spike, **consumível por grafo**) + `unlocks` ligando a resposta ao `breaks-into`; o per-trabalho mora no arquivo do kind. `status` separa **`paused`** (repriorização, retomável) de **`dropped`** (descarte por decisão) — `abandoned` era ruim. _(`references` nasceu do gap da modelagem-por-produto.)_
- 🟢 **Escopo (BU/time) = ESTRUTURA DE PASTAS na governança, não campo na intent.** A intent não carrega `scope`; a BU/time dona É a **localização** (`acme-governance/business-units/<bu>/teams/<time>/intents/…`); org-wide fica em `intents/`; **solo = pasta única, sem partição**. _(README do `_org-simulation/acme-governance` explica os casos.)_
- 🟢 **Os 6 `<kind>-brief` adotaram a forma `.yml` da intent** (1ª passada): dados estruturados + `objective` (goal/approach/success-signal/done-when) + `details: |` (prosa opcional) + back-ref **`intent:`** (opcional; reativo = vazio) + `references`. Estruturado-mas-escalar sobe pro topo (spike `timebox`; incident `severity`/`status`/datas de bypass). _(refino detalhado por kind = em curso: o `delivery-brief` **enxugou redundâncias** — `non-goals`→`out-of-scope`; `success-signal`/`acceptance`→`done-when`.)_
- 🟢 **Registries: `registry/registry-entry.yml` é a base canônica — crie `<kind>.yml` a partir dele.** delivery/fix/patch/incident/experiment/**spike** **não têm template próprio** (o base documenta os extras por kind — incident → severity/status/bypass; experiment → `closed-by`; **spike → `fate`**; demais → nenhum). Só **`proposal`** (não é work, intake) tem template próprio. **Arestas no base, AGRUPADAS** (bloqueio: `blocked-by`/`blocks` · cross-repo: `depends-on`/`coordinates-with` · proveniência: `derives-from`/`results-in`); **`spawned-by` fundido em `derives-from`** ("de onde veio" — POC de spike, proposal promovido, trabalho anterior). **REGRA DURA: registry = índice + arestas; CONTEÚDO (textos: question/verdict/timebox/recomendação) mora no brief/answer** — essa regra **dissolveu a divergência do spike** (o que parecia template próprio era conteúdo vazando pro índice; a base ganhou `intent` + `closed-at` gerais). _(proveniência fechada na Lente 3.)_
- 🟢 **Spike: abertura → fecho, densidade por instância + intent auto-contida.** Abre **leve** (só a entrada no registry) ou **denso** (workspace + `spike-brief`, p/ POC). Fecha com **`fate`** (`throwaway`|`promoted`|`parked`) + `closed-at` no **registry**; o **`verdict`** (resposta 1 linha) é **conteúdo** → mora no `spike-answer` (denso) ou na intent. **Consistência intent↔spike:** a `open-question.question` da intent é **idêntica** à `question` do **`spike-brief`** (o índice usa `title`, não `question`); p/ **spike simples** (sem brief) a intent É a casa: carrega a `question` + o **`verdict-inline`**. `resolves`/`raises` são **derivados** (lado intent/proposal), não guardados. Retroalimentação: spike `done` → preenche `unlocks` (na open-question) + move contrato `pending-spike`→`known`; os works destravados entram no `breaks-into` quando criados.
- 🟢 **Spike promovido NÃO se deleta — a POC persiste e é absorvida.** Em `fate: promoted`, a saída durável (POC/achado) fica no **workspace do spike** (`works/spike_<slug>/poc/`); o trabalho que a productiza referencia via **`derives-from: <repo>/<spike-id>`**. Um spike promove pra **`delivery` · `fix` · `patch`** (saídas de código) — **não** pra `experiment` (decisão de negócio). _(`parked` = fica no workspace + `proposal`; `throwaway` = só o código jogável morre, e depois de capturar a resposta.)_
- 🟢 **Experiment = DECISÃO DELIBERADA, podendo nascer em qualquer trabalho (benchmark robusto).** A ideia pode surgir em qualquer lugar — inclusive **durante** um `delivery`/`spike`, que **surfa** a oportunidade (não auto-promove). Dois caminhos: **(recomendado) diferido** — salva num **`proposal`** → backlog → abre uma **intent própria** (às vezes paralela) [= o _experiment backlog_ ICE/RICE da indústria]; **(permitido, raro) inline** — adiciona à intent atual mesmo nascida pra delivery [= o bottom-up de Spotify/Netflix]. Em ambos: **rigor** (`experiment-brief` `sealed`, hipótese+métricas pré-registradas) e **escolha** (não é todo trabalho; bug óbvio = só conserta). O spike **não vira** experiment sozinho. _(benchmark: `2026-06-26-benchmark-experiment-origins.md`.)_

**Ciclo de vida**

- 🟢 É um **grafo de estados**, não uma tabela.
- 🟢 **Pausa é derivada** (não é um status guardado).
- 🟢 **`status` = progresso PRÓPRIO do trabalho** (`draft | active | done`). **"Bloqueado" é DERIVADO** (de `blocked-by` + o status dos bloqueadores), igual à pausa — **não** é status guardado nem 6º estado. Logo, uma delivery com `blocked-by` pendente fica **`draft`** (planejada, não iniciada), não `active`. _(kinds reativos têm status próprio à parte: incident `mitigating/mitigated/resolved`; proposal `open/promoted/dismissed`.)_
- 🟢 **A intent mostra o PLANO num lugar só:** o `breaks-into` é uma **vista derivada** dos works, **agrupada por status** (`done`/`active`/`draft`); as `draft` carregam o `blocked-by` que explica o bloqueio. Assim a intent revela **estado + caminho crítico** sem abrir cada work (a fonte continua sendo os works → não viola "anotar uma vez"). Espelha o padrão das `open-questions` (objetos com `verdict-inline`/`unlocks`).
- 🟢 **Fechamento em 2 eixos:** o resultado (o que aconteceu) × a autoridade (o gate humano).
- 🟢 Retomada pelo **cursor** (onde paramos).
- 🟢 **`investigar` + `decidir` = um momento (`investigar/decidir`)** — 5 momentos: abrir → investigar/decidir → executar → entregar → acompanhar. Os artefatos (`question`/`research`/`decision`) seguem distintos **dentro** dele.
- 🟢 **Coração do framework = `question`→`research`→`decision`** — 🟡 (opcional, **sem lint**) **mas é onde está o valor**; pular é permitido (ainda entrega) e **abre mão dos benefícios** (rastro de decisão, apoio, grafo de raciocínio) — o framework **sinaliza o trade-off**, não esconde.
- 🟢 **Cor = enforcement:** 🔴 = reclamaria se faltar · 🟡 = apoia, nunca trava · ⚪ = pula. (`investigar/decidir` é 🟡 pra **todos**; `spike` **não** é método de investigação — é tipo → vira relação.)
- 🟢 **`acompanhar` é momento real** (pós-merge): **🔴** no `experiment` (`experiment-outcome`, won/lost) e no `incident` (`incident-postmortem`, garantido pelo alerta) · **🟡** no delivery/fix/patch (verificar valor) · **⚪** no `spike` (**terminal** — a resposta já é o desfecho; o futuro do que ele gerou vive na `proposal`/arestas). **Fecha o `stage`** (os 5 momentos mapeiam em deciding/executing).

**Ligações**

- 🟢 A **lista de ligações já existe** (conjunto fechado) + `coordinates-with`/`depends-on` (entre repos).
- 🟢 **Anotar uma vez** (o sentido contrário o sistema deduz).
- 🟢 **Bloqueio = 2 arestas (`registry-entry`, 1-N):** `blocked-by` (espera um **trabalho** concreto concluir — bloqueio na quebra de tarefas) × `depends-on` (depende de **plataforma/versão/build**); `blocks` = reverso derivado de `blocked-by`. Resolve os "2 sabores de `depends-on`".
- 🟢 **Lente 3 FECHADA — 10 arestas, cada uma com critério ÚNICO** (humano e IA classificam sem confundir): estrutura (`breaks-into`) · proveniência (`derives-from`⟷`results-in`, `raises`) · dependência (`blocked-by`/`blocks`, `depends-on`, `coordinates-with`) · investigação (`resolves`, `supported-by`) · fecho (`closed-by`) · histórico (`supersedes`). **Renomeios:** `grounded-by`→`supported-by` · `verdicted-by`→`closed-by` (genérico: answer/outcome/postmortem) · `promotes-to`→`results-in`. **Fundidos/removidos:** `spawned-by`+`from-spike`→`derives-from`; `promoted-to` saiu (os works declaram `derives-from`; o spike só marca `fate: promoted`). **Princípio: o dado fica no NÓ, não na aresta.** _(grafo: `../assets/lente3-edge-graph.svg`.)_
- 🟢 As **partes** (decisão, checkpoint) **contam como nós**.
- 🟢 O **fecho** de um trabalho tem ligação (`closed-by` — answer/outcome/postmortem); a **origem** da ideia também (`raises`).
- 🟢 **Proveniência = `derives-from` ⟷ `results-in`** (mesma aresta, 2 direções). `A results-in B` **CRIA o alvo B** por padrão (herda o contexto); **salvo** quando aponta pra um nó **que já existe**. **`consumido × persiste`** (proposal vira / spike permanece) = **status do NÓ**, não da aresta — por isso `spawned-by`/`promoted-to`/`from-spike` sumiram.
- 🟢 **`coordinates-with`/`depends-on` ficam NAS ENTREGAS** (P2) — nos trabalhos concretos de cada repo (nós **duráveis**), não na ideia; a ideia só **origina**. Resolvem em **contratos** (coordinates-with = compartilhar um contrato; depends-on = esperar um build/versão). _(exemplos: login multi-repo + 3-devs.)_
- 🟢 **Uma ideia em N repos → N entregas** (P3) — uma `delivery`/trabalho por repo que precisa de trabalho; a **feature** é uma `intent` multi-repo que **`breaks-into`** essas entregas (não um repo dedicado; o **banco** agrega).

---

## Próximo (retomar aqui — pós-compactação)

**Como retomar (pra não me perder):** este é o **único tracker**. 🟢 = decidido (Parte 3, **não reabrir**) · 🔴 =
aberto (Parte 2). Regras: **recência vence** · **conferir o já-decidido antes de desenhar** · **uma pergunta por
vez** · **linguagem simples no chat** · **não re-perguntar o respondido** · **docs externos inspiram, NÃO
definem** (e não se versionam/citam). Modelo vivo, não-autoridade.

**Estado:** ✅ **Lentes 1, 2 e 3 FECHADAS.** Lente 1 (6 tipos MECE + `proposal`-ferramenta). Lente 2 (5 momentos · coração ✦). **Lente 3 = 10 arestas, cada uma com critério único** (estrutura · proveniência · dependência · investigação · fecho · histórico); renomeios `grounded-by`→`supported-by` · `verdicted-by`→`closed-by` · `promotes-to`→`results-in`; `spawned-by`/`from-spike`/`promoted-to` fundidos/derivados; **princípio: o dado fica no NÓ, não na aresta** (grafo: `../assets/lente3-edge-graph.svg`). **Camada `intent`** na governança global por **org/BU = PASTAS** (sem campo `scope`); a intent é **`.yml`** (`objective`/`references`/`open-questions`/`contracts`/`breaks-into`/`details`); o **`breaks-into` = vista agrupada por status** (`done`/`active`/`draft`, as draft com `blocked-by`). **Registries:** `registry/registry-entry.yml` = base canônica; só `spike`/`proposal` têm template próprio. **Status** = progresso PRÓPRIO (`draft|active|done`); **bloqueado/pausado = DERIVADO**. **Experiment** = decisão deliberada (benchmark), via `proposal`→intent dedicada (recomendado) ou inline.

**Aberto (Parte 2):** a **rodada de system design dos bancos** (🔴🔥, frente dedicada). _(fechados: `severity` do incident → enums EN; vocabulário q/r/d → PT por design.)_

**Frentes de fundo (trabalhos próprios, não desta rodada):** `incident` dedicada (template + bypass-com-prazo + alerta + postmortem) · conectar `proposal`↔backlog↔history · **adapters** (Jira/Linear/Azure — adoção incremental) · **banco(s): rodada dedicada de system design** (separar intents/works · banco de proposals na governança · grafos comunicantes · identidade cross-repo + dashboards) · o **experiment do proativo** (via `prop-001` → intent dedicada) · **completar as deliveries do login** (`draft`→`active`→`done` conforme destravam).

**Contexto (artefatos):** `_templates/` (`intent.yml` + 6 `<kind>-brief.yml` + `registry/registry-entry.yml`·`spike.yml`·`proposal.yml` + fechos) · `../assets/` (diagramas, incl. **`lente3-edge-graph.svg`**) · research: `2026-06-26-cross-repo-feature-graph.md` · `2026-06-26-benchmark-intent-vs-standalone-work.md` · `2026-06-26-benchmark-experiment-origins.md` · **`_org-simulation/`** (7 repos + meta-repo `acme-governance`: intents `.yml`, banco, pastas-de-BU; **`intent-004` login TOTALMENTE quebrado** — 2 spikes `done` + 5 deliveries [2 `active`, 3 `draft`/bloqueadas]; `prop-001` levantada do `spike-302`; arestas/status consolidados) · `_archive/repo-simulation-v1/` · `2026-06-24-decided-g25-work-flow-model.md` (D1–D9) · `2026-06-24-governed-work-flow-model.md` (§5 ligações).

---

Âncoras: `_archive/repo-simulation-v1/` · decisões em `2026-06-24-decided-g25-work-flow-model.md`, `2026-06-24-governed-work-flow-model.md` (§5 ligações), ADR 0010 (tipos).
