# ADR 0010 — Work Items como Taxonomia MECE de Intenção de Saída

**Status:** Aceita
**Data:** 2026-05-11
**Origem histórica:** Spec 0021 (`governance-information-architecture`)
**Pesquisa de suporte:** `.specify/specs/researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md`

---

## Princípio

> **O trabalho registrado pelo framework é classificado por uma taxonomia MECE de intenção de saída.** Não por tecnologia, não por equipe, não por estágio do ciclo — por **o que o autor quer que aconteça no mundo** ao concluir o item.

## Contexto

Sistemas de governance e de issue tracking tendem a dois extremos. **Espec-centrismo** (toda unidade de trabalho é uma "spec") torna o framework cego para o que **não** é especificação: experimentos descartáveis, fixes urgentes, propostas em incubação, manutenções invisíveis. **Taxonomia maximalista** (dezenas de subtipos por domínio) cria classes que se sobrepõem ("é story ou feature? bug ou defect?"), exige decisão arbitrária em cada item, e congela vocabulário antes de o uso real revelar quais distinções têm peso.

O caminho entre os dois extremos exige um princípio explícito de **MECE — Mutuamente Exclusivos, Coletivamente Exaustivos** — sobre uma única dimensão: a intenção de saída do trabalho. Quando os tipos se distinguem por intenção (não por estrutura, tamanho, ou tecnologia), cada item se encaixa em **exatamente uma** categoria, o conjunto **cobre todos os casos possíveis** de trabalho que gera commit no repo, e a fronteira entre tipos é decidida por **propósito**, não por ferramenta.

Esse princípio governa o que vira `WorkItemKind` no domínio, o que ganha pasta física no consumidor, e o que pode ser promovido para o quê. Mudar a taxonomia tem efeito sistêmico (schema de persistência, políticas de validação, fluxos de promoção, mensagens de erro estáveis). Por isso a taxonomia precisa de um lar arquitetural — uma ADR — em vez de viver implícita em código.

## Decisão

1. **Sete pilares de valor, MECE, derivados de intenção de saída:**

   | Pilar        | Intenção de saída                                                   | Categoria |
   | ------------ | ------------------------------------------------------------------- | --------- |
   | `spec`       | Entrega estruturada que muda capacidade do sistema                  | Dense     |
   | `experiment` | Validar uma hipótese de valor com métrica explícita                 | Dense     |
   | `spike`      | Responder uma pergunta técnica time-boxed (PoC, prototype, estudo)  | Dense     |
   | `incident`   | Conter e documentar fricção grave com severidade atribuída          | Dense     |
   | `fix`        | Corrigir um comportamento funcional observável pelo usuário         | Virtual   |
   | `patch`      | Manutenção invisível ao usuário (deps, lint, refactor transparente) | Virtual   |
   | `proposal`   | Semente de backlog — ideia registrada sem ciclo formal              | Virtual   |

2. **Particionamento Dense / Virtual é estrutural, não decorativo.**
   - **Dense:** trabalho que tem par físico (`workspacePath` obrigatório). Sua existência cria pasta no workspace. Política de validação rejeita ausência do path.
   - **Virtual:** trabalho que não tem par físico. `workspacePath` é **proibido por construção** — tipos virtuais não declaram o campo. Combinação inválida é typed-out, não validada em runtime.
   - A discriminated union `DenseWorkItem | VirtualWorkItem` em código reflete a divisão em tipo, não em convenção.

3. **Fronteiras entre pilares são decididas por intenção, não por estrutura.**
   - `fix` ⇄ `patch`: bug funcional observável vs. manutenção invisível. Mesma estrutura (sem workspace, doc mínima); intenção é o discriminador.
   - `fix` ⇄ `incident`: severidade atribuída e impacto em métricas/CI são o discriminador.
   - `spec` ⇄ `experiment`: entrega de capacidade decidida vs. validação de hipótese aberta.
   - `spike` ⇄ `experiment`: pergunta técnica ("consigo construir?") vs. pergunta de valor ("isso gera resultado?").
   - Zonas cinza inevitáveis (refactor que corrige bug latente; migração major) ficam com o autor humano. O framework **não** tenta automatizar a classificação.

4. **Promoção entre pilares é regida por política pura.**
   - `proposal → spec` (semente amadurece em entrega formal).
   - `experiment → spec` (hipótese vencedora vira capacidade permanente; spec herda `hypothesis` e `successMetrics` da linhagem).
   - Demais combinações são proibidas e a violação é erro de domínio estável (`POLICY_MAINTENANCE_NOT_PROMOTABLE`).
   - Promoção retorna um patch puro — aplicar ao registry e tocar workspace é responsabilidade do use case, não da política.

5. **Critério para adicionar pilar novo (sem reabrir esta ADR é proibido):**
   - Existe **classe de intenção** que nenhum dos 7 pilares cobre sem distorção?
   - Existem ≥3 casos reais distintos onde a classificação atual produz fricção?
   - O novo pilar é estável quanto à categoria (Dense ou Virtual) e quanto às regras de promoção?
   - Em caso afirmativo, ADR de extensão atualiza esta tabela com a nova linha; em caso contrário, a dor real é melhor endereçada via política ou tag, não como pilar.

6. **Nomes carregam significado de mercado.** Vocabulário escolhido evita colisões com termos consagrados em domínios próximos (Product Discovery, Data Science, SRE). Quando há colisão (ex.: "exploration" colide com fase de Product Discovery), o nome é trocado por um equivalente sem colisão (`spike`, canônico em XP/Scrum desde 1999).

## Aplicações

- **Domínio:** `WorkItemKind` é uma literal union dos 7 pilares; `WorkItem` é discriminated union `DenseWorkItem | VirtualWorkItem`; `WorkItemPolicy.assertValidDraft` aplica invariantes por pilar; `PromotionPolicy.promote` decide transições.
- **Registry persistido:** o YAML serializa o `kind` como string fechada; schema guard rejeita kinds desconhecidos com erro estável.
- **Workspace físico:** apenas pilares Dense materializam pasta em `.governance/<kind>/<id>/`; pilares Virtual nunca tocam filesystem.
- **CLI surface (futura):** comandos como `register`, `promote`, `resolve` operam sobre o `kind` declarado; mensagens de erro citam o conjunto válido quando o input é inválido.
- **Living Documentation (futura):** projeções derivadas podem agrupar regras por pilar de origem.

## Alternativas avaliadas e rejeitadas

| Opção                                                        | Por que rejeitada                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Manter espec-centrismo (só `spec` formal; resto como nota)   | Não resolve a origem de valor fora de specs; reabre a discussão em toda spec futura |
| Taxonomia maximalista por domínio (dezenas de subtipos)      | Congela vocabulário cedo; cria sobreposições; classificação vira fricção            |
| Classificar por tamanho/complexidade (small/medium/large)    | Mistura unidade de medida com intenção; força reclassificação quando o item cresce  |
| Classificar por equipe/tecnologia                            | Acopla taxonomia a estrutura organizacional volátil                                 |
| Adotar vocabulário de uma metodologia única (Shape Up, BMAD) | Vocabulários de fluxo (pitch/bet/cycle) não substituem taxonomia MECE de intenção   |

## Consequências

### Positivas

- Cada item tem **exatamente um** pilar — zero ambiguidade estrutural.
- Adição de pilar novo é evento auditável, com critério explícito.
- Mensagens de erro nomeiam o conjunto fechado, sempre.
- Tipos do TypeScript fazem combinações inválidas serem impossíveis (Virtual com workspace, etc.).
- Promoção tem regra clara — `patch`/`fix`/`incident` não promovem, fim de discussão.

### Negativas / Riscos

- Zonas cinza em fronteiras (`fix`↔`patch`, `patch`↔`spec` em refactor médio) exigem disciplina humana **na criação** do item. Aceito como custo de granularidade fina.
- **Disciplina humana exigida também na promoção, não só na criação.** Quando um `proposal` amadurece e vira `spec` (ou um `experiment` vencedor vira `spec`), o registry precisa ser atualizado deliberadamente — o framework não detecta automaticamente que uma proposta deveria ter sido promovida. Se a promoção for esquecida, o `registry.yml` mantém o item no pilar antigo enquanto o trabalho real avança no pilar novo, gerando drift entre estado declarado e estado verdadeiro. Mitigação: políticas puras (`PromotionPolicy`) garantem que **se** a promoção for invocada, ela é estrutural e auditável; mitigação cultural: cada vez que um draft `proposal` ganha `workspacePath` na cabeça do autor, esse é o gatilho para invocar `promote`.
- Sete categorias são mais do que três — exige onboarding um pouco maior. Mitigação: tabela acima e exemplos no glossário.
- Vocabulário pode envelhecer (qualquer termo pode colidir com algum domínio futuro). A regra do item 6 fornece o caminho de renomeação sem reabrir a taxonomia.

## Nota histórica

Esta ADR foi consolidada durante a Spec 0021 a partir do `[DEC-0021-A02]` (decisão de gate humano sobre a expansão controlada da taxonomia). Naquele gate, o pilar `exploration` foi adotado para investigação técnica time-boxed; em 2026-05-11, auditoria MECE detectou colisão do nome com vocabulário Product Discovery AI-first e o renomeou para `spike` sem alterar a semântica do pilar. A renomeação está registrada como ressalva textual no `[DEC-0021-A02]`; esta ADR documenta o **modelo**, não a transição.
