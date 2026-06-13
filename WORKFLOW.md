# Development Workflow

Como desenvolvemos este repositório — do research ao merge, com os comandos do `ai-guidelines`.

---

## A regra de ouro

> **O merge é o encerramento.** Uma branch que mergeia deve chegar ao merge já em estado final: especificação marcada como concluída, arquivos temporários deletados, histórico atualizado. Não existe "arrumação depois do merge". O que entra em `main` é o que fica.

A única exceção são **automações disparadas pelo merge** — publicação no npm, criação de GitHub Release, fechamento automático de PRs da stack. Essas ações precisam do commit de merge para existir, então acontecem depois. Tudo que é trabalho humano acontece antes.

---

## Quando você precisa de todo esse fluxo?

A maioria das contribuições **não precisa** passar por tudo isso. Use o caminho mais curto que resolve o problema:

| Tipo de mudança                                | Caminho                                   |
| ---------------------------------------------- | ----------------------------------------- |
| Typo, wording, bug pequeno, 1 arquivo          | Branch → PR → CI verde → merge. Sem spec. |
| Feature ou refactor com mais de uma sessão     | Fluxo completo abaixo                     |
| Decisão arquitetural que afeta outros arquivos | Fluxo completo abaixo                     |

---

## O fluxo completo

```
Pesquisa → Backlog → Spec → Execução → Preparo → Merge → Automação
```

### 1. Pesquisa (quando o design ainda não está claro)

Antes de abrir uma spec para iniciativas complexas, vale pesquisar o suficiente para tomar a decisão de design com confiança. Essa pesquisa fica em `research/` dentro da pasta da spec durante o trabalho e migra para a biblioteca central ao fechar.

Pesquisas que sobrevivem entram em `.governance/specs/research-library/` com uma data no nome. As que não têm valor duradouro morrem no histórico do git — não em pasta ativa.

### 2. Backlog

Toda iniciativa não-trivial começa como uma candidata no backlog antes de virar trabalho ativo.

**Arquivo:** `.governance/specs/roadmap/backlog.md`

A candidata descreve o problema, o escopo proposto e por que vale fazer. Quando o owner decide priorizar, a candidata vira uma spec.

### 3. Spec

Uma **spec** é a documentação da iniciativa antes e durante a execução — o contrato entre quem planejou e quem vai implementar. Não é uma wiki: é um artefato vivo que fecha junto com o trabalho.

```bash
npm run guidelines -- workflow   # use a opção "Nova spec / retomar"
```

Cada spec vive em `.governance/specs/<número>-<nome>/` e tem:

| Arquivo             | O que é                                        | Muda?                   |
| ------------------- | ---------------------------------------------- | ----------------------- |
| `spec.md`           | O porquê, o escopo e os critérios de conclusão | Não, após aprovação     |
| `state.yml`         | O estado atual da spec (stage, foco)           | Sim, durante execução   |
| `plan.md`           | Como a entrega vai ser feita                   | Sim, durante execução   |
| `tasks.md`          | Checklist de tarefas                           | Sim, durante execução   |
| `decision-brief.md` | Decisões de design que precisaram de análise   | Sim, até ser fechado    |
| `NEXT.md`           | Débitos adiados (só se houver)                 | Deletado antes do merge |

A branch tem nome `feat/spec-<número>-<nome>`.

### 4. Execução

O trabalho acontece em PRs sequenciais na branch da spec — cada PR entrega uma fatia de valor independente e passa no CI antes de avançar.

```bash
npm run guidelines -- continue      # mostra o briefing da spec ativa e verifica se a execução está autorizada
npm run guidelines -- workflow      # wizard com opções: ver estado, publicar progresso, abrir PR de integração...
```

`npm run guidelines -- continue` bloqueia se `tasks.md` não existir ou não tiver tarefas autorizadas. É o mecanismo que impede implementação sem planejamento.

### 5. Preparo para o merge (a etapa que mais importa)

Antes do merge, a branch precisa chegar ao estado final. Tudo abaixo acontece em commits na própria branch:

```
[ ] spec.md marcado como "Done"
[ ] state.yml com stage "done" e sem itens pendentes
[ ] NEXT.md deletado (não esvaziado — deletado)
[ ] Entrada da spec adicionada em historico.md (specs concluídas)
[ ] Entrada da spec removida de backlog.md (seção "Em execução")
[ ] Pesquisas de valor migradas para research-library/ e indexadas
[ ] release-log.md preenchido com o que já se sabe (data, versão, stack de PRs)
[ ] Gate R9 marcado no review.md: "branch em estado final"
```

O release-log tem dois momentos: o que você preenche antes (data, versão alvo, quais PRs estão na stack) e o que a automação preenche depois (SHA do commit, link da GitHub Release, resultado). Isso é a única informação que genuinamente não existe antes do merge.

### 6. Merge

```bash
npm run guidelines -- workflow   # use a opção "Executar merge atômico da stack"
```

O merge precisa de autorização explícita do owner registrada no PR (gate R8 do `review.md`). Sem isso, o comando não avança.

**Modo `unit` (padrão):** mergeia apenas o PR final da stack em `main`, gerando um único commit canônico. Os outros PRs da stack são fechados automaticamente com referência a esse commit.

**Modo `sequential`:** mergeia cada PR da stack em sequência. Gera um commit por PR. Útil quando cada PR tem valor histórico independente.

### 7. O que acontece automaticamente após o merge

Nenhuma dessas ações exige intervenção humana:

| O que                                       | Como                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| PRs da stack fechados com "landed via #SHA" | CLI executa logo após o merge                          |
| Publicação no npm                           | CI (`release.yml`) — só specs que publicam no registry |
| Criação da GitHub Release                   | CI (`release.yml`) — só specs que publicam no registry |

Depois que o CI rodar, você confirma o resultado no release-log (uma linha com o link da run). Isso é tudo.

---

## Perfis de PR body (contrato-base + perfil por tipo)

O `governance-pr-check` valida o body conforme o **tipo** do PR — derivado do role do nó na topologia (`state.yml § topology`) e da label `fast-track`. Nenhum perfil exige seções de outro; o contrato-base (header em linha própria, placeholder `<…>` não satisfaz, comentários HTML preservados, sem `<details open>`) é comum.

| Perfil         | Template                                                                | Draft exige (intenção)                                                                                                                      | Ready exige ainda (entrega/decisão)                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🛠️ Execution   | `.github/pull_request_template.md` (default)                            | Visão pretendida (baseline) · Resumo · Escopo (dentro/fora)                                                                                 | Valor entregue · Test plan real · Validação/evidências/checklist · Disclosure                                                                                            |
| 🧾 Governance  | `?template=governance.md`                                               | Visão de valor (baseline da intenção) · Problema · Hipóteses · Escopo                                                                       | Processo decisório · Decisões consolidadas · **Arquitetura pretendida** (baseline da decisão) · Evidências e falsificação · Impactos downstream · Validação · Disclosure |
| 🔗 Integration | `?template=integration.md` (canônico: `integration-pr.md` via workflow) | Resultado integrado · Componentes/PRs absorvidos · Convergência · Rollback                                                                  | Compatibilidade/conflitos · Evidência de integração real · Validação final da stack · Validação · Disclosure                                                             |
| 🚑 Fast-track  | `?template=fast-track.md` (requer label `fast-track`)                   | Incidente · Correção · Impacto/risco · Evidência mínima · Rollback · Accountability real · Validação · Cross-refs · Disclosure (fase única) | —                                                                                                                                                                        |

Baselines preservadas pelo `npm run pr-body:update`: `## Visão pretendida` (execution), `## Visão de valor` e `## Arquitetura pretendida` (governance) — mudanças entram como atualização complementar, nunca apagando o original.

---

## Fechamento de PR (sequência canônica)

Cada PR de execução fecha nesta ordem — as precondições são verificáveis com `npm run pr-ready:check -- --pr <n>` (read-only; não converte nada):

```text
PR body final (Valor entregue preenchido; Visão pretendida intacta)
→ CI verde no HEAD final
→ Draft → Ready (ato da owner; NÃO autoriza merge — ADR 0024)
→ Human Gate da owner (decide o próximo movimento)
→ registro do gate artifact (gates/c-<checkpoint>.yml; validar + push)
→ atualização final do body
→ abertura do próximo checkpoint/PR
```

Distinções que a sequência preserva:

- **Draft/Ready é estado nativo do GitHub** — o flag `draft` é a fonte única consumida por `governance-pr-check` (que também roda na conversão, via `ready_for_review`) e pelo merge.
- **Ready ≠ merge**: a conversão apenas apresenta o PR para decisão humana. Em stack modo `unit`, Human Gate intermediário não mergeia isolado em `main` — o merge é evento único no fim da stack.
- **O gate artifact nasce DEPOIS da decisão humana** sobre o PR em Ready; registrá-lo antes é inconsistência (o `pr-ready:check` falha).
- **Atualizações de body** usam `npm run pr-body:update` (preserva `## Visão pretendida` como baseline; `## Valor entregue` só com flag explícita).
- **O próximo checkpoint/PR só abre após o gate aprovado e registrado** (a narrativa `canonical-next` do `state.yml` é guardada por `reconcile:check`).

---

## Gates de prontidão (review.md)

Antes do merge, o `review.md` da spec registra os gates que foram verificados. Cada gate tem evidência — não é um checkbox de honra.

| Gate   | O que verifica                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| R1     | CI verde na branch                                                                                                                              |
| R2     | O wizard funciona corretamente no terminal (smoke test)                                                                                         |
| R3     | Débitos do NEXT migrados para o backlog antes de fechar                                                                                         |
| R4     | Publicação visual: imagens renderizadas dos prompts promovidas para `assets/` + README (degradável: deferral declarado se gerador indisponível) |
| R5     | Cada critério de aceite da spec confirmado com evidência                                                                                        |
| R6     | Descrições dos PRs da stack refletem o estado final                                                                                             |
| R7     | Stack marcada como Ready no GitHub com aprovação do owner                                                                                       |
| **R8** | **Autorização explícita do owner para o merge**                                                                                                 |
| **R9** | **Branch em estado final** — checklist do Estágio 5 completo                                                                                    |

R8 é o gate humano final. R9 é o gate técnico final. O merge só acontece com os dois.

---

## Governança visual (prompts obrigatórios; imagens publicadas)

O artefato **gateado** é o **prompt final autorado** (paste-ready), não a imagem — ele é produzível pela IA que prepara o PR sem depender de gerador externo. A **imagem** é a renderização do prompt: opcional no Ready, obrigação de publicação em R4 (degradável). Assim o gate nunca bloqueia o Ready por gerador indisponível.

| Artefato                             | Nasce em                 | Prompt obrigatório? | Gate que falha sem o prompt                     |
| ------------------------------------ | ------------------------ | ------------------- | ----------------------------------------------- |
| **#1 Visão pretendida** (o problema) | abertura do Draft PR     | sim (todo Ready)    | `governance-pr-check` (Ready)                   |
| **#2 Capacidade construída**         | fechamento de checkpoint | opcional            | nenhum                                          |
| **#3 Valor entregue** (antes/depois) | Ready for review         | sim (todo Ready)    | `governance-pr-check` (Ready)                   |
| **#4 Convergência da stack**         | Integration PR           | sim (se há stack)   | `governance-pr-check` (Integration) + readiness |
| imagens → `assets/`                  | encerramento             | publicação (R4)     | **R4** (degradável: deferral declarado)         |

O gate aceita o **prompt** (bloco `…`) **ou** a imagem (que o satisfaz). Draft é isento (intenção em formação): preencha os prompts **antes** de marcar Ready. As imagens são geradas a partir dos prompts e promovidas em R4 — se um gerador estiver indisponível, R4 fecha com deferral declarado (os prompts ficam preservados). Experiência mínima garantida a qualquer reviewer: em qualquer PR em Ready vê **Problema + Valor**; no Integration PR, **+ Convergência**.

---

## Comandos de referência rápida

| Comando                                                            | Para quê                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `npm run guidelines -- workflow`                                   | Wizard com todas as opções do ciclo                                                   |
| `npm run guidelines -- handoff [spec]`                             | Retomada derivada: fatos + próxima ação única + selo                                  |
| `npm run handoff:check -- [--spec NNNN]`                           | Advisory de freshness da retomada (fontes + selo)                                     |
| `npm run guidelines -- work`                                       | Briefing governado de TRABALHO (modo + escopo/autoridade/validações/parada/relatório) |
| `npm run guidelines -- work --authorization explicit-work-request` | Autoriza commit/push no objeto inferido (pedido humano explícito)                     |
| `npm run guidelines -- review <tipo>`                              | Briefing governado de review (catálogo extensível)                                    |
| `npm run guidelines -- review types`                               | Catálogo de tipos (origem/aliases/requirement default)                                |
| `npm run guidelines -- review policy`                              | Requirements efetivos no contexto (força/estado/blocking)                             |
| `npm run review:publish -- --file <artefato>`                      | Commit exclusivo + push do review (autorização escopada)                              |
| `npm run pr-ready:check -- --pr <n>`                               | Precondições de Ready (etapa de fechamento; read-only)                                |
| `npm run guidelines -- continue`                                   | Briefing da spec ativa + verificação de autorização                                   |
| `npm run guidelines -- review [<pr>]`                              | Coleta e estrutura comentários de um PR para análise                                  |
| `npm run guidelines -- release-prep [--version <v>]`               | Prepara bump de versão com plano explícito                                            |
| `npm run guidelines -- release-prep --dry-run`                     | Audita a release sem aplicar nada                                                     |

---

## Diagrama visual

Um prompt de imagem para gerar a versão visual deste fluxo está em `docs/editorial/workflow-guide.prompt.md`. Cole em qualquer gerador de imagem (Midjourney, DALL-E, etc.) para obter o diagrama.

---

## Referências

| Precisa de                                             | Onde encontrar                           |
| ------------------------------------------------------ | ---------------------------------------- |
| Mecânica dos artefatos (spec.md, plan.md, tasks.md...) | `.core/process/governance-foundation.md` |
| Como contribuir (commits, PRs, setup local)            | `CONTRIBUTING.md`                        |
| Backlog de próximas specs                              | `.governance/specs/roadmap/backlog.md`   |
| Specs concluídas                                       | `.governance/specs/roadmap/historico.md` |
| Pesquisas consolidadas                                 | `.governance/specs/research-index.md`    |
| Fluxo obrigatório para agentes IA                      | `AGENTS.md`                              |
