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
- **Abre→investiga→fecha:** intent **selado** → questions/research (se houver pergunta aberta) → **gate** (a prova é o próprio merge).
- **Resultado depois?** opcional — verificar se a entrega moveu o valor.
- **Vira outro?** não — é **destino** (proposta e experimento-won viram delivery).
- **Único:** o trabalho "padrão"; o valor está na capacidade entregue.

**`experiment`** — _validar uma aposta de valor_

- **Entrega:** **valida uma hipótese** de valor, com métrica.
- **Exige:** **hipótese + métricas** (por tipo) · densidade escala com o peso.
- **Abre→investiga→fecha:** intent que **sela a hipótese** → discovery (questions/research; pode disparar spikes) → gate no merge — **mas...**
- **Resultado depois?** **SIM** — roda um período → **won / lost / inconclusivo**.
- **Vira outro?** **won → delivery** (sistematiza); lost → remove o código; inconclusivo → itera.
- **Único:** o **único cujo valor só se conhece depois do merge** — não acaba ao entregar.

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

**`incident`** — _conter um problema grave_

- **Entrega:** **contém e documenta** uma fricção grave, com severidade.
- **Exige:** **severidade** (por tipo) · densidade escala com o peso.
- **Abre→investiga→fecha:** **inverte a ordem** — corrige primeiro (urgência) e mergeia → **documenta depois** (postmortem vivo).
- **Resultado depois?** **SIM** — o postmortem (causa-raiz + prevenção) é o peso.
- **Vira outro?** não — mas pode **gerar um fix** de follow-up.
- **Único:** reativo; a abertura **não** é selada antes; o valor está na **prevenção**.

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
- **Triagem (anti-buraco-negro):** status (aberta/promovida/descartada) · dono · **disposição obrigatória**
  (promove ou descarta com motivo). Reusa o **padrão** do `insight` (separado dele).
- **Vira outro?** **qualquer tipo** (delivery/experiment/spike/patch/fix) ou **descartado**. Se precisa investigar antes → vira `spike`.
- **Densidade:** **leve por natureza** — não é trabalho ainda, é ideia parada; o peso só aparece **ao promover**
  (no tipo que vira). Leve **porque é pré-trabalho**, não por regra estrutural.
- **Alimenta o backlog:** versão de **1ª classe e unificada** do que hoje está espalhado em `NEXT.md`,
  `insights`/PIT e o artefato `gap` → `roadmap/backlog.md` (ver 🔴 conectar tudo isso).
- **Único:** é o **intake** do sistema; alimenta tudo **promovendo**.

### Lente 2 · O ciclo de vida (momentos pelos quais o trabalho passa)

```
abrir → investigar → decidir → executar → entregar(merge) → acompanhar
 flow (delivery/experiment): passa por todos; no fim, acompanha (resultado/valor)
 spike:     abre → investiga (= o trabalho) → entrega a RESPOSTA
 incident:  pula tudo (urgência) → merge → postmortem (o peso fica aqui)
 patch/fix: abre → commit → verifica
```

_(O `proposal` **não** está aqui — é a ferramenta de intake que **alimenta** esses 6, não percorre o ciclo.)_

### Lente 3 · As ligações entre trabalhos (o grafo)

A lista de ligações **já está decidida** (conjunto fechado) — em palavras simples:

| Ligação            | Quer dizer                   | Exemplo                    |
| ------------------ | ---------------------------- | -------------------------- |
| `promotes-to`      | "vira"                       | proposta **vira** entrega  |
| `resolves`         | "destrava"                   | spike **destrava** decisão |
| `grounded-by`      | "se apoia em"                | decisão ← spike            |
| `verdicted-by`     | "tem como resultado"         | experiment ← resultado     |
| `raises`           | "levanta"                    | tarefa **levanta** ideia   |
| `breaks-into`      | "se quebra em"               | entrega → checkpoints      |
| `supersedes`       | "substitui"                  | decisão nova ← antiga      |
| `coordinates-with` | "andam juntas" (entre repos) | api ↔ web                  |
| `depends-on`       | "espera" (entre repos)       | tela **espera** a api      |

Exemplos vivos **não ficam aqui** — templates e exemplos moram em `_templates/` e `_repo-simulation/`.

---

## Parte 2 — Perguntas em ABERTO (🔴) — o que falta decidir

> _(As que eu tinha listado mas **já estavam respondidas** foram removidas — eram erros meus.)_

**Lente 1**

- 🔴 **Os 6 são mesmo MECE?** (já varremos quase todos; falta expor o `incident`). Cada trabalho cai em **um só**
  e juntos cobrem **toda** intenção de saída?
  - 🟢 já confirmados distintos: `experiment` × `spike` (níveis diferentes) · `fix` × `patch` (o usuário vê / não vê).
  - 🔴 falta: `delivery` × `experiment`, e expor o `incident`.

**Lente 2**

- 🔴 Os **6 momentos** (abrir/investigar/decidir/executar/entregar/acompanhar) são os certos?
- 🔴 **"Acompanhar"** (depois de entregar) é um momento **de verdade**, ou só "ainda não acabou"?

**Lente 3**

- 🔴 Quando algo **"vira" outro**, esse outro **já existe** ou **é criado na hora**?
- 🔴 A ligação **"andam juntas"** fica nas **entregas** (não na ideia/proposta)?
- 🔴 Uma ideia que mexe em **2 repos** vira **2 entregas** (uma por repo)?

**Frentes de fundo (abertas, mas são trabalhos próprios — não desta rodada)**

- 🔴 **Fechar `experiment` (resultado) vs `spike` (resposta)** — moldes separados. No `spike`: **como registrar
  o fechamento sem merge do código testado** (ex.: PR de investigação fechado sem merge, que só registra as
  descobertas no repo).
- 🔴 **`incident`** como frente dedicada (corrige antes, documenta depois).
- 🔴 **Conectar `proposal` ↔ backlog ↔ histórico** (owner 2026-06-25) — a entrada de ideias hoje está
  **espalhada**: `NEXT.md` (débitos/escopo por-spec), `insights`/PIT (percepções), o artefato `gap` (candidato a
  backlog) e o `roadmap/backlog.md` (canônico). O `proposal` parece ser a **entrada unificada** que alimenta o
  backlog → vira trabalho → `history`. Como amarrar tudo? **Backlogs externos = 2ª iteração** (não agora).
- 🔴 **Identidade entre repos + banco + dashboards de valor** — fundacional/futuro.

---

## Parte 3 — Já DECIDIDO (🟢) — não reabrir

**Tipos**

- 🟢 `spec` → `delivery` (o nome muda).
- 🟢 MECE é **por intenção de saída** (não por tamanho/tecnologia).
- 🟢 **Promoção polimórfica:** proposta vira **qualquer tipo**; `experiment` won → `delivery`. _(recência vence a ADR antiga.)_
- 🟢 **6 tipos de trabalho** (delivery/experiment/spike/incident/fix/patch); **`proposal` = ferramenta de intake,
  NÃO um tipo** (como o `insight`). _(muda a ADR 0010 — execução depois.)_
- 🟢 **Dense × Virtual caiu** — densidade (pasta/registro próprio) é **por instância** (escala com o peso); só os
  **campos exigidos** (hipótese/métricas, severidade) são por tipo.
- 🟢 **`fix` vs `patch`** = o usuário **vê** (fix) ou **não vê** (patch).
- 🟢 Explorar **por tipo**, não em "5 classes".

**Ciclo de vida**

- 🟢 É um **grafo de estados**, não uma tabela.
- 🟢 **Pausa é derivada** (não é um status guardado).
- 🟢 **Fechamento em 2 eixos:** o resultado (o que aconteceu) × a autoridade (o gate humano).
- 🟢 Retomada pelo **cursor** (onde paramos).

**Ligações**

- 🟢 A **lista de ligações já existe** (conjunto fechado) + `coordinates-with`/`depends-on` (entre repos).
- 🟢 **Anotar uma vez** (o sentido contrário o sistema deduz).
- 🟢 As **partes** (decisão, checkpoint) **contam como nós**.
- 🟢 O **resultado** do experiment já tem ligação (`verdicted-by`); a **origem** da ideia também (`raises`).

---

## Próximo (retomar aqui — pós-compactação)

**Como retomar (pra não me perder):** este é o **único tracker**. 🟢 = decidido (Parte 3, **não reabrir**) · 🔴 =
aberto (Parte 2). **Recência vence** · **conferir o já-decidido antes de desenhar** (não re-perguntar o
respondido; não tomar docs externos como verdade — eles inspiram, **não definem**). Modelo vivo, não-autoridade.

**Aprofundar na volta (owner 2026-06-25):**

1. **`delivery` × `experiment`** — fechar o MECE; e **expor o `incident`** (ficou pendente).
2. **Como o backlog se alimenta:** **interno** (a ferramenta `proposal`) **× externo** (outros backlogs/
   ferramentas — 2ª iteração).
3. **Backlog → `intent`:** como um item priorizado **sai do backlog e vira um `intent`** (a abertura de um trabalho).

**Contexto (outros artefatos):** `_repo-simulation/` (2 repos, 6 tipos, índice derivado) · `_templates/` ·
`2026-06-24-decided-g25-work-flow-model.md` (D1–D9) · `2026-06-24-governed-work-flow-model.md` (§5 ligações).

---

Âncoras: simulação `_repo-simulation/` · decisões em `2026-06-24-decided-g25-work-flow-model.md`,
`2026-06-24-governed-work-flow-model.md` (§5 ligações), ADR 0010 (tipos).
