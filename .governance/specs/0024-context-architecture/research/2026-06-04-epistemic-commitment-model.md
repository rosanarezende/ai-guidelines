# Research de fundação — O modelo de compromisso epistêmico do ai-guidelines (implícito)

> **Status: pesquisa VIVA, não cristalizada.** NÃO é ADR, NÃO é doctrine, NÃO é decisão.
> Captura uma descoberta arquitetural para **preservar a evidência** e **observar reaparecer**
> antes de qualquer cristalização — exatamente o que o próprio modelo descrito aqui prescreve
> (`insight → evidência → repetição → decisão`).
> Insight associado: **PIT-0007** (`.governance/runtime/insights.yml`). Data: 2026-06-04.
> Origem: emergiu da discussão sobre "quando gerar imagem de um PR" (#35), que se revelou a
> pergunta errada — ver § "A lente".

---

## 1. A descoberta (em um parágrafo)

Múltiplos subsistemas do framework — `topology` (planned→active→concluded), o ciclo de vida do
PR (Draft→Ready→Authorized, ADR 0024), `WorkflowStage` (discovery→…→done), `GateStatus`
(open→awaiting-review→closed), `KnowledgeStage` (insight→decision→rule|guardrail→doctrine),
os readiness gates (R1–R9) e o `disclosure` derivado — **não são mecanismos independentes**.
Parecem **instanciações específicas-de-domínio de um único princípio gerador**:

> **Compromisso epistêmico monotônico, gateado por evidência, que limita o que pode ser afirmado.**
> Em uma frase operacional: _não afirme além do que a evidência disponível sustenta._

O ponto crucial (e o que separa "conceito fundamental" de "boa metáfora"): **o que se repete não
são os estados — é o mecanismo.** Tentar extrair um enum universal de estados (posto→formação→
validado→comprometido) e impô-lo a todas as ladders é over-modeling. O que é fundamental é a
**costura de evidência** entre _tentativo_ e _ancorado_, replicada por domínio com granularidades
diferentes.

---

## 2. A evidência de superfície: as ladders

```text
Entrega       planned → active → concluded
PR            Draft → Ready → Authorized
Documento     discovery → decision → planning → implementation → closing → done
Validação     open → awaiting-review → closed   (gate decision: pending → partial → approved)
Conhecimento  insight → decision → rule|guardrail → doctrine
Integração    R1..R7 (aberto→fechado) → R8 (merge auth) → R9 (final)
```

`KnowledgeStage` é a única ladder **codificada explicitamente** (domínio `src/domain/knowledge/`,
`src/domain/insight/`). A descoberta é que as outras governam pelos mesmos princípios — sem nome.

---

## 3. A falsificação (por que NÃO é um enum único de estados)

Tirando os nomes e olhando só as transições, o alinhamento **quebra de formas reveladoras** — e é
justamente essa quebra que prova que o fundamental é o gerador, não o enum:

- **PR funde dois estados em "Draft"**: um Draft pode ser pura intenção (ADR 0025, contêiner-primeiro)
  OU trabalho em andamento. "Posto" e "em formação" não são distinguidos.
- **Gates não têm o estado "comprometido"**: `open→awaiting-review→closed` valida, mas não integra.
  Três estados, não quatro.
- **`WorkflowStage` abre o lado inicial** em três (discovery/decision/planning) — granularidade fina
  no design.
- **`KnowledgeStage` abre o lado final** em dois (rule|guardrail vs doctrine) — enforcement vs
  canonização.
- **`topology` põe o "comprometido" noutra granularidade**: o nó chega a `concluded`, mas a
  _integração_ (merge atômico) é um eixo no nível da **stack**, não do nó.

Se fosse uma metáfora imposta de fora, daria para forçar 4 estados em todas. **O número de estados
variar por domínio é exatamente o esperado de um princípio GERADOR** — cada domínio instancia a
granularidade de que precisa. Conclusão: fundamental = o princípio; metafórico = o enum de 4 estados.

---

## 4. O gerador mínimo (cascata de portões de evidência)

```text
POSTO ──[trabalho]──► EM FORMAÇÃO ──[EVIDÊNCIA: a costura universal]──► VALIDADO ──[GATE HUMANO]──► COMPROMETIDO
```

O mesmo gerador, **K portões por domínio**. Os cinco domínios caem:

- **entrega**: planned → active → concluded → (merge)
- **conhecimento**: insight → (recorrência) → decision → rule/doctrine
- **validação**: open → awaiting-review → closed (para aqui — não compromete)
- **integração**: R1–R7 (validado) → R8 (gate humano) → merge (comprometido)
- **governança**: discovery/decision/planning → planning gate (evidência) → implementation → done

---

## 5. Invariantes que o modelo impõe (com evidência concreta)

| Invariante                                        | Evidência no código / ADR / governança                                                                                                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I1 — afirmação ≤ estado** (nunca super-afirmar) | ADR 0024 (Draft≠Ready≠Mergeable); placeholder `(insira aqui)` no `value-delivered`; `disclosure` recusa "approved" sem cobertura total do escopo                                                                 |
| **I2 — avançar exige evidência**                  | review-as-artifact (`reviews/` + `gates/`); `CheckExecutionAuthorized` (o `continue` **bloqueia** sem planning gate fechado); R1–R9                                                                              |
| **I3 — certas transições exigem gate HUMANO**     | [CORE-10] Draft→Ready ("explicit human revalidation"); R8 merge-auth (owner); lane Human nos gates; insight→decision (cravar). _Validar_ pode ser automatizado (CI/checks); _comprometer/canonizar_ exige humano |
| **I4 — derivar, não declarar**                    | ADR 0021 §5 ("derivado > declarado"); `disclosure` como projeção; a frase editorial é **quarentenada** do derivado-governado (o template separa as duas)                                                         |
| **I5 — artefatos são state-bound**                | `release-log.md` só pós-merge; Integration PR só após R1–R7; `disclosure` só com revisões registradas em artefato                                                                                                |
| **I6 — monotônico; regressão é SINAL, não livre** | `changes_requested` move o gate de volta — é o gate **funcionando** sobre evidência, não regressão arbitrária                                                                                                    |

---

## 6. Já governa decisões sem ter nome (e por que não é apofenia)

O risco era ver padrão onde só há re-descrição. Dois testes desfazem isso:

1. **Prediz e restringe** (não só descreve): o modelo previu o "cedo demais" da imagem no Draft, o
   "derivado" do disclosure, e o meta-vs-final do prompt visual. Impõe I1–I6 a design futuro.
2. **Instanciação convergente independente**: 5+ mecanismos chegaram à mesma forma **separadamente**.
   - **ADR 0018** (sem LLM em runtime) = só afirmo o que ancoro deterministicamente → I1/I4 na fronteira de arquitetura.
   - **ADR 0020** (governança precede execução) = planning gate → I2.
   - **ADR 0021** (enforcement precede awareness; derivado>declarado) = I4.
   - **ADR 0024** (Draft/Ready/Mergeable distintos) = I1 para PRs.
   - **ADR 0025** (contêiner precede código) = tornar o estado POSTO visível sem super-afirmar.
   - **`KnowledgeStage`** = o princípio **codificado explicitamente** (a prova de que já existe no código).

   Convergência é assinatura de **atrator real**, não de metáfora imposta.

---

## 7. O diagrama conceitual (2 minutos)

```text
   TRANSIÇÕES        planning gate      gates de checkpoint     readiness R1–R8
   (gate = evidência) (design→build)     (TA→AR→Human)          + merge auth (R8)
                          │                   │                      │
   ESTADO      INTENÇÃO  ─┼─►  CONSTRUÇÃO  ───┼─►   ENTREGA     ─────┼─►  INTEGRAÇÃO
   EPISTÊMICO  (hipótese) │   (em andamento)  │    (validada)        │   (impacto real)
   ───────────────────────┼───────────────────┼─────────────────────┼──────────────────
   topology / PR  planned │ active            │ concluded            │ integration/merged
                  Draft   │ Draft             │ Ready for review     │ Authorized→main
   ───────────────────────┼───────────────────┼─────────────────────┼──────────────────
   ARTEFATOS      spec.md │ tasks.md (WIP)    │ reviews/+gates/ ✓    │ review.md R1–R9
   que vivem aqui plan.md │ commits           │ PR body final        │ Integration PR
                  backlog │ insights "trânsito"│ checkpoint fechado   │ release-log T0
   ───────────────────────┼───────────────────┼─────────────────────┼──────────────────
   DECISÕES       priorizar│ continuar/pausar  │ aprovar/changes-req  │ autorizar merge
   que cabem      escopo   │ capturar insight  │ Draft→Ready          │ modo unit/seq
                  abrir PR │ NÃO pedir review  │ abrir Integration PR │ encerrar spec
   ───────────────────────┼───────────────────┼─────────────────────┼──────────────────
   VISUAL honesto VISÃO    │ (nada estável —   │ CAPACIDADE / VALOR   │ CONVERGÊNCIA
   (projeção)     pretendida│  em fluxo)        │ (before/after slice) │ (topology→main)
                  [autorado]│                   │ [autorado]           │ [PROJETÁVEL]
   ───────────────────────┼───────────────────┼─────────────────────┼──────────────────
   SUPER-AFIRMAR  "valor   │ "pronto p/ review"│ "mergeable"          │ "feito" antes
   = erro aqui    entregue"│  sem gate          │  (Ready≠Mergeable)   │  do pós-merge

   ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ladder ORTOGONAL do conhecimento ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   insight ──────────────► decision (ADR/DEC) ──────► rule|guardrail ──────► doctrine
   (em trânsito, qualquer   (cravada, gate humano)    (enforced)            (sedimentado)
    momento)                                                                 no encerramento
```

**Como ler:** colunas = estados epistêmicos; setas com gate = transições que exigem evidência; cada
linha responde uma pergunta (que artefatos? que decisões? que imagem é honesta? o que seria
super-afirmar?). A faixa pontilhada = a ladder de conhecimento, que matura **em paralelo** à vida da spec.

---

## 8. A lente (por que a discussão de imagens foi confusa)

A discussão sobre prompt visual ficou confusa porque a pergunta feita era **"quando gerar a imagem?"**.
A pergunta correta, derivada do modelo, é:

> **O que estamos epistemicamente autorizados a afirmar neste momento?**

A partir daí a resposta cai quase sozinha — o **tipo** de imagem casa com o **estado epistêmico**:

```text
Spec / Planning   → visão pretendida        (intenção; autorado sobre spec.md)
Draft PR          → intenção                (cedo p/ valor — quase zero código)
Checkpoint validado → capacidade construída (entrega; escopo do checkpoint)
Ready for review  → valor entregue          (before/after do slice; autorado)
Integration       → convergência            (PROJETÁVEL da topology)
Pós-merge         → impacto consolidado     (público)
```

Ou seja: a discussão sobre imagens **não produziu uma feature — produziu uma lente.** E também
explicou, retroativamente, o erro do `pr-visual` (tratar um artefato AUTORADO como DERIVADO a
renderizar, e gerar "valor entregue" num estado — Draft — que só autoriza afirmar "intenção").

---

## 9. Status, caminho de cristalização e a guardrail

**Status atual:** evidência espalhada por ADR 0018/0020/0021/0024/0025 + topology + workflow state +
gates + `KnowledgeStage` + disclosure. Já passou do estágio de observação isolada (a evidência é
repetida e convergente), mas **ainda não foi nomeada nem cristalizada**.

**Caminho honesto (o que o próprio modelo prescreve):**

```text
evidência encontrada → capturar (PIT-0007 + este research) → observar reaparecer → só então cristalizar (ADR + diagrama permanente; eventual Doctrine via pr-doctrine)
```

**A guardrail mais importante para quando se cristalizar:** **NÃO reificar um enum universal de estados.**
Forçar `planned/active/concluded` + `Draft/Ready/Authorized` + `insight/decision/doctrine` num único
conjunto de 4 repetiria o over-modeling que a 0024 veta (o erro do `pr-visual` em escala maior). O ADR
correto, quando vier, **nomeia o princípio + os invariantes I1–I6 + cataloga as instanciações** (cada
domínio com sua granularidade), e deixa `KnowledgeStage` como a prova viva em código.

**Candidato a conceito central único:** se fosse para ensinar ai-guidelines com UMA ideia, esta é a
melhor candidata — ela subsume ADR 0018/0020/0021 (cada um é caso especial) e faz um novato deduzir
_por que_ Draft/Ready existem, _por que_ há gates, _por que_ disclosure é derivado, _por que_ governança
precede execução, _por que_ insights são um tier, _por que_ não há LLM em runtime.

---

## 10. Cross-refs

- **Insight:** PIT-0007 (`.governance/runtime/insights.yml`).
- **Codificação existente do princípio:** `src/domain/knowledge/KnowledgeStage.ts`, `src/domain/insight/`.
- **ADRs que o instanciam:** 0018, 0020, 0021, 0024, 0025.
- **Mecanismos:** `state.yml § topology`; `CheckIntegrationReadiness` (R1–R9); `src/cli/disclosureRender.ts`; `reviews/` + `gates/`.
- **Nó futuro de cristalização:** `pr-doctrine` (`state.yml § topology`, sequence 5 — "Doctrine navegável + doctrine:check").

```

```
