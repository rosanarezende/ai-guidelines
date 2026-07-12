---
artifact-kind: research
subject: "substituto de spec.md — artefato de inicio-de-trabalho polimorfico (intent-brief) atravessando os 7 MECE"
date: 2026-06-24
---

# Research — `intent-brief`: o artefato de início-de-trabalho que substitui `spec.md`

> **Natureza:** `research` (authority: none). **Não-autoridade**, não é DEC, não adota
> nada, não move nem cria pasta. Captura a iteração owner↔Claude para **não perder o
> raciocínio** (`GG-0005`) e dar insumo à futura **DEC-0024-G25**. Em divergência vencem
> `state.yml`, `tasks.md`, `decision-brief.md`, `reviews/`+`gates/`, Git/GitHub.
> Lifecycle correto: **esta research → DEC → execução** (template + check + migração).

## Por que existe (qual lacuna fecha)

Fecha o **O4** do design review de pastas (`2026-06-24-artifact-taxonomy-and-folder-model-review.md`):

> _"`spec.md`/`plan.md`: viés de spec-kit. O que (e em que formato) o humano registra
> para iniciar um trabalho?"_

O nome **`spec`** carrega uma ontologia (requisito-a-satisfazer, herança IEEE-830/RUP via
spec-kit) que **não serve aos 7 pilares MECE** (`spec`, `experiment`, `spike`, `incident`,
`proposal`, `patch`, `fix` — ADR 0010). Um `experiment` não tem "requisitos"; tem hipótese
e métricas. Um `incident` tem severidade e linha do tempo. Um `spike` tem uma pergunta e um
timebox. Forçar tudo num molde de "spec" é o viés que esta research desfaz.

## 1. Descoberta central (o "além do óbvio")

Cruzando 6 famílias de documento de início-de-trabalho da indústria, **nenhuma cobre
nativamente todos os tipos de trabalho**. O padrão maduro é outro:

> **Existe uma espinha invariante que sobrevive a TODOS os tipos — e ela NÃO é
> "requisitos". É `problema → resultado desejado → como saberemos`. O que muda por tipo
> de trabalho é só o _corpo_ (a lente).**

Convergência dos benchmarks (todos dizem o mesmo com nomes diferentes):

| Benchmark (público)                  | Problema/contexto       | Resultado desejado       | Limite/escopo         | Abordagem               | Como saberemos       |
| ------------------------------------ | ----------------------- | ------------------------ | --------------------- | ----------------------- | -------------------- |
| Amazon PR/FAQ                        | press release p/cliente | outcome **é o ponto 0**  | FAQ delimita          | "how it works"          | métricas no FAQ      |
| Shape Up Pitch                       | Problem (junto da sol.) | (implícito no problema)  | **Appetite + No-gos** | Solution sketch         | Rabbit holes         |
| RFC / Design Doc (Google, Oxide RFD) | Context                 | **Goals**                | **Non-goals**         | Proposal + Alternatives | Risks                |
| Strategyzer Test Card                | "We believe that…"      | "We are right if…"       | 1 hipótese crítica    | "To verify, we will…"   | "And measure…"       |
| Charter (PMBOK/PRINCE2)              | justificativa           | **goals (why+what)**     | scope                 | —                       | critérios de sucesso |
| Experiment brief (lean/HDD)          | problema + contexto     | objetivos de aprendizado | MVT (mín. viável)     | solution design         | instrumentação       |

**Lição (Josh Seiden / HDD):** "substituir requisitos por hipóteses" — a user story
tradicional _não expõe o sinal de outcome_. Ou seja, o `spec.md` do spec-kit generaliza a
**metade errada** (o "o que construir"). A metade que generaliza para
experiment/spike/incident/fix é **outcome + evidência**.

## 2. Nome: `intent-brief`

Escolha proposta: **`intent-brief`**. Lastro (não é neologismo solto):

- **`decision brief`** já é termo real (um _decision briefing_ é a apresentação curta para
  **obter uma decisão**). O sufixo `-brief` é família existente.
- **`commander's intent`** (doutrina de planejamento) é _o_ termo para o "porquê + resultado"
  irredutível, escrito para que as pessoas ajam sozinhas. É literalmente a espinha invariante.
- Composto trivial em inglês (`intent` atributivo, cf. "intent-based networking").

**`-brief` vira sufixo-família de "documento governado de enquadramento":**

| Doc                  | Fase                  | Pergunta que responde                             |
| -------------------- | --------------------- | ------------------------------------------------- |
| **`intent-brief`**   | _antes_ do trabalho   | por que / qual resultado (_commander's intent_)   |
| **`decision-brief`** | _durante_ o discovery | como decidimos quebrar/executar (quebra de cards) |

Alternativas consideradas: `brief` (familiar, mas raso/genérico), `intent` (fiel mas
abstrato), `charter` (ressoa com Human Gate, mas conota PM pesado), `model`/`modelagem`
(**rejeitado** — colide com modelo/LLM, mesmo motivo de ter trocado "model-review" por
"pre-coding-review"). Risco do `intent-brief`: simetria forte com `decision-brief` pode
confundir → mitigar declarando `-brief` como **convenção de sufixo deliberada**.

## 3. Forma: Caminho A (kind escolhe o corpo), com regulador Dense/Virtual

Duas formas foram avaliadas:

- **A — um arquivo, corpo selecionado pelo `kind`** (1:1, exclusivo, MECE).
- **B — núcleo fino + lentes plugáveis** (1:N, combinável).

**Escolhido A**, por três razões ancoradas no próprio modelo:

1. **Consistência de doutrina.** É o mesmo raciocínio do `artifact-kind` (conjunto fechado,
   MECE, um slot). B introduz um 2º eixo (taxonomia de lentes + combinações válidas) — o
   tipo de "2ª SSOT" que `GG-0005`/`[DEC-0024-G07]` combatem.
2. **O caso híbrido que justificaria B já tem casa.** "E quando um experiment também tem
   decisão técnica?" → isso vai pro **`decision-brief`** (a quebra de cards). O split de dois
   documentos já absorve o híbrido.
3. **Enforcement.** A roda no check brando que já existe; B exigiria uma matriz de combinações.

**Escape hatch sem ir pra B ("A+"):** se um kind precisar de blocos opcionais, usar
sub-blocos opcionais _dentro do mesmo kind_ — sem abrir taxonomia de lentes.

### O regulador anti-rigidez já está no modelo: Dense vs Virtual

`GOVERNANCE-CATALOG §1` (grounded):

| kind         | densidade   | workspace    | campos já exigidos hoje        |
| ------------ | ----------- | ------------ | ------------------------------ |
| `spec`       | **Dense**   | obrigatório  | —                              |
| `experiment` | **Dense**   | obrigatório  | `hypothesis`, `successMetrics` |
| `spike`      | **Dense**   | obrigatório  | —                              |
| `incident`   | **Dense**   | obrigatório  | `severity`                     |
| `proposal`   | **Virtual** | **proibido** | —                              |
| `patch`      | **Virtual** | **proibido** | —                              |
| `fix`        | **Virtual** | **proibido** | —                              |

> **3 dos 7 kinds (`proposal`/`patch`/`fix`) têm workspace _proibido_** → nunca ganham
> **pasta** de workspace. O `intent-brief` só vira **arquivo** (Dense). A burocracia escala
> com o peso do trabalho, por construção — não por regra nova.

Os campos `⊛` (`hypothesis`/`successMetrics`/`severity`) **já são obrigatórios hoje no
`WorkItem.ts`**. O intent-brief só lhes dá um lar legível — **não adiciona rigidez nova**.

> ⚠️ **Dois vieses fundacionais detectados na leitura (owner, 2026-06-24) — detalhados na §7:**
>
> 1. **Nome do kind `spec`** ainda ecoa o spec-kit. Os 6 irmãos nomeiam a _natureza_ do
>    trabalho; só `spec` nomeia o _documento_. Renomear (candidatos `delivery`/`initiative`)
>    **completa** o anti-espec-centrismo que a própria ADR 0010 buscou.
> 2. **Onde mora o intent de um Virtual.** "Inline no PR/commit" **acopla à ferramenta** e
>    contradiz o repo-como-SSOT (mesmo princípio que levou a versionar `pr-bodies/`). A ADR 0010
>    já manda Virtual viver no `registry.yml` (arquivo do repo), não no GitHub — mas o registry
>    não foi materializado, então o fallback derivou para o PR. Correção: Virtual segue **sem
>    pasta**, mas seu intent aterrissa num **registro versionado** (registry/ledger), nunca num
>    branch/PR deletável.
>
> Ambos são **fundacionais (caem na G01), fora do #45** — aqui ficam capturados, não decididos.

## 4. Schema do `intent-brief` em 3 camadas

A rigidez é um **botão** girado perto de zero: só a Camada 1 é dura.

| Nível           | O quê                                                                               | Check brando faz                           |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| **HARD**        | `artifact` + `kind` válido + kernel de 4 linhas (só Dense) + campos `⊛` já exigidos | **falha** (igual ao `artifact-kind:check`) |
| **RECOMENDADO** | espinha (C2) + corpo por kind (C3)                                                  | **avisa, nunca bloqueia**                  |
| **LIVRE**       | `N/A` explícito, seção livre, ordem, prosa, profundidade                            | ignora                                     |

**4 válvulas de escape (anti-camisa-de-força):**

1. **Gradiente de densidade** — 3/7 kinds são leves (sem pasta; registro curto — _onde_ ele mora é tensão aberta, §7).
2. **`N/A` é resposta de 1ª classe** — marcar "não se aplica" > campo vazio.
3. **Kind evolui sem reescrever** — `proposal → spec`, `experiment → spec` (herda
   `hypothesis`/`successMetrics`). O brief acompanha a promoção.
4. **Progressive disclosure** — o mesmo template serve um spike de 4 linhas e um experiment de
   2 páginas, porque só o kernel é obrigatório.

## 5. Template proposto (`_TEMPLATE.intent-brief.md`)

> Renderizado aqui como **proposta** (a adoção como template vivo é execução pós-DEC).

```markdown
---
artifact: intent-brief
kind: spec | experiment | spike | incident # Virtual (proposal/patch/fix) → registro curto no repo, sem pasta (ver §7)
title: <curto>
date: <YYYY-MM-DD>
status: draft | active | closed # opcional (estilo design doc)
---

# <title>

## Kernel (4 linhas — único obrigatório)

Pretendemos <resultado/intenção>
· fazendo <abordagem>
· saberemos por <sinal/evidência>
· pronto quando <critério de done>.

## Espinha (recomendada — expanda quando o trabalho pedir)

- Problema / contexto (por que agora):
- Resultado desejado:
- Limite / fora-de-escopo (appetite):
- Sinal de sucesso:

## Corpo — preencher só a seção do `kind` (menu de prompts, pule à vontade; `N/A` vale)

<!-- kind: spec -->

- Requisitos / comportamento esperado:
- Critério de aceite:
- Não-objetivos:
- Restrições de design:
- Casos de uso / job stories:

<!-- kind: experiment -->

- ⊛ Hipótese ("acreditamos que…"):
- ⊛ Métricas: principal / auxiliar / tradeoff-guardrail:
- Objetivos de aprendizado:
- Solution design (MVT — menor teste viável):
- Instrumentação (eventos/trackings):
- Segmentação / população:

<!-- kind: spike -->

- Pergunta a responder:
- Timebox / appetite:
- Decisão que isto destrava:
- Critério de "sabemos o suficiente":
- Saída esperada (PoC / recomendação / descarte):

<!-- kind: incident -->

- ⊛ Severidade:
- O que quebrou + impacto (quem, quanto):
- Linha do tempo:
- Mitigação / recuperação:
- Causa raiz:
- Prevenção / follow-ups:

## Notas livres

<!-- qualquer coisa fora do andaime -->
```

**Virtual kinds (sem pasta — micro-forma curta; ⚠️ _onde_ ela mora é tensão aberta, §7):**

```text
proposal: <decisão proposta> · alternativas: <…> · recomendação: <…>
          (se aceita → vira `spec`, herda o contexto)
patch/fix: o que estava errado: <…> · correção: <…> · como verifiquei: <…>
```

## 6. Exemplos por tipo MECE (profundo + simples)

Para visualizar tudo. Exemplos **inventados/genéricos** (sem dados reais de terceiros).

### 6.1 `spec` (Dense — arquivo)

**Simples:**

```markdown
---
artifact: intent-brief
kind: spec
title: comando `validate` agrega todos os checks
date: 2026-06-24
---

Pretendemos um único portão de qualidade · fazendo `validate` encadear os checks
· saberemos por CI verde num só comando · pronto quando `npm run validate` cobrir todos.
```

**Profundo:**

```markdown
---
artifact: intent-brief
kind: spec
title: comando `validate` agrega todos os checks
date: 2026-06-24
status: active
---

Pretendemos um único portão de qualidade · fazendo `validate` encadear os checks
· saberemos por CI verde num só comando · pronto quando `npm run validate` cobrir todos.

## Espinha

- Problema: checks espalhados; contribuidor não sabe o que rodar antes do PR.
- Resultado: um comando canônico que reflete o gate de CI.
- Fora-de-escopo: paralelizar/otimizar tempo de execução.
- Sinal: rodar `validate` local == resultado de CI.

## Corpo (spec)

- Requisitos: encadear lint, testes, e os `:check` governados na ordem do contrato.
- Critério de aceite: falha em qualquer etapa falha o todo; saída lista a etapa que quebrou.
- Não-objetivos: cache incremental; seleção parcial de checks.
- Restrições de design: SSOT em `script-contracts.yml`; `package.json` é projeção.
```

### 6.2 `experiment` (Dense — arquivo)

**Simples:**

```markdown
---
artifact: intent-brief
kind: experiment
title: lista priorizada no onboarding aumenta ativação
date: 2026-06-24
---

Pretendemos +ativação · fazendo uma lista priorizada no onboarding
· saberemos por 1ª-ação-em-7d · pronto quando o teste atingir significância.
```

**Profundo:**

```markdown
---
artifact: intent-brief
kind: experiment
title: lista priorizada no onboarding aumenta ativação
date: 2026-06-24
status: active
---

Pretendemos +ativação · fazendo uma lista priorizada no onboarding
· saberemos por 1ª-ação-em-7d · pronto quando o teste atingir significância.

## Espinha

- Problema: usuários novos não sabem por onde começar.
- Resultado: aumento de ativação na 1ª semana.
- Fora-de-escopo: redesenho do dashboard.
- Sinal: taxa de 1ª ação em 7 dias.

## Corpo (experiment)

- ⊛ Hipótese: se priorizarmos itens de maior valor percebido, então a ativação sobe.
- ⊛ Métricas: principal = ativação-7d · auxiliar = cliques na lista · tradeoff = churn de atenção.
- Objetivos de aprendizado: qual sinal de priorização o usuário entende sem explicação.
- Solution design (MVT): lista estática priorizada por heurística simples.
- Instrumentação: eventos `list_shown`, `list_item_click`, `first_action`.
- Segmentação: contas criadas a partir de D0; controle vs variante 50/50.
```

### 6.3 `spike` (Dense — arquivo)

**Simples:**

```markdown
---
artifact: intent-brief
kind: spike
title: cabe um graph store derivado?
date: 2026-06-24
---

Pretendemos saber se vale um graph store derivado · fazendo um PoC de 1 dia
· saberemos por uma query que JSON não atende · pronto quando houver recomendação.
```

**Profundo:**

```markdown
---
artifact: intent-brief
kind: spike
title: cabe um graph store derivado?
date: 2026-06-24
status: active
---

Pretendemos saber se vale um graph store derivado · fazendo um PoC de 1 dia
· saberemos por uma query que JSON não atende · pronto quando houver recomendação.

## Corpo (spike)

- Pergunta: existe consulta real (travessia multi-hop) que o snapshot JSON não resolve bem?
- Timebox: 1 dia.
- Decisão que destrava: se o `internal-refactor` precisa de adapter de banco ou não.
- Critério de "sabemos o suficiente": 3 queries-alvo testadas em JSON vs grafo.
- Saída esperada: recomendação (adotar / adiar / descartar) — não implementação.
```

### 6.4 `incident` (Dense — arquivo)

**Simples:**

```markdown
---
artifact: intent-brief
kind: incident
title: hook pre-commit quebrou commits no Windows
date: 2026-06-24
---

Pretendemos restaurar commits no Windows · fazendo corrigir o resolve do hook
· saberemos por commit limpo em máquina Windows · pronto quando reproduzir e passar.
```

**Profundo:**

```markdown
---
artifact: intent-brief
kind: incident
title: hook pre-commit quebrou commits no Windows
date: 2026-06-24
status: closed
---

Pretendemos restaurar commits no Windows · fazendo corrigir o resolve do hook
· saberemos por commit limpo em máquina Windows · pronto quando reproduzir e passar.

## Corpo (incident)

- ⊛ Severidade: alta (bloqueia qualquer commit no SO afetado).
- O que quebrou + impacto: lint-staged não encontrava o binário; todo commit falhava.
- Linha do tempo: 14:02 1º relato · 14:20 reproduzido · 14:55 corrigido.
- Mitigação: prepend do dir do fnm ao PATH do hook.
- Causa raiz: toolchain fora do PATH padrão em sessão não-login.
- Prevenção: doctor check do PATH; nota no onboarding.
```

### 6.5 `proposal` (Virtual — registro curto; home em aberto, §7)

```text
proposal: adotar `intent-brief` no lugar de `spec.md` como doc de início-de-trabalho.
alternativas: manter `spec.md`; renomear só (Caminho C); compor lentes (Caminho B).
recomendação: Caminho A + regra Dense/Virtual. (se aceita → vira `spec`, herda contexto)
```

### 6.6 `patch` (Virtual — registro curto; home em aberto, §7)

```text
patch: o que estava errado: dep `yaml` em versão antiga sem o parser usado pelos checks.
       correção: bump para 2.x. como verifiquei: `validate` verde + testes dos checks.
```

### 6.7 `fix` (Virtual — registro curto; home em aberto, §7)

```text
fix: o que estava errado: regex de frontmatter não casava CRLF.
     correção: `\r?\n` no separador. como verifiquei: teste novo com arquivo CRLF.
```

## 7. Em aberto

**Itens do #45 / da DEC do intent-brief (G25):**

- **Resultado/aprendizado do experiment**: anexa no próprio intent-brief (vira registro vivo)
  ou vira artefato de fechamento separado (paralelo ao `gate`)?
- **Migração de `spec.md`**: as specs existentes (0021/0023/0024) renomeiam/reenquadram, ou
  só specs novas nascem como `intent-brief`? (blast radius)
- **Placement físico** do arquivo (Dense): raiz da spec como `intent-brief.md`? Liga-se à
  reorg de pastas (parada) — coordenar com a futura DEC de pastas.

**Itens fundacionais (caem na G01 / ADR 0010 — fora do #45):**

**(a) Renomes da taxonomia de trabalho** (de-conflação, owner 2026-06-24) — benchmark de naming com a lente de colisão do item 6 da ADR:

| Termo                    | Consagrado em                    | Significa lá                    | Colisão | Encaixe                                            |
| ------------------------ | -------------------------------- | ------------------------------- | ------- | -------------------------------------------------- |
| `type`/`kind` (umbrella) | Jira, Azure (_"work item type"_) | a dimensão de classificação     | nenhuma | ✅ neutro; "7 tipos" é o difícil de explicar       |
| `pillar` (umbrella)      | estratégia de produto            | tema/foco (3–5)                 | soft    | ✅ explicável, ADR-native; mitigar definindo       |
| `initiative`             | roadmap/SAFe                     | agrupa epics (nível médio)      | hard    | ✗ descartado                                       |
| `feature` (pilar)        | SAFe                             | valor de 1 PI/1 ART             | hard    | ✗ estreito                                         |
| `capability` (pilar)     | SAFe Large Solution              | funcionalidade grande multi-ART | hard    | ✗ baggage de escala                                |
| `delivery` (pilar)       | PM/DevOps                        | ato de entregar / deliverable   | baixa   | ✅ amplo, ecoa a ADR, alinha com `delivery-review` |

- **Pilar `spec → delivery`: confirmado.** Único amplo + baixa colisão; os "óbvios"
  (feature/capability/epic) carregam escala fixa, que a ADR rejeita como eixo. Doc
  (`spec.md→intent-brief`) + pilar = duas metades da mesma de-conflação; item 6 sanciona
  (precedente `exploration→spike`).
- **Umbrella: MANTER `kind` — decidido por scan do código (2026-06-24).** `type` seria pior
  aqui: (1) quebra a convenção `XxxKind` da casa (≥7 discriminadores: `WorkItemKind`,
  `ReadinessKind`, `ConstraintOriginKind`, `ReviewEventKind`, `PromotionKind`, `repositoryKind`,
  `artifactKind`); (2) **colide** com o `type` já usado como _tipo de decisão/evento_ (subsistema
  `decide/`: `type: this.id`) e com schema externo (GitHub ruleset `type`). O campo fica `kind`.
- **Explicabilidade (a dor real, resolvida à parte):** a dificuldade era o jargão **"MECE"**, não
  o umbrella. MECE é garantia de design interna, não rótulo → dizer _"7 tipos de trabalho; cada
  item é exatamente um; juntos cobrem tudo"_. O conceito falado já tem nome no repo: **"pilares de
  valor"** (ADR 0010 + `Pillars.test.ts`). Resolução latente: **campo = `kind`; fala = "pilares /
  tipos de trabalho"**; só `spec → delivery` é rename real.

**Convenção `kind` vs `type` no repo (manter — visibilidade do padrão):**

| Palavra | Papel no código                                              | Exemplos                                                                                   |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `kind`  | natureza de **conjunto-fechado** de uma entidade (`XxxKind`) | `WorkItemKind`, `ReadinessKind`, `ConstraintOriginKind`, `ReviewEventKind`, `artifactKind` |
| `type`  | discriminador de **decisão/evento/comando** + schema externo | `decide/` (`type: this.id`, `DecisionType`), GitHub ruleset (`type: "pull_request"`)       |

→ Regra para manter: **nova natureza de entidade governada nasce `kind`**; `type` reserva-se a evento/decisão e a contratos externos.

**(b) Onde mora o intent de um Virtual** (durabilidade × acoplamento, owner 2026-06-24). FATO:
ADR 0010 manda Virtual viver _"apenas no registry"_ (arquivo versionado) e _"nunca tocar
filesystem"_; `pr-bodies/` + ADR 0022 estabelecem que **não se delega memória ao GitHub**.
Logo "inline no PR/commit" é o degrau **menos durável** (branch deletável / squash-merge).
Direção: corte principiado = _sem pasta pesada_ (manter) **≠** _sem registro durável_
(rejeitar) → Virtual ganha registro leve **no repo** (registry/ledger). Pré-requisito real:
materializar o `registry.yml` (hoje inexistente neste repo).

**(c) `plan.md` sobrevive?** `plan.md` narra topologia que o `state.yml` já guarda como dado —
forte candidato a redundância (fundacional, fora do #45).

## 8. Ciclo de vida dos 7 tipos (investigação — NÃO decidido)

> Mapa exploratório owner↔Claude (2026-06-24). Bom caminho, **ainda em investigação** — não é
> decisão. Insumo para a DEC-G25 e para a questão de traceability (ponto 3 abaixo).

Cada slot é decidido por uma **regra**, não por gosto:

- **Abertura** = o intent (arquivo se Dense; inline/ledger se Virtual).
- **`decision-brief`** quando há build pra quebrar (delivery, experiment).
- **`learning-record`** quando há **afirmação-para-frente a vereditar** (experiment: hipótese;
  spike: pergunta) — **selado e separado** do brief (anti-mover-trave).
- **`gate`** quando a topologia avança (autoridade humana).
- **Reativo (`incident`)** = **doc vivo** (não há afirmação a proteger; o registro _é_ o doc).

| Tipo         | Dens. | Abre com        | Meio                       | Fecha com                       | Promove?                         |
| ------------ | ----- | --------------- | -------------------------- | ------------------------------- | -------------------------------- |
| `delivery`   | D     | `intent-brief`  | `decision-brief` + reviews | `gate`                          | —                                |
| `experiment` | D     | `intent-brief`  | `decision-brief`           | `learning-record` → `gate`      | won → `delivery` (herda hyp/mtr) |
| `spike`      | D     | `intent-brief`  | leve                       | `learning-record` (leve)        | resposta → delivery/experiment   |
| `incident`   | D     | `intent-brief`  | mitigação                  | doc vivo (causa-raiz+prevenção) | — (ciclo fechado)                |
| `proposal`   | V     | inline (ledger) | —                          | promoção / descarte             | accepted → `delivery`            |
| `patch`      | V     | inline (ledger) | —                          | commit + verificação            | — (ciclo fechado)                |
| `fix`        | V     | inline (ledger) | —                          | commit + verificação            | — (ciclo fechado)                |

`learning-record` (proposto): par de fechamento do `intent-brief`, molde do `gate` + Learning
Card (Strategyzer). Frontmatter `artifact: learning-record · kind · brief: <ref> · outcome`;
corpo = veredito 3-linhas + **tabela métricas-vs-alvo** (o mecanismo anti-mover-trave) +
aprendizados + próximo passo. Formato `.md`; `outcome` espelha o registry.

**Pontos abertos (investigação):**

1. Os **2 chapéus do `decision-brief`**: ledger de DEC (hoje) × quebra de cards (discovery).
   Mesmo artefato ou dois?
2. `spike` precisa de `learning-record` ou sela a resposta no próprio brief?
3. **Não são "2 arquivos", é um sistema conectado.** Falta um **de-para DEC ↔ research** (cada
   DEC declara a(s) pesquisa(s) que a embasam — como esta research embasa a G25). Isso são **nós**
   (intent-brief, decision-brief, learning-record, gate, review, research, DEC) + **arestas**
   (`breaks-into`, `verdicted-by`, `approved-by`, **`grounded-by`**, `promotes-to`). É a semente
   do grafo tipado de `[DEC-0024-G08]`/`G23` (derived-only): materializar arestas como **campo de
   frontmatter** (ex.: DEC `grounded-by: [research/...]`), não como engine/2ª SSOT.

## 9. Próximo artefato

**DEC-0024-G25** cravando: nome `intent-brief`; Caminho A + regra de densidade; o schema de
3 camadas; e decidindo os itens **#45** da §7. Os itens **fundacionais** (renomear `spec`;
durabilidade do intent Virtual; `plan.md`) são roteados para a **G01 / ADR 0010**, não para
esta DEC. Depois: execução (template vivo + extensão do `artifact-kind`/check + migração).

## Benchmarks (públicos)

- Amazon PR/FAQ — Working Backwards: <https://workingbackwards.com/resources/working-backwards-pr-faq/>
- Shape Up — Write the Pitch (Basecamp): <https://basecamp.com/shapeup/1.5-chapter-06>
- Design Docs at Google: <https://www.industrialempathy.com/posts/design-docs-at-google/>
- Oxide RFD 1 (Requests for Discussion): <https://rfd.shared.oxide.computer/rfd/0001>
- Strategyzer Test Card: <https://www.strategyzer.com/library/validate-your-ideas-with-the-test-card>
- Charter vs Brief vs PRD vs RFC: <https://www.ideaplan.io/compare/prd-vs-product-brief-vs-product-spec>
- Hypothesis-Driven Development (LaunchDarkly): <https://launchdarkly.com/blog/hypothesis-driven-development-for-software-engineers/>
- Replacing requirements with hypotheses (Seiden): <https://hackerchick.com/hypothesis-driven-development/>
