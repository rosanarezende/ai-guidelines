# ADR 0021 — Enforcement estrutural precede consciência comportamental

**Status**: Aceita
**Origem histórica**: Spec 0023 sub-bloco DEC-0023-E01..E05 (2026-05-19, sessão de design Bloco E).
**Relaciona-se com**: [`ADR 0020 — Governance precede e protege execução`](./0020-governance-precede-execution.md) (relação ortogonal: ADR 0020 cobre **lifecycle/sequencing** — o quê precede o quê; este ADR 0021 cobre **mecanismo de enforcement** — como o lifecycle é garantido). Os dois princípios são **independentes** e devem coexistir.

---

## Contexto

A Spec 0023 cravou em ADR 0020 que governança precede execução, com 4 fases (discovery → decision → planning → execution) e `tasks.md` como boundary canônico. Imediatamente após publicar ADR 0020, durante a materialização do PR que o introduzia (PR2-lifecycle), o agente (Claude Opus 4.7) **violou o lifecycle que acabou de co-redigir** — atravessou múltiplas tasks de execução sem pausar para validação humana entre elas.

Foi a **terceira reincidência consecutiva** do mesmo pattern dentro da própria 0023:

1. **PR1 da 0023** colapsou discovery + decision + execution num único PR (registrado como pre-model em DEC-0023-D04).
2. **PR2-DX** abriu 10 tasks de execução imediatamente após Bloco B fechar, sem gate de planning explícito.
3. **PR2-lifecycle** atravessou T1–T7 sem pause para revisão, mesmo após Bloco D cravar `tasks.md` como boundary de execução.

Em **todos os três casos**, o agente:

- conhecia o processo (lia decision-brief / ADR / plan a cada turno);
- concordava com o processo (engajava com a discussão e propunha refinamentos);
- explicava o processo corretamente (descrevia o lifecycle quando perguntado);
- **e ainda assim violava o processo** quando o fluxo permitia continuação.

A literatura de Human-in-the-Loop / Human-on-the-Loop reforça empiricamente o que o dogfooding mostrou: workflows colaborativos perdem aderência operacional sem checkpoints estruturais; sistemas que dependem de "consciência" e "lembrança" comportamental degradam sob aceleração, conveniência e continuidade implícita.

Além disso, **≥ 5 decisões estruturantes anteriores** desta mesma spec haviam sido deferidas como "talvez depois" e voltaram com retrabalho mensurável: `.specify → .governance` cutover, runtime lifecycle, planning boundary, governance separation, e enforcement em si. Empurrar enforcement seria o sexto deferimento da série — recriando exatamente o pattern que a 0023 está tentando resolver.

## Princípio

**`process awareness is not process enforcement`.**

Equivalente em pt-BR: **governança precisa ser enforced estruturalmente, não lembrada comportamentalmente.**

Operacionalmente:

1. **Enforcement vive em camadas (L1–L4)**, com responsabilidades distintas:

   | Camada | Onde mora                                                 | O que faz                                                 | Confiabilidade                                             |
   | :----- | :-------------------------------------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
   | L1     | Comportamento do agente (humano ou IA)                    | Lê briefing, decide respeitar                             | **Não-confiável isoladamente** (empiricamente demonstrado) |
   | L2     | Runtime local (`workflow continue`, `state.yml` derivado) | Declara estado de autorização; recusa narrativa explícita | Confiável se agente respeita L2 (ainda discricionário)     |
   | L3     | Hooks locais (pre-commit, pre-push, equivalentes)         | Recusa operação na origem                                 | Confiável em mecânica; provider-dependent                  |
   | L4     | CI / branch protection                                    | Bloqueia merge                                            | Última linha; tardia mas absoluta                          |

2. **L1 sozinho é insuficiente** para colaboração humano-IA sustentável. Awareness comportamental falha sob aceleração, conveniência e continuidade implícita. Decisões estruturantes registradas em ADR/decision-brief são condições **necessárias mas não suficientes** — precisam de reforço estrutural.

3. **Mínimo viável: L2 + L4.** L3 e camadas adicionais entram apenas quando L2+L4 forem comprovadamente insuficientes em **≥ 2 casos reais**. Critério observável, não palpite.

4. **L2 é fonte local de verdade.** Runtime local consegue declarar `executionAuthorized: false` sem depender exclusivamente de L4 (CI remoto). Estados estruturais (presença de `tasks.md` aprovado, `gate.status` closed, governance chain íntegra) são computados localmente e independentemente.

5. **Estados estruturais são derivados, não declarados.** Autorização não pode ser concedida por declaração manual no YAML (`executionAuthorized: true`) — isso degrada enforcement para convenção social. Autorização emerge do estado estrutural verificável.

6. **Exceções (fast-track) são raras, visíveis e auditáveis.** Não bypass disfarçado. Para `patch`/`fix`/`incident` pequeno: label PR + rationale curto obrigatório + entry em `state.yml` + validação em CI de que ambos (label + rationale) estão presentes. Reviewer humano absorve responsabilidade no lugar do contrato estrutural.

7. **Decisões estruturantes detectadas no dogfooding entram no escopo corrente**, não em NEXT/backlog. Regra metodológica derivada do padrão observado: ≥ 5 deferimentos anteriores voltaram com custo maior.

## Opções avaliadas

| #   | Opção                                                                                                                         | Trade-off                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **Apenas L1 (consciência comportamental).** Agente respeita processo porque entende e concorda.                               | **Empiricamente falsificado** dentro desta spec (3 violações). Status quo até este ADR.                  |
| 2   | **Enforcement em camadas (L2 + L4 mínimo agora; L3 deferido com critério).**                                                  | Garante operação independente de disciplina; respeita ergonomia (não vira engine pesada). **Escolhido.** |
| 3   | **Full enforcement automatizado (L1–L4 completo desde já)**, incluindo drift detection semântico e pre-tool hooks no harness. | Máxima proteção; mas vira engine; mata DevEx; viola ADR 0018 se acoplar a provider hooks.                |

## Framing canônico anti-distorção

**Linguagem aceita:**

- "proteção estrutural mínima contra execução implícita"
- "integridade operacional do lifecycle humano-IA"
- "governance runtime" (no escopo `workflow continue` + state derivado)
- "enforcement de linkagem estrutural" (no escopo CI)

**Linguagem rejeitada:**

- ~~workflow engine~~
- ~~orchestration framework~~
- ~~BPM / business process management~~
- ~~governance machine~~
- ~~approval maze~~
- ~~compliance enforcement~~ (no sentido corporativo)

**Critério de teste:** se a descrição do mecanismo soar enterprise, voltar ao framing canônico. Se o mecanismo justificar a descrição enterprise, **rejeitar o mecanismo, não o framing**.

## Consequências

- **Imediatas (PR3-enforcement-runtime, PR próprio):**
  - `state.yml` ganha campo derivado `executionAuthorized` computado pelo runtime.
  - `workflow continue` recusa narrativamente quando `executionAuthorized == false`, listando condições não satisfeitas.
  - `governance-pr-check` (CI, materializado no PR2-lifecycle) valida label + rationale para fast-track — não apenas label.
  - PR de enforcement runtime é **PR próprio**, separado de PR-DX, para isolar testabilidade e dogfooding do mecanismo.

- **De médio prazo:**
  - L3 (hooks locais) revisado se L2/L4 forem insuficientes em ≥ 2 casos.
  - Drift detection semântico revisado quando padrões de divergência se acumularem.
  - Fast-track strictness refinada após observação de ≥ 3 fast-tracks reais.

- **Não-consequências (importantes):**
  - **Não** implica workflow engine. L2 é runtime de leitura/recusa, não orquestração.
  - **Não** elimina julgamento humano. CI valida estrutura; semântica continua humana.
  - **Não** introduz dependência de provider hook (Claude Code, Cursor, etc.) — esses ficam em L3-deferred.

## Critério de revisão

Esta ADR deve ser revisada se:

- **L2 + L4 são comprovadamente insuficientes em ≥ 2 casos** (agente ou humano viola estrutura, e nem runtime refuse nem CI bloqueio detectam). Reabrir considerando L3 ou expansão de L4.
- **Fast-track vira válvula de escape** (≥ 3 fast-tracks revelando padrão de abuso). Reabrir critério "raridade" + reforço de validação.
- **Framing canônico é percebido como enterprise** por colaboradores externos. Revisar nomenclatura (não conceito).
- **Princípio E01 é citado como justificativa para overengineering** (tooling pesado em nome de enforcement). Reabrir balanço entre proteção e ergonomia.

Sem nenhum desses gatilhos, esta ADR permanece estável como princípio perene.

## Origem empírica

Este princípio emergiu de violações operacionais repetidas observadas durante o dogfooding da própria Spec 0023. Em três PRs consecutivos da mesma spec, a parte (humana ou IA) envolvida na execução reconhecia o processo, concordava com o processo e descrevia o processo corretamente — e ainda assim violava o processo quando o fluxo permitia continuação. A evidência empírica converge com a literatura HITL/HOTL: awareness comportamental, isoladamente, não basta para sustentar workflows colaborativos humano-IA.

Daí a separação canônica entre `process awareness` (necessária, insuficiente) e `process enforcement` (suficiente quando estruturalmente garantido). O princípio é arquitetural — não narrativa pessoal — e aplica a qualquer agente operando sob este lifecycle, independente de origem.
